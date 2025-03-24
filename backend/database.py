# backend/database.py

import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Load environment variables
# load_dotenv(".db_config")
# load_dotenv(".test_db_config")
load_dotenv("backend/.env")
url = os.getenv("DATABASE_URL")
# url = f"postgresql+asyncpg://{user}:{password}@{host}/{db}" # change here

# Create engine
engine = create_async_engine(url)

# Create session factory
async_session: AsyncSession = sessionmaker(
    engine, expire_on_commit=False, class_=Session
)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db():
    async with async_session as session: # change here.
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise