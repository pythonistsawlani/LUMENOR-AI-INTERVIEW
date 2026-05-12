import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.hireflow_db

async def get_db():
    return db

async def init_db():
    try:
        # Set a short timeout for index creation to avoid hanging on Render
        print("Connecting to MongoDB and verifying indexes...")
        await db.jobs.create_index("recruiter_id")
        await db.jobs.create_index([("recruiter_id", 1), ("status", 1)])
        await db.candidates.create_index("applied_job_id")
        await db.candidates.create_index("status")
        await db.candidates.create_index("recruiter_id")
        await db.interview_sessions.create_index("recruiter_id")
        await db.interview_sessions.create_index("access_token_hash", unique=True, sparse=True)
        await db.apply_email_codes.create_index([("job_id", 1), ("email", 1)], unique=True)
        await db.apply_email_codes.create_index("expires_at")
        await db.apply_email_tokens.create_index("token_hash", unique=True)
        await db.apply_email_tokens.create_index("expires_at")
        print("MongoDB indexes verified successfully.")
    except Exception as e:
        print(f"MongoDB Initialization Warning: {e}")
        print("Server will continue, but some queries might be slower.")
