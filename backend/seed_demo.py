"""
Demo data seeder for HireFlow AI.
Run this script once to populate MongoDB with realistic demo content.

Usage:
    cd backend
    python seed_demo.py
"""

import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.hireflow_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_RECRUITER = {
    "name": "Alex Rivera",
    "email": "demo@hireflow.ai",
    "password": pwd_context.hash("demo1234"),
    "role": "recruiter",
    "created_at": datetime.utcnow(),
}

DEMO_JOBS = [
    {
        "title": "Senior Frontend Engineer",
        "job_type": "Full-time",
        "experience_level": "5+ years",
        "salary_range": "$130k – $160k",
        "skills_required": ["React", "TypeScript", "Tailwind CSS", "GraphQL", "Vite"],
        "description": "We're looking for a seasoned frontend engineer to lead our product UI. You'll work alongside design to build pixel-perfect, high-performance user interfaces that delight our customers.",
        "requirements": [
            "5+ years of React experience",
            "Strong TypeScript skills",
            "Experience with component libraries and design systems",
            "Familiarity with GraphQL or REST APIs",
        ],
        "status": "open",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "AI/ML Engineer",
        "job_type": "Full-time",
        "experience_level": "3–5 years",
        "salary_range": "$140k – $175k",
        "skills_required": ["Python", "PyTorch", "Hugging Face", "FastAPI", "LLMs"],
        "description": "Join our AI team to build the next generation of intelligent recruitment features. You'll train, fine-tune, and deploy large language models in production environments.",
        "requirements": [
            "Deep expertise in Python and ML frameworks",
            "Hands-on experience with transformer models",
            "Ability to deploy ML models via REST APIs",
            "Experience with Hugging Face ecosystem",
        ],
        "status": "open",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Product Manager — Growth",
        "job_type": "Full-time",
        "experience_level": "3+ years",
        "salary_range": "$110k – $140k",
        "skills_required": ["Product Strategy", "A/B Testing", "SQL", "Figma", "Roadmapping"],
        "description": "Lead growth product initiatives from ideation to launch. You will own the full product discovery cycle, work closely with engineering and design, and drive measurable business outcomes.",
        "requirements": [
            "3+ years of product management experience",
            "Strong analytical mindset and data-driven decision making",
            "Excellent written and verbal communication",
            "Experience with B2B SaaS products",
        ],
        "status": "open",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Backend Engineer (Python/FastAPI)",
        "job_type": "Full-time",
        "experience_level": "3–6 years",
        "salary_range": "$120k – $155k",
        "skills_required": ["Python", "FastAPI", "MongoDB", "Docker", "AWS"],
        "description": "Build and scale the core API powering HireFlow AI. You'll design highly available microservices, optimize database performance, and collaborate with frontend teams.",
        "requirements": [
            "Strong Python and async programming skills",
            "Experience with FastAPI or similar frameworks",
            "Knowledge of MongoDB and database design",
            "Familiarity with containerization (Docker, Kubernetes)",
        ],
        "status": "open",
        "created_at": datetime.utcnow(),
    },
    {
        "title": "UX/UI Designer",
        "job_type": "Full-time",
        "experience_level": "2–4 years",
        "salary_range": "$90k – $120k",
        "skills_required": ["Figma", "User Research", "Prototyping", "Design Systems", "Framer"],
        "description": "Shape the visual identity and user experience of HireFlow AI. You'll conduct user research, create wireframes and high-fidelity designs, and own the design system.",
        "requirements": [
            "Proficient in Figma and modern design tools",
            "Experience building and maintaining design systems",
            "Strong portfolio demonstrating B2B SaaS product design",
            "Ability to collaborate closely with engineers",
        ],
        "status": "open",
        "created_at": datetime.utcnow(),
    },
]

DEMO_CANDIDATES = [
    {
        "name": "Sophia Zhang",
        "email": "sophia.zhang@email.com",
        "phone": "+1-415-555-0101",
        "status": "interview",
        "match_score": 96,
        "ai_insights": {
            "match_score": 96,
            "summary": "Sophia is an exceptionally strong match for the Senior Frontend Engineer role. Her 6 years of React experience, TypeScript mastery, and open-source contributions to major UI libraries make her a top-tier candidate. She demonstrates deep knowledge of modern frontend tooling.",
            "good_points": ["6 years React/TypeScript", "Design system contributor", "GraphQL expertise", "Mentored junior devs"],
            "missing_points": ["Vite exposure limited"],
            "recommendation_label": "Strong Fit",
            "interview_questions": [
                "Walk me through how you've architected a design system from scratch.",
                "How do you approach performance optimization in large React applications?",
                "Describe a time you led a significant frontend refactor. What did you learn?"
            ]
        },
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Marcus Johnson",
        "email": "marcus.j@email.com",
        "phone": "+1-312-555-0202",
        "status": "screening",
        "match_score": 88,
        "ai_insights": {
            "match_score": 88,
            "summary": "Marcus has solid React experience with 4 years of professional work. His recent projects show good TypeScript adoption and he has built custom hooks extensively. He lacks GraphQL exposure but picks up technologies quickly based on his trajectory.",
            "good_points": ["4 years React experience", "Custom hooks library author", "Strong CSS/animation skills"],
            "missing_points": ["No GraphQL experience", "Limited TypeScript on large codebases"],
            "recommendation_label": "Strong Fit",
            "interview_questions": [
                "How do you manage complex state across deeply nested components?",
                "What's your strategy for handling API data fetching in React?",
                "How would you approach learning GraphQL if given 2 weeks?"
            ]
        },
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Priya Nair",
        "email": "priya.nair@email.com",
        "phone": "+1-650-555-0303",
        "status": "new",
        "match_score": 72,
        "ai_insights": {
            "match_score": 72,
            "summary": "Priya has a strong academic background in computer science and 2 years of frontend work. Her portfolio shows clean code and good design sensibility, but she lacks the depth of experience expected for a senior role. She could be a great mid-level hire.",
            "good_points": ["Clean code practices", "Good eye for design", "Eager learner"],
            "missing_points": ["Only 2 years experience", "No TypeScript at scale", "No GraphQL", "Limited team leadership"],
            "recommendation_label": "Moderate Fit",
            "interview_questions": [
                "Tell me about the most complex UI component you've built.",
                "How have you contributed to code reviews in your current team?",
                "Where do you see yourself in your frontend career in 2 years?"
            ]
        },
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Daniel Kim",
        "email": "d.kim@email.com",
        "phone": "+1-206-555-0404",
        "status": "hired",
        "match_score": 98,
        "ai_insights": {
            "match_score": 98,
            "summary": "Daniel is an outstanding match. He brings 8 years of React expertise, has shipped design systems used by over 50 engineers, and his work on open source Vite plugins directly aligns with our tech stack. A rare find.",
            "good_points": ["8 years React mastery", "Vite plugin author", "Design system at scale", "GraphQL + TypeScript expert", "Team lead experience"],
            "missing_points": [],
            "recommendation_label": "Strong Fit",
            "interview_questions": [
                "How did you scale your design system to support 50+ engineers?",
                "What's your approach to maintaining backward compatibility in public APIs?",
                "Tell me about a time you had to make a hard architectural decision."
            ]
        },
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Aisha Patel",
        "email": "aisha.patel@email.com",
        "phone": "+1-617-555-0505",
        "status": "new",
        "match_score": 54,
        "ai_insights": {
            "match_score": 54,
            "summary": "Aisha comes from a backend-heavy background and is transitioning into full-stack work. Her React skills are foundational and she would need significant ramp-up time. She shows strong problem-solving ability but is not ready for a senior frontend role at this time.",
            "good_points": ["Strong problem solving", "Python/Django background", "Motivated to learn"],
            "missing_points": ["React experience <1 year", "No TypeScript", "No GraphQL", "No design system experience", "Limited CSS skills"],
            "recommendation_label": "Weak Fit",
            "interview_questions": [
                "What's your plan to deepen your React expertise?",
                "How do you approach learning a new frontend framework?",
                "Describe your most complex web project."
            ]
        },
        "created_at": datetime.utcnow(),
    },
]


async def seed():
    print("🌱 Starting HireFlow AI demo seed...")

    # Create demo recruiter
    existing = await db.users.find_one({"email": DEMO_RECRUITER["email"]})
    if existing:
        recruiter_id = str(existing["_id"])
        print(f"  ✓ Demo recruiter already exists (id: {recruiter_id})")
    else:
        result = await db.users.insert_one(DEMO_RECRUITER)
        recruiter_id = str(result.inserted_id)
        print(f"  ✓ Created demo recruiter (id: {recruiter_id})")

    # Create demo jobs
    existing_jobs = await db.jobs.count_documents({"recruiter_id": recruiter_id})
    if existing_jobs == 0:
        for job in DEMO_JOBS:
            job["recruiter_id"] = recruiter_id
        await db.jobs.insert_many(DEMO_JOBS)
        print(f"  ✓ Inserted {len(DEMO_JOBS)} demo jobs")
    else:
        print(f"  ✓ Demo jobs already exist ({existing_jobs} found)")

    # Link candidates to first job
    first_job = await db.jobs.find_one({"recruiter_id": recruiter_id})
    if first_job:
        existing_candidates = await db.candidates.count_documents({})
        if existing_candidates == 0:
            for c in DEMO_CANDIDATES:
                c["applied_job_id"] = str(first_job["_id"])
                c["resume_text"] = "(Demo candidate — no real resume)"
            await db.candidates.insert_many(DEMO_CANDIDATES)
            print(f"  ✓ Inserted {len(DEMO_CANDIDATES)} demo candidates")
        else:
            print(f"  ✓ Demo candidates already exist ({existing_candidates} found)")

    print("\n✅ Seed complete!")
    print("   Demo Login → email: demo@hireflow.ai  |  password: demo1234")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
