import os
import hashlib
import uuid
import smtplib
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from typing import List, Optional
from bson import ObjectId
from pymongo.errors import PyMongoError
from datetime import datetime
from datetime import timedelta
import pymupdf
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

from .db import get_db, init_db
from .schemas import JobCreate, JobOut, CandidateOut, AIInsights, UserCreate, UserOut, Token
from .ai_service import ResumeAI
from .auth import get_password_hash, verify_password, create_access_token, get_current_user
from .auth import ACCESS_TOKEN_EXPIRE_MINUTES

from .routers import interviews

app = FastAPI(title="HireFlow AI Backend", version="2.0.0")

# Register Routers
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])

# ---- Production-ready CORS ----
ENV_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin.strip()]
DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5175"]
ALLOWED_ORIGINS = ENV_ORIGINS if ENV_ORIGINS else DEFAULT_ORIGINS

print(f"Starting server with origins: {ALLOWED_ORIGINS}")

@app.on_event("startup")
async def startup_db_client():
    print("Running startup tasks...")
    await init_db()
    print("Startup complete.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_MB = 5
ai = ResumeAI()
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

def fix_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def parse_object_id(value: str, field_name: str = "id"):
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return ObjectId(value)


def _hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _generate_numeric_code() -> str:
    return str(uuid.uuid4().int % 1000000).zfill(6)


async def _send_email(to_email: str, subject: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")
    if not all([smtp_host, smtp_username, smtp_password, smtp_from]):
        print(f"[Email Disabled] Subject={subject} To={to_email} Body={body}")
        return False

    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = to_email

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
    return True

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health/db")
async def health_db():
    try:
        db = await get_db()
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except PyMongoError as exc:
        print(f"Database health check failed: {exc}")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "unavailable"},
        )

# --- AUTH ---
@app.post("/api/auth/register", response_model=UserOut)
async def register(user: UserCreate):
    db = await get_db()
    try:
        if await db.users.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered")

        user_dict = user.dict()
        user_dict["password"] = get_password_hash(user_dict["password"])
        user_dict["created_at"] = datetime.utcnow()

        result = await db.users.insert_one(user_dict)
        created_user = await db.users.find_one({"_id": result.inserted_id})
        return fix_id(created_user)
    except HTTPException:
        raise
    except PyMongoError as exc:
        print(f"Database error during registration: {exc}")
        raise HTTPException(status_code=503, detail="Database connection failed. Check backend MONGO_URI.")

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = await get_db()
    try:
        user = await db.users.find_one({"email": form_data.username})
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password")

        access_token = create_access_token(
            data={"sub": str(user["_id"]), "type": "access"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
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
    except HTTPException:
        raise
    except PyMongoError as exc:
        print(f"Database error during login: {exc}")
        raise HTTPException(status_code=503, detail="Database connection failed. Check backend MONGO_URI.")

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


@app.get("/api/public/jobs/{job_id}")
async def get_public_job(job_id: str):
    db = await get_db()
    job = await db.jobs.find_one({"_id": parse_object_id(job_id, "job_id"), "status": "open"})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.pop("recruiter_id", None)
    return fix_id(job)


@app.post("/api/public/jobs/{job_id}/request-code")
async def request_apply_code(job_id: str, payload: dict):
    db = await get_db()
    job = await db.jobs.find_one({"_id": parse_object_id(job_id, "job_id"), "status": "open"})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    email = (payload.get("email") or "").strip().lower()
    name = (payload.get("name") or "").strip()
    if not email or not name:
        raise HTTPException(status_code=400, detail="Name and email are required")

    code = _generate_numeric_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.apply_email_codes.update_one(
        {"job_id": job_id, "email": email},
        {
            "$set": {
                "job_id": job_id,
                "email": email,
                "name": name,
                "code_hash": _hash_value(code),
                "expires_at": expires_at,
                "verified": False,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )
    await _send_email(
        to_email=email,
        subject=f"Your verification code for {job['title']}",
        body=f"Hi {name},\n\nYour HireFlow verification code is: {code}\nThis code expires in 10 minutes.",
    )
    return {"message": "Verification code sent"}


@app.post("/api/public/jobs/{job_id}/verify-code")
async def verify_apply_code(job_id: str, payload: dict):
    db = await get_db()
    email = (payload.get("email") or "").strip().lower()
    code = (payload.get("code") or "").strip()
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code are required")

    code_doc = await db.apply_email_codes.find_one({"job_id": job_id, "email": email})
    if not code_doc:
        raise HTTPException(status_code=404, detail="No verification request found")
    if datetime.utcnow() > code_doc["expires_at"]:
        raise HTTPException(status_code=410, detail="Verification code expired")
    if code_doc.get("code_hash") != _hash_value(code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    token = uuid.uuid4().hex
    await db.apply_email_tokens.insert_one(
        {
            "job_id": job_id,
            "email": email,
            "token_hash": _hash_value(token),
            "expires_at": datetime.utcnow() + timedelta(minutes=20),
            "created_at": datetime.utcnow(),
        }
    )
    await db.apply_email_codes.update_one(
        {"_id": code_doc["_id"]},
        {"$set": {"verified": True, "verified_at": datetime.utcnow()}},
    )
    return {"verification_token": token, "expires_in_minutes": 20}

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


async def _parse_resume_file(resume: UploadFile) -> str:
    pdf_bytes = await resume.read()
    if len(pdf_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_UPLOAD_MB}MB allowed.")
    if not resume.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        resume_text = ""
        for page in doc:
            resume_text += page.get_text()
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="PDF appears to be empty or unreadable.")
        return resume_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

@app.post("/api/candidates", response_model=CandidateOut)
async def create_candidate(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    applied_job_id: str = Form(...),
    resume: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user),
):
    db = await get_db()
    
    job = await db.jobs.find_one({"_id": parse_object_id(applied_job_id, "applied_job_id"), "recruiter_id": current_user_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    resume_text = await _parse_resume_file(resume)

    candidate_dict = {
        "name": name,
        "email": email,
        "phone": phone,
        "applied_job_id": applied_job_id,
        "recruiter_id": current_user_id,
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


@app.post("/api/public/jobs/{job_id}/apply", response_model=CandidateOut)
async def apply_candidate_public(
    background_tasks: BackgroundTasks,
    job_id: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    verification_token: str = Form(...),
    resume: UploadFile = File(...),
):
    db = await get_db()
    job = await db.jobs.find_one({"_id": parse_object_id(job_id, "job_id"), "status": "open"})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    token_doc = await db.apply_email_tokens.find_one(
        {"job_id": job_id, "email": email.strip().lower(), "token_hash": _hash_value(verification_token)}
    )
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid verification token")
    if datetime.utcnow() > token_doc["expires_at"]:
        raise HTTPException(status_code=410, detail="Verification token expired")

    resume_text = await _parse_resume_file(resume)
    candidate_dict = {
        "name": name.strip(),
        "email": email.strip().lower(),
        "phone": phone,
        "applied_job_id": job_id,
        "recruiter_id": job["recruiter_id"],
        "status": "new",
        "resume_text": resume_text,
        "match_score": None,
        "ai_insights": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.candidates.insert_one(candidate_dict)
    created_candidate = await db.candidates.find_one({"_id": result.inserted_id})

    await db.apply_email_tokens.delete_one({"_id": token_doc["_id"]})
    background_tasks.add_task(process_resume_background, str(result.inserted_id), resume_text, job_id)
    return fix_id(created_candidate)

@app.get("/api/candidates", response_model=List[CandidateOut])
async def get_candidates(job_id: str = None, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    
    query = {"recruiter_id": current_user_id}
    if job_id:
        owned_job = await db.jobs.find_one({"_id": parse_object_id(job_id, "job_id"), "recruiter_id": current_user_id})
        if not owned_job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        query["applied_job_id"] = job_id
        
    candidates = await db.candidates.find(query).to_list(100)
    for c in candidates:
        c.pop("resume_text", None)
    return [fix_id(c) for c in candidates]

@app.patch("/api/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: str, status: str, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    valid_statuses = ["new", "screening", "interview", "interviewed", "hired"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    result = await db.candidates.update_one(
        {"_id": parse_object_id(candidate_id, "candidate_id"), "recruiter_id": current_user_id},
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
    total_candidates = await db.candidates.count_documents({"recruiter_id": current_user_id})
    
    pipeline_counts = {}
    for status in ["new", "screening", "interview", "interviewed", "hired"]:
        pipeline_counts[status] = await db.candidates.count_documents({"status": status, "recruiter_id": current_user_id})
    
    # Average match score
    candidates_with_score = await db.candidates.find(
        {"match_score": {"$ne": None}, "recruiter_id": current_user_id},
        {"match_score": 1}
    ).to_list(500)
    
    avg_match = 0
    if candidates_with_score:
        avg_match = round(
            sum(c["match_score"] for c in candidates_with_score) / len(candidates_with_score), 1
        )
    
    # Top 5 candidates by match score
    top_candidates = await db.candidates.find(
        {"match_score": {"$ne": None}, "recruiter_id": current_user_id},
        {"name": 1, "email": 1, "match_score": 1, "status": 1, "ai_insights": 1}
    ).sort("match_score", -1).limit(5).to_list(5)
    
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "avg_match_score": avg_match,
        "pipeline_counts": pipeline_counts,
        "top_candidates": [fix_id(c) for c in top_candidates]
    }
