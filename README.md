# HireFlow AI

> **An AI-powered recruitment automation platform** that streamlines candidate evaluation using LLM-based resume analysis and intelligent hiring workflows.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Qwen2.5-FFD21E?style=flat&logo=huggingface&logoColor=black)](https://huggingface.co/)

---

## What is HireFlow AI?

HireFlow AI enables recruiters to:

1. **Post job openings** with required skills and descriptions
2. **Upload candidate resumes** (PDF) for instant AI analysis
3. **Receive structured AI evaluation** — match score, summary, missing skills, recommendation label, and auto-generated interview questions
4. **Manage the hiring pipeline** via a drag-and-drop Kanban board
5. **Visualize hiring analytics** — funnel charts, score distribution, top candidate leaderboard

No mock data. No manual scoring. Pure AI automation.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                      │
│  Landing Page → Auth Modal → Dashboard → Analytics   │
│  (Vite + TailwindCSS + Framer Motion + React Query)  │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS REST API
┌────────────────────────▼────────────────────────────┐
│                 FastAPI Backend                        │
│  Auth · Jobs · Candidates · Analytics · AI Trigger   │
│  (Async · JWT · Background Tasks · File Validation)  │
└───────────┬───────────────────────────┬─────────────┘
            │                           │
┌───────────▼──────────┐   ┌────────────▼──────────────┐
│    MongoDB Atlas      │   │  HuggingFace Inference API │
│  users · jobs ·       │   │  Qwen/Qwen2.5-7B-Instruct  │
│  candidates · indexes │   │  Resume Analysis · Scoring │
└──────────────────────┘   └────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS v4, Framer Motion |
| **State & Caching** | React Query (TanStack Query v5) |
| **HTTP Client** | Axios (interceptors + retry logic) |
| **Charts** | Recharts |
| **Backend** | Python, FastAPI (async), Uvicorn |
| **Database** | MongoDB (Motor async driver) |
| **AI Engine** | Hugging Face Inference API — `Qwen/Qwen2.5-7B-Instruct` |
| **PDF Parsing** | PyMuPDF |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Why These Choices?

**FastAPI** — chosen for its async-first design, automatic OpenAPI docs, and Python ecosystem access to HuggingFace libraries. Handles background AI processing without blocking API responses.

**Hugging Face Inference API** — removes the need to host GPU infrastructure. `Qwen2.5-7B-Instruct` provides structured JSON output from LLM prompts, enabling reliable parsing of AI evaluation results.

**MongoDB** — flexible document schema allows evolving the `ai_insights` sub-document as the AI output format improves. Motor provides async access without blocking FastAPI event loops.

**React Query** — manages server state caching, background refetching, and optimistic updates. Critical for the "AI Processing..." polling behavior on candidate cards.

---

## AI Workflow

```
PDF Upload
    ↓
File Validation (type, size, readability)
    ↓
PyMuPDF Text Extraction
    ↓
FastAPI Background Task Dispatched
    ↓
Candidate saved to DB (status: processing)
    ↓
Qwen2.5 LLM Prompt (Job JD + Resume)
    ↓
Structured JSON Response:
  {
    match_score: 0–100,
    summary: "...",
    good_points: [...],
    missing_points: [...],
    recommendation_label: "Strong Fit | Moderate Fit | Weak Fit",
    interview_questions: [...]
  }
    ↓
MongoDB Update (ai_insights field)
    ↓
Frontend polls → Candidate Card updates
```

---

## Setup & Running Locally

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (free tier works)
- HuggingFace account (free API token)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your real MONGO_URI, HUGGINGFACE_API_KEY, JWT_SECRET

uvicorn app.main:app --reload
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000/api

npm run dev
```

Frontend at: `http://localhost:5173`

### Seed Demo Data

```bash
cd backend
python seed_demo.py
```

Demo credentials: `demo@hireflow.ai` / `demo1234`

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Root directory: `frontend`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy

### Backend → Render

1. Create new Web Service on [Render](https://render.com)
2. Root directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Add all env vars (see `.env.example`)
6. Deploy

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user with read/write permissions
3. Allow `0.0.0.0/0` IP access (or restrict to Render's IP)
4. Copy the connection string into `MONGO_URI`

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | Frontend | Backend API base URL |
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `HUGGINGFACE_API_KEY` | Backend | HuggingFace access token |
| `JWT_SECRET` | Backend | Secret for signing JWT tokens |
| `ALLOWED_ORIGINS` | Backend | Comma-separated CORS allowed origins |

---

## Recruiter Demo Flow

1. Visit `/` → Click **"Get Started Free"**
2. Register or use demo account (`demo@hireflow.ai` / `demo1234`)
3. Auto-redirect to Dashboard
4. Click **Create Job** → Fill form → Publish
5. Click **Upload Candidate** → Select job → Enter details → Upload PDF
6. Watch candidate appear in **"New Applied"** column with **"Processing Resume..."** spinner
7. Wait ~20 seconds → Card updates with AI Match Score, Summary, Skill Gaps
8. Drag candidate card to **"Screening"** → **"Interview"** → **"Hired"**
9. Click **Analytics** tab → View hiring funnel and score distribution

---

## Future Roadmap

- [ ] Real-time notifications (WebSocket)
- [ ] Email automation on status change
- [ ] Resume PDF preview in-app
- [ ] AI-generated offer letter drafts
- [ ] Multi-recruiter team workspaces
- [ ] Candidate self-service portal
- [ ] Export candidate reports to PDF/CSV
- [ ] Integration with Calendly/Google Meet for interview scheduling

---

## License

MIT © 2026 HireFlow AI
