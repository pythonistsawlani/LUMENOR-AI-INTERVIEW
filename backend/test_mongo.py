import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_mongo():
    uri = os.getenv("MONGO_URI")
    print(f"Testing URI: {uri}")
    client = AsyncIOMotorClient(uri)
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("MongoDB Connection: SUCCESS")
    except Exception as e:
        print(f"MongoDB Connection: FAILED - {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_mongo())
