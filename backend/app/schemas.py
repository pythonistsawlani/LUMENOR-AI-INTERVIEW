from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class UserOut(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    is_verified: bool = False
    role: str = "recruiter"
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = {
        "populate_by_name": True
    }

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# --- JOB SCHEMAS ---

class JobBase(BaseModel):
    title: str
    job_type: str = "Full-time"
    experience_level: str = ""
    salary_range: Optional[str] = None
    skills_required: List[str] = []
    description: str
    requirements: List[str]
    status: str = "open"

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: str = Field(alias="_id")
    recruiter_id: str
    created_at: datetime
    
    model_config = {
        "populate_by_name": True
    }

# --- CANDIDATE SCHEMAS ---

class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    applied_job_id: str
    status: str = "new"

class CandidateCreate(CandidateBase):
    resume_text: str

class AIInsights(BaseModel):
    match_score: int
    summary: str
    good_points: List[str]
    missing_points: List[str]
    recommendation_label: str
    interview_questions: List[str]

class CandidateOut(CandidateBase):
    id: str = Field(alias="_id")
    match_score: Optional[int] = None
    ai_insights: Optional[AIInsights] = None
    created_at: datetime

    model_config = {
        "populate_by_name": True
    }

# --- INTERVIEW SCHEMAS ---

class InterviewMessage(BaseModel):
    role: str # user or assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class InterviewSessionCreate(BaseModel):
    candidate_id: str
    job_id: str
    difficulty: str = "medium"
    total_questions: int = 6
    focus_areas: List[str] = []
    custom_instructions: Optional[str] = None

class InterviewInviteCreate(InterviewSessionCreate):
    expires_in_hours: int = 48

class InterviewInviteOut(BaseModel):
    session_id: str
    interview_url: str
    expires_at: datetime

class InterviewSessionOut(BaseModel):
    id: str = Field(alias="_id")
    candidate_id: str
    job_id: str
    status: str = "ongoing" # ongoing, invited, completed
    history: List[InterviewMessage] = []
    final_report: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[EmailStr] = None
    job_title: Optional[str] = None
    total_questions: int = 6
    difficulty: str = "medium"
    focus_areas: List[str] = []
    custom_instructions: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {
        "populate_by_name": True
    }
