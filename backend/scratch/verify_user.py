import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

async def verify_user():
    mongo_uri = os.getenv("MONGO_URI")
    client_options = {
        "serverSelectionTimeoutMS": 30000,
        "tls": True,
        "tlsCAFile": certifi.where(),
    }
    client = AsyncIOMotorClient(mongo_uri, **client_options)
    db = client.hireflow_db
    
    email = "sawlanikaran257@gmail.com"
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"is_verified": True}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully verified {email}")
    elif result.matched_count > 0:
        print(f"User {email} was already verified")
    else:
        print(f"User {email} not found")

if __name__ == "__main__":
    asyncio.run(verify_user())
