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

CANDIDATE_RESUMES = {
    "Sophia Zhang": """SOPHIA ZHANG
Frontend Engineer | San Francisco, CA
sophia.zhang@email.com | +1-415-555-0101 | github.com/sophiazhang

SUMMARY
Senior Frontend Engineer with 6+ years of experience building scalable, high-performance web applications. Expert in React, TypeScript, and modern frontend tooling. Open-source contributor to major UI component libraries. Passionate about design systems, developer experience, and accessibility.

EXPERIENCE
Senior Frontend Engineer — Stripe, San Francisco (2021–Present)
• Led redesign of Stripe Dashboard used by 2M+ businesses, improving key task completion by 34%
• Architected a company-wide component library (150+ components) adopted across 6 product teams
• Drove adoption of GraphQL across frontend, reducing API over-fetching by 60%
• Mentored 4 junior engineers; led weekly frontend guild meetings

Frontend Engineer — Figma, San Francisco (2019–2021)
• Built the plugin marketplace UI, supporting 1M+ monthly active users
• Implemented real-time collaborative cursors feature using WebSockets and React context
• Optimized bundle size by 40% through code splitting and tree shaking

EDUCATION
B.S. Computer Science — Stanford University (2019)

SKILLS
React, TypeScript, GraphQL, Next.js, Vite, TailwindCSS, Storybook, Jest, Cypress, WebSockets, Figma

OPEN SOURCE
• react-spectrum contributor (500+ GitHub stars on personal forks)
• Author of ts-hooks-utils (npm: 45k weekly downloads)""",

    "Marcus Johnson": """MARCUS JOHNSON
Frontend Developer | Chicago, IL
marcus.j@email.com | +1-312-555-0202

SUMMARY
Creative frontend developer with 4 years of professional experience. Specialized in building interactive UIs with React and modern CSS. Known for pixel-perfect implementation and smooth animations. Currently expanding into TypeScript and state management at scale.

EXPERIENCE
Frontend Developer — Shopify (Remote) (2022–Present)
• Built merchant-facing analytics dashboard used by 80k+ stores
• Authored a custom React hooks library (useShopify) used across 3 internal teams
• Implemented complex animations with Framer Motion, reducing designer handoff time by 50%

Junior Frontend Developer — Accenture, Chicago (2021–2022)
• Developed responsive UI components for Fortune 500 clients in React
• Collaborated with UX team on accessibility audit, achieving WCAG 2.1 AA compliance
• Integrated REST APIs for real-time data dashboards

EDUCATION
B.S. Information Technology — DePaul University (2020)

SKILLS
React, JavaScript, CSS/Sass, Framer Motion, Webpack, Redux Toolkit, REST APIs, Git, Figma

PROJECTS
• custom-hooks-library (GitHub: 200 stars) — reusable React hooks for common UI patterns
• anime-tracker — personal project: Next.js + TailwindCSS anime discovery app""",

    "Priya Nair": """PRIYA NAIR
Frontend Developer | Palo Alto, CA
priya.nair@email.com | +1-650-555-0303

SUMMARY
Frontend developer with 2 years of experience and strong academic foundation in computer science. Passionate about clean code, accessibility, and design-driven development. Quick learner eager to grow into a senior role.

EXPERIENCE
Frontend Developer — TechBridge Inc., Palo Alto (2023–Present)
• Built UI for an internal project management tool using React and Tailwind CSS
• Implemented dark mode, responsive layouts, and ARIA-compliant components
• Participated in weekly code reviews and sprint planning

Intern — Google, Mountain View (Summer 2022)
• Contributed to the Google Workspace design system documentation site
• Fixed 12 accessibility bugs in the internal component library
• Presented demo at intern showcase to 80+ attendees

EDUCATION
B.S. Computer Science — UC San Diego (2022) | GPA: 3.8/4.0

SKILLS
React, JavaScript, TypeScript (beginner), HTML5, CSS3, TailwindCSS, Git, Figma

PROJECTS
• portfolio-site — Personal portfolio built with Next.js, deployed on Vercel
• weather-app — React weather app using OpenWeather API with unit tests""",

    "Daniel Kim": """DANIEL KIM
Principal Frontend Engineer | Seattle, WA
d.kim@email.com | +1-206-555-0404 | github.com/danielkim-dev

SUMMARY
Principal Frontend Engineer with 8+ years of experience leading complex frontend architecture at scale. Creator of open-source Vite plugins with 50k+ downloads. Expert in React, TypeScript, GraphQL, and design systems. Led teams of 10+ engineers.

EXPERIENCE
Principal Frontend Engineer — Microsoft, Seattle (2020–Present)
• Led frontend architecture for Azure DevOps, serving 6M+ developers worldwide
• Built and maintained the Microsoft Fluent Design System (React), used by 50+ engineering teams
• Authored and published 3 Vite plugins (collective npm downloads: 50k/week)
• Established frontend interview process and leveling guidelines across org

Senior Frontend Engineer — Amazon, Seattle (2018–2020)
• Led React migration of Amazon Seller Central, a platform used by 2M+ sellers
• Designed the GraphQL API schema for seller analytics, adopted across 4 teams
• Mentored team of 8 engineers; ran biweekly technical talks

Software Engineer — Facebook, Menlo Park (2016–2018)
• Worked on Facebook News Feed frontend, supporting 1B+ daily users
• Built A/B testing framework for frontend experiments (React)

EDUCATION
B.S. Computer Science — MIT (2016) | GPA: 3.9/4.0

SKILLS
React, TypeScript, GraphQL, Vite, Next.js, Webpack, Jest, Cypress, Node.js, Rust (learning), Figma, System Design

OPEN SOURCE
• vite-plugin-federation (50k npm downloads/week)
• react-query-devtools contributor""",

    "Aisha Patel": """AISHA PATEL
Software Developer (Backend → Full Stack Transition) | Boston, MA
aisha.patel@email.com | +1-617-555-0505

SUMMARY
Backend-focused developer with 3 years of Python/Django experience, actively transitioning into full-stack development. Built REST APIs and data pipelines at scale. Currently learning React and TypeScript through personal projects and online courses.

EXPERIENCE
Backend Developer — HubSpot, Boston (2022–Present)
• Developed and maintained Django REST APIs serving 10M+ API requests/day
• Built data pipelines using Celery and Redis for async task processing
• Collaborated with frontend teams to design API contracts

Junior Developer — Infosys (Remote) (2021–2022)
• Maintained Python data processing scripts for financial clients
• Wrote unit tests achieving 85% code coverage
• Participated in Agile sprints and daily standups

EDUCATION
B.S. Computer Science — Northeastern University (2021)

SKILLS
Python, Django, FastAPI, PostgreSQL, Redis, Celery, REST APIs, Git, Docker
(Learning): React, TypeScript, HTML/CSS, TailwindCSS

PROJECTS
• django-blog-api — Full REST API with JWT auth (GitHub: 45 stars)
• react-todo (WIP) — First React project, learning hooks and state management""",
}


async def seed():
    print("Starting HireFlow AI demo seed...")

    # Create demo recruiter
    existing = await db.users.find_one({"email": DEMO_RECRUITER["email"]})
    if existing:
        recruiter_id = str(existing["_id"])
        print(f"  Demo recruiter already exists (id: {recruiter_id})")
        # Ensure is_verified is set
        await db.users.update_one({"_id": existing["_id"]}, {"$set": {"is_verified": True, "company_name": "HireFlow Demo Co."}})
    else:
        DEMO_RECRUITER["is_verified"] = True
        DEMO_RECRUITER["company_name"] = "HireFlow Demo Co."
        result = await db.users.insert_one(DEMO_RECRUITER)
        recruiter_id = str(result.inserted_id)
        print(f"  Created demo recruiter (id: {recruiter_id})")

    # Create demo jobs
    existing_jobs = await db.jobs.count_documents({"recruiter_id": recruiter_id})
    if existing_jobs == 0:
        for job in DEMO_JOBS:
            job["recruiter_id"] = recruiter_id
        await db.jobs.insert_many(DEMO_JOBS)
        print(f"  Inserted {len(DEMO_JOBS)} demo jobs")
    else:
        print(f"  Demo jobs already exist ({existing_jobs} found)")

    # Link candidates to first job
    first_job = await db.jobs.find_one({"recruiter_id": recruiter_id})
    if first_job:
        existing_candidates = await db.candidates.count_documents({"recruiter_id": recruiter_id})
        if existing_candidates == 0:
            # Build candidates inline from resume data
            demo_candidates = [
                {"name": "Sophia Zhang", "email": "sophia.zhang@email.com", "phone": "+1-415-555-0101", "status": "interview", "match_score": 96, "ai_insights": {"match_score": 96, "summary": "Exceptionally strong match. 6 years React/TypeScript, design system contributor, GraphQL expertise.", "good_points": ["6 years React/TypeScript", "Design system contributor", "GraphQL expertise"], "missing_points": ["Vite exposure limited"], "recommendation_label": "Strong Fit", "interview_questions": ["Walk me through how you've architected a design system from scratch."]}, "created_at": datetime.utcnow()},
                {"name": "Marcus Johnson", "email": "marcus.j@email.com", "phone": "+1-312-555-0202", "status": "screening", "match_score": 88, "ai_insights": {"match_score": 88, "summary": "Solid React developer with 4 years experience. Custom hooks author, strong CSS skills.", "good_points": ["4 years React experience", "Custom hooks library author", "Strong CSS skills"], "missing_points": ["No GraphQL", "Limited TypeScript at scale"], "recommendation_label": "Strong Fit", "interview_questions": ["How do you manage complex state across deeply nested components?"]}, "created_at": datetime.utcnow()},
                {"name": "Priya Nair", "email": "priya.nair@email.com", "phone": "+1-650-555-0303", "status": "new", "match_score": 72, "ai_insights": {"match_score": 72, "summary": "2 years frontend experience with strong academic background. Good eye for design, needs more seniority.", "good_points": ["Clean code", "Good design sense", "Google intern"], "missing_points": ["Only 2 years exp", "No TypeScript at scale"], "recommendation_label": "Moderate Fit", "interview_questions": ["Tell me about the most complex UI component you've built."]}, "created_at": datetime.utcnow()},
                {"name": "Daniel Kim", "email": "d.kim@email.com", "phone": "+1-206-555-0404", "status": "hired", "match_score": 98, "ai_insights": {"match_score": 98, "summary": "Outstanding match. 8 years React mastery, Vite plugin author, Microsoft design system lead.", "good_points": ["8 years React mastery", "Vite plugin author", "Team lead"], "missing_points": [], "recommendation_label": "Strong Fit", "interview_questions": ["How did you scale your design system to support 50+ engineers?"]}, "created_at": datetime.utcnow()},
                {"name": "Aisha Patel", "email": "aisha.patel@email.com", "phone": "+1-617-555-0505", "status": "new", "match_score": 54, "ai_insights": {"match_score": 54, "summary": "Backend developer transitioning to full-stack. Python/Django expert, React skills foundational.", "good_points": ["Strong problem solving", "Python/Django background"], "missing_points": ["React < 1 year", "No TypeScript", "No GraphQL"], "recommendation_label": "Moderate Fit", "interview_questions": ["What's your plan to deepen your React expertise?"]}, "created_at": datetime.utcnow()},
            ]
            for c in demo_candidates:
                c["applied_job_id"] = str(first_job["_id"])
                c["recruiter_id"] = recruiter_id
                c["resume_text"] = CANDIDATE_RESUMES.get(c["name"], "(No resume available)")
            await db.candidates.insert_many(demo_candidates)
            print(f"  Inserted {len(demo_candidates)} demo candidates with resume text")
        else:
            print(f"  Patching resume_text for existing candidates without it...")
            patched = 0
            async for c in db.candidates.find({"recruiter_id": recruiter_id, "resume_text": {"$in": [None, "", "(Demo candidate — no real resume)"]}}):
                name = c.get("name", "")
                resume = CANDIDATE_RESUMES.get(name)
                if resume:
                    await db.candidates.update_one({"_id": c["_id"]}, {"$set": {"resume_text": resume}})
                    patched += 1
            if patched:
                print(f"  Patched {patched} candidate(s) with real resume text")
            else:
                print(f"  All candidates already have resume text ({existing_candidates} total)")

    print("\nSeed complete!")
    print("   Demo Login → email: demo@hireflow.ai  |  password: demo1234")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
