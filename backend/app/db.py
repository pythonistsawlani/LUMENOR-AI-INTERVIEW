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
        await db.candidates.create_index("applied_job_id")
        await db.candidates.create_index("status")
        print("✅ MongoDB indexes verified successfully.")
    except Exception as e:
        print(f"⚠️ MongoDB Initialization Warning: {e}")
        print("Server will continue, but some queries might be slower.")
