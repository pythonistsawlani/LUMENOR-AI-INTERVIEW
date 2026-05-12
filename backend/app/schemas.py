from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "recruiter" # recruiter or candidate

class UserOut(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    
    model_config = {
        "populate_by_name": True
    }

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
