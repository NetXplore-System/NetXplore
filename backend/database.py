import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy import text

load_dotenv()
url = os.getenv("DATABASE_URL")

engine = create_async_engine(url,pool_pre_ping=True)

async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close() 


async def verify_connection():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
    except Exception as e:
        print("❌ Database connection failed:")
        print(f"Error: {str(e)}")
        raise RuntimeError("Database connection failed") from e