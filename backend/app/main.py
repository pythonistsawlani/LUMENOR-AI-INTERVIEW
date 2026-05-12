import os
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import pymupdf
from dotenv import load_dotenv

load_dotenv()

from .db import get_db, init_db
from .schemas import JobCreate, JobOut, CandidateOut, AIInsights, UserCreate, UserOut, Token
from .ai_service import ResumeAI
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(title="HireFlow AI Backend", version="2.0.0")

# ---- Production-ready CORS ----
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

@app.on_event("startup")
async def startup_db_client():
    await init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_MB = 5
ai = ResumeAI()

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# --- AUTH ---
@app.post("/api/auth/register", response_model=UserOut)
async def register(user: UserCreate):
    db = await get_db()
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    return fix_id(created_user)

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_db()
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": str(user["_id"])})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

# --- JOBS ---

@app.post("/api/jobs", response_model=JobOut)
async def create_job(job: JobCreate, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    job_dict = job.dict()
    job_dict["recruiter_id"] = current_user_id
    job_dict["created_at"] = datetime.utcnow()
    
    result = await db.jobs.insert_one(job_dict)
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    return fix_id(created_job)

@app.get("/api/jobs", response_model=List[JobOut])
async def get_jobs():
    db = await get_db()
    # Public endpoint to view open jobs
    jobs = await db.jobs.find({"status": "open"}).to_list(100)
    return [fix_id(job) for job in jobs]

@app.get("/api/my-jobs", response_model=List[JobOut])
async def get_my_jobs(current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    jobs = await db.jobs.find({"recruiter_id": current_user_id}).to_list(100)
    return [fix_id(job) for job in jobs]

# --- CANDIDATES ---

async def process_resume_background(candidate_id: str, resume_text: str, job_id: str):
    db = await get_db()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return
        
    analysis = ai.analyze_resume(
        resume_text=resume_text,
        job_description=job["description"],
        job_requirements=job["requirements"]
    )
    
    await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {
            "match_score": analysis["match_score"],
            "ai_insights": analysis
        }}
    )

@app.post("/api/candidates", response_model=CandidateOut)
async def create_candidate(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    applied_job_id: str = Form(...),
    resume: UploadFile = File(...)
):
    db = await get_db()
    
    job = await db.jobs.find_one({"_id": ObjectId(applied_job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        pdf_bytes = await resume.read()
        
        # Validate file size (5MB limit)
        if len(pdf_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_UPLOAD_MB}MB allowed.")
        
        # Validate file type
        if not resume.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
        
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        resume_text = ""
        for page in doc:
            resume_text += page.get_text()
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="PDF appears to be empty or unreadable.")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    candidate_dict = {
        "name": name,
        "email": email,
        "phone": phone,
        "applied_job_id": applied_job_id,
        "status": "new",
        "resume_text": resume_text,
        "match_score": None,
        "ai_insights": None,
        "created_at": datetime.utcnow()
    }
    
    result = await db.candidates.insert_one(candidate_dict)
    created_candidate = await db.candidates.find_one({"_id": result.inserted_id})
    
    background_tasks.add_task(
        process_resume_background, 
        str(result.inserted_id), 
        resume_text, 
        applied_job_id
    )
    
    return fix_id(created_candidate)

@app.get("/api/candidates", response_model=List[CandidateOut])
async def get_candidates(job_id: str = None, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    
    # Optional: Verify that the current user owns the job
    query = {}
    if job_id:
        query["applied_job_id"] = job_id
        
    candidates = await db.candidates.find(query).to_list(100)
    for c in candidates:
        c.pop("resume_text", None)
    return [fix_id(c) for c in candidates]

@app.patch("/api/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: str, status: str, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    valid_statuses = ["new", "screening", "interview", "hired"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    result = await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    return {"status": "updated"}

# --- ANALYTICS ---

@app.get("/api/analytics/summary")
async def get_analytics_summary(current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    
    # Aggregate pipeline counts
    total_jobs = await db.jobs.count_documents({"recruiter_id": current_user_id})
    total_candidates = await db.candidates.count_documents({})
    
    pipeline_counts = {}
    for status in ["new", "screening", "interview", "hired"]:
        pipeline_counts[status] = await db.candidates.count_documents({"status": status})
    
    # Average match score
    candidates_with_score = await db.candidates.find(
        {"match_score": {"$ne": None}},
        {"match_score": 1}
    ).to_list(500)
    
    avg_match = 0
    if candidates_with_score:
        avg_match = round(
            sum(c["match_score"] for c in candidates_with_score) / len(candidates_with_score), 1
        )
    
    # Top 5 candidates by match score
    top_candidates = await db.candidates.find(
        {"match_score": {"$ne": None}},
        {"name": 1, "email": 1, "match_score": 1, "status": 1, "ai_insights": 1}
    ).sort("match_score", -1).limit(5).to_list(5)
    
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "avg_match_score": avg_match,
        "pipeline_counts": pipeline_counts,
        "top_candidates": [fix_id(c) for c in top_candidates]
    }
