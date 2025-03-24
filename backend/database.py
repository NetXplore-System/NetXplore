from dotenv import load_dotenv
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Load environment variables
load_dotenv()

# PostgreSQL connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost/netxplore")

# Create engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create session factory
async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
