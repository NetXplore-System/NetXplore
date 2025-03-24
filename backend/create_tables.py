import asyncio
from backend.database import engine
from backend.models import Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)  # Drop all tables if they exist
        await conn.run_sync(Base.metadata.create_all)  # Create all tables
    print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())