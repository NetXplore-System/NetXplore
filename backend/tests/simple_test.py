# /home/sdg/Alpha/backend/tests/conftest.py
import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt
import uuid

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Import modules
from database import Base
from main import app, get_db
from models import User

# Read test database config
db_config = {}
config_file = os.path.join(backend_dir, ".test_db_config")
if os.path.exists(config_file):
    with open(config_file, "r") as f:
        for line in f:
            if "=" in line:
                key, value = line.strip().split("=", 1)
                db_config[key] = value

# Configure test database
db_user = db_config.get("USER", os.getenv("USER"))
db_password = db_config.get("PASSWORD", "")
db_auth = db_config.get("AUTH", "peer")
db_name = db_config.get("DB", "netxplore_test")

# Build connection string based on auth type
if db_auth == "peer":
    SQLALCHEMY_TEST_DATABASE_URL = f"postgresql:///{db_name}"
else:
    SQLALCHEMY_TEST_DATABASE_URL = f"postgresql://{db_user}:{db_password}@localhost/{db_name}"

engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    # Create the database tables
    Base.metadata.create_all(bind=engine)

    # Create a new session for each test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    # Reset dependency
    app.dependency_overrides = {}


@pytest.fixture
def test_user(db):
    """Create a test user in the database"""
    user_id = uuid.uuid4()
    hashed_pwd = bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode()

    user = User(
        user_id=user_id,
        name="Test User",
        email="testuser@example.com",
        password=hashed_pwd
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": str(user_id), "email": "testuser@example.com", "password": "password123"}