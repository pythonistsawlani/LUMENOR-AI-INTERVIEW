import hashlib
import os
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Body
from app.db import get_db
from app.schemas import (
    InterviewSessionCreate,
    InterviewSessionOut,
    InterviewMessage,
    InterviewInviteCreate,
    InterviewInviteOut,
)
from app.ai_service import InterviewAI
from app.auth import get_current_user
import uuid

router = APIRouter()
ai = InterviewAI()

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")


def _parse_object_id(value: str, field_name: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return ObjectId(value)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _get_owned_candidate_and_job(db, candidate_id: str, job_id: str, recruiter_id: str):
    job = await db.jobs.find_one({"_id": _parse_object_id(job_id, "job_id"), "recruiter_id": recruiter_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    candidate = await db.candidates.find_one({"_id": _parse_object_id(candidate_id, "candidate_id"), "applied_job_id": job_id})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found for selected job")

    return candidate, job


async def _send_interview_email(candidate_email: str, candidate_name: str, job_title: str, interview_url: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM")

    if not all([smtp_host, smtp_username, smtp_password, smtp_from]):
        print(f"[Interview Invite] SMTP not configured. Share manually: {interview_url}")
        return False

    msg = MIMEMultipart()
    msg["From"] = smtp_from
    msg["To"] = candidate_email
    msg["Subject"] = f"Interview Invite - {job_title}"

    body = (
        f"Hi {candidate_name},\n\n"
        f"You have been shortlisted for the {job_title} role.\n"
        f"Please complete your AI interview using this secure link:\n\n"
        f"{interview_url}\n\n"
        f"This link is time-limited and should not be shared.\n\n"
        f"Best regards,\nRecruitment Team"
    )
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_from, [candidate_email], msg.as_string())

    return True


def _serialize_session(session, candidate=None, job=None):
    session["_id"] = str(session["_id"])
    if candidate:
        session["candidate_name"] = candidate.get("name")
        session["candidate_email"] = candidate.get("email")
    if job:
        session["job_title"] = job.get("title")
    return session


async def _create_session(db, payload: InterviewSessionCreate, recruiter_id: str):
    candidate, job = await _get_owned_candidate_and_job(db, payload.candidate_id, payload.job_id, recruiter_id)

    now = datetime.utcnow()
    session = {
        "candidate_id": payload.candidate_id,
        "job_id": payload.job_id,
        "recruiter_id": recruiter_id,
        "status": "ongoing",
        "history": [],
        "final_report": None,
        "difficulty": payload.difficulty.lower().strip(),
        "total_questions": max(3, min(payload.total_questions, 12)),
        "focus_areas": payload.focus_areas,
        "custom_instructions": payload.custom_instructions,
        "question_count": 0,
        "created_at": now,
    }

    result = await db.interview_sessions.insert_one(session)
    session["_id"] = result.inserted_id

    resume_summary = candidate.get("ai_insights", {}).get("summary", "Candidate with relevant skills.")
    initial_question = await ai.generate_next_question(
        job_title=job["title"],
        job_desc=job["description"],
        resume_summary=resume_summary,
        history=[],
        difficulty=session["difficulty"],
        focus_areas=session["focus_areas"],
        custom_instructions=session["custom_instructions"],
    )

    msg = {"role": "assistant", "content": initial_question, "timestamp": datetime.utcnow()}
    await db.interview_sessions.update_one(
        {"_id": session["_id"]},
        {"$push": {"history": msg}, "$set": {"question_count": 1}},
    )
    session["history"] = [msg]
    session["question_count"] = 1

    return _serialize_session(session, candidate, job)

@router.post("/generate", response_model=InterviewSessionOut)
async def generate_interview_session(
    session_data: InterviewSessionCreate,
    current_user_id: str = Depends(get_current_user),
):
    db = await get_db()
    return await _create_session(db, session_data, current_user_id)


@router.post("/invite", response_model=InterviewInviteOut)
async def create_interview_invite(
    invite_data: InterviewInviteCreate,
    current_user_id: str = Depends(get_current_user),
):
    db = await get_db()
    session = await _create_session(db, invite_data, current_user_id)
    plain_token = uuid.uuid4().hex
    token_hash = _hash_token(plain_token)
    expires_at = datetime.utcnow() + timedelta(hours=max(2, min(invite_data.expires_in_hours, 168)))

    await db.interview_sessions.update_one(
        {"_id": _parse_object_id(session["_id"], "session_id")},
        {"$set": {"access_token_hash": token_hash, "expires_at": expires_at, "status": "invited"}},
    )

    interview_url = f"{FRONTEND_BASE_URL}/interview/{session['_id']}?token={plain_token}"
    await _send_interview_email(
        candidate_email=session["candidate_email"],
        candidate_name=session["candidate_name"] or "Candidate",
        job_title=session["job_title"] or "the role",
        interview_url=interview_url,
    )

    return {"session_id": session["_id"], "interview_url": interview_url, "expires_at": expires_at}

@router.get("/{session_id}", response_model=InterviewSessionOut)
async def get_interview_session(session_id: str, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    session = await db.interview_sessions.find_one(
        {"_id": _parse_object_id(session_id, "session_id"), "recruiter_id": current_user_id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    candidate = await db.candidates.find_one({"_id": _parse_object_id(session["candidate_id"], "candidate_id")})
    job = await db.jobs.find_one({"_id": _parse_object_id(session["job_id"], "job_id")})
    return _serialize_session(session, candidate, job)

@router.post("/{session_id}/message", response_model=InterviewMessage)
async def send_message(
    session_id: str,
    message: str = Body(..., embed=True),
    current_user_id: str = Depends(get_current_user),
):
    db = await get_db()
    session = await db.interview_sessions.find_one(
        {"_id": _parse_object_id(session_id, "session_id"), "recruiter_id": current_user_id}
    )
    if not session or session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Invalid session status")
    return await _send_message_to_session(db, session, message)

@router.post("/{session_id}/complete")
async def complete_interview(session_id: str, current_user_id: str = Depends(get_current_user)):
    db = await get_db()
    session = await db.interview_sessions.find_one(
        {"_id": _parse_object_id(session_id, "session_id"), "recruiter_id": current_user_id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return await _complete_session(db, session_id, session)


async def _send_message_to_session(db, session, message: str):
    if not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_msg = {"role": "user", "content": message.strip(), "timestamp": datetime.utcnow()}
    session_id = str(session["_id"])
    await db.interview_sessions.update_one({"_id": session["_id"]}, {"$push": {"history": user_msg}})
    session["history"].append(user_msg)

    if session.get("question_count", 0) >= session.get("total_questions", 6):
        return {"role": "assistant", "content": "Thanks. You have completed all planned questions.", "timestamp": datetime.utcnow()}

    candidate = await db.candidates.find_one({"_id": _parse_object_id(session["candidate_id"], "candidate_id")})
    job = await db.jobs.find_one({"_id": _parse_object_id(session["job_id"], "job_id")})
    resume_summary = candidate.get("ai_insights", {}).get("summary", "Candidate with relevant skills.")
    next_question = await ai.generate_next_question(
        job_title=job["title"],
        job_desc=job["description"],
        resume_summary=resume_summary,
        history=session["history"],
        difficulty=session.get("difficulty", "medium"),
        focus_areas=session.get("focus_areas", []),
        custom_instructions=session.get("custom_instructions"),
    )

    assistant_msg = {"role": "assistant", "content": next_question, "timestamp": datetime.utcnow()}
    await db.interview_sessions.update_one(
        {"_id": session["_id"]},
        {"$push": {"history": assistant_msg}, "$inc": {"question_count": 1}},
    )
    return assistant_msg


async def _complete_session(db, session_id: str, session):
    final_report = await ai.generate_final_report(session["history"])
    await db.interview_sessions.update_one(
        {"_id": _parse_object_id(session_id, "session_id")},
        {"$set": {"status": "completed", "final_report": final_report}},
    )
    await db.candidates.update_one(
        {"_id": _parse_object_id(session["candidate_id"], "candidate_id")},
        {"$set": {"status": "interviewed"}},
    )
    return {"status": "completed", "report": final_report}


async def _get_public_session_by_token(db, access_token: str):
    token_hash = _hash_token(access_token)
    session = await db.interview_sessions.find_one({"access_token_hash": token_hash})
    if not session:
        raise HTTPException(status_code=404, detail="Interview link is invalid")
    if session.get("expires_at") and datetime.utcnow() > session["expires_at"]:
        raise HTTPException(status_code=410, detail="Interview link has expired")
    return session


@router.get("/public/{access_token}", response_model=InterviewSessionOut)
async def get_public_interview_session(access_token: str):
    db = await get_db()
    session = await _get_public_session_by_token(db, access_token)
    candidate = await db.candidates.find_one({"_id": _parse_object_id(session["candidate_id"], "candidate_id")})
    job = await db.jobs.find_one({"_id": _parse_object_id(session["job_id"], "job_id")})
    return _serialize_session(session, candidate, job)


@router.post("/public/{access_token}/message", response_model=InterviewMessage)
async def send_public_message(access_token: str, message: str = Body(..., embed=True)):
    db = await get_db()
    session = await _get_public_session_by_token(db, access_token)
    if session.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")
    return await _send_message_to_session(db, session, message)


@router.post("/public/{access_token}/complete")
async def complete_public_interview(access_token: str):
    db = await get_db()
    session = await _get_public_session_by_token(db, access_token)
    return await _complete_session(db, str(session["_id"]), session)
