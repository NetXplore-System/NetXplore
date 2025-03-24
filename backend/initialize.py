import asyncio
import os
import sys
from dotenv import load_dotenv
import spacy
import asyncpg
from datetime import datetime
from database import engine
from models import Base


async def download_spacy_models():
    """Download required spaCy models if not present"""
    try:
        print("Checking spaCy models...")
        models = ["en_core_web_sm", "he_core_news_sm"]
        for model in models:
            try:
                spacy.load(model)
                print(f"✅ Model {model} already installed")
            except OSError:
                print(f"⬇️ Downloading {model}...")
                os.system(f"python -m spacy download {model}")
                print(f"✅ Model {model} installed successfully")
    except Exception as e:
        print(f"❌ Error downloading spaCy models: {e}")
        sys.exit(1)


async def create_tables():
    """Create database tables"""
    try:
        print("Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)


async def create_upload_folders():
    """Create upload folders"""
    try:
        print("Creating upload folders...")
        folders = ["uploads", "uploads/avatars"]
        for folder in folders:
            os.makedirs(folder, exist_ok=True)
            print(f"✅ Folder {folder} created/verified")
    except Exception as e:
        print(f"❌ Error creating upload folders: {e}")
        sys.exit(1)


async def check_database_connection():
    """Test database connection"""
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ DATABASE_URL not found in .env file")
        sys.exit(1)

    # Extract connection parameters from asyncpg URL
    url_parts = db_url.replace("postgresql+asyncpg://", "").split("/")
    db_name = url_parts[1]
    auth_host = url_parts[0].split("@")
    host = auth_host[1] if len(auth_host) > 1 else auth_host[0]
    auth = auth_host[0].split(":")
    user = auth[0]
    password = auth[1] if len(auth) > 1 else ""

    try:
        print(f"Testing connection to PostgreSQL...")
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database=db_name,
            host=host.split(":")[0]
        )
        await conn.execute("SELECT 1")
        await conn.close()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


async def main():
    """Main initialization function"""
    print("=" * 50)
    print("NetXplore - PostgreSQL & NLP Initialization")
    print("=" * 50)

    # Check if .env file exists
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            print("⚠️ .env file not found, but .env.example exists.")
            print("⚠️ Please copy .env.example to .env and update the values.")
        else:
            print("❌ Neither .env nor .env.example files found.")
        sys.exit(1)

    # Load environment variables
    load_dotenv()

    # Check database connection
    db_ok = await check_database_connection()
    if not db_ok:
        print("⚠️ Database connection failed. Please check your connection settings.")
        print("⚠️ You may need to start PostgreSQL using docker-compose.")
        sys.exit(1)

    # Create tables
    await create_tables()

    # Download spaCy models
    await download_spacy_models()

    # Create upload folders
    await create_upload_folders()

    print("=" * 50)
    print("✅ Initialization completed successfully!")
    print("=" * 50)
    print("You can now start the application with:")
    print("   uvicorn main:app --reload")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())