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
    # Create indexes for performance
    await db.jobs.create_index("recruiter_id")
    await db.candidates.create_index("applied_job_id")
    await db.candidates.create_index("status")
    print("MongoDB indexes verified.")
