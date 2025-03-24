# tests/test_oauth.py
import psycopg2
import pytest
from sqlalchemy import create_engine

from backend.database import Base

pytest.fixture(scope="session", autouse=True)  # autouse will run this fixture before all tests

import psycopg2
from sqlalchemy import create_engine
import pytest

import psycopg2
from sqlalchemy import create_engine
import pytest


import psycopg2
from sqlalchemy import create_engine
import pytest

@pytest.fixture(scope="session", autouse=True)
def create_test_database():
    """Creates the test database if it doesn't exist."""
    print("--- create_test_database fixture is running ---") # Adding this line
    try:
        print("Attempting to connect to 'postgres' database.")
        conn = psycopg2.connect(
            dbname="postgres", user="postgres", password="sisma", host="localhost"
        )
        conn.autocommit = True
        cur = conn.cursor()

        print("Connected to 'postgres' database.")
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'test_netxplore'")
        exists = cur.fetchone()

        if not exists:
            print("Database 'test_netxplore' does not exist. Creating...")
            cur.execute("CREATE DATABASE test_netxplore")
            print("Test database 'test_netxplore' created.")
        else:
            print("Test database 'test_netxplore' already exists.")

        cur.close()
        conn.close()

        global engine
        engine = create_engine("postgresql://postgres:sisma@localhost/test_netxplore")
        print("Engine created for 'test_netxplore'.")
        print("create_test_database fixture finished.")

    except psycopg2.OperationalError as e:
        print(f"Error creating test database: {e}")
        raise

@pytest.fixture(scope="function")
def db():
    # Create the database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    yield engine.connect()
    print("Database tables created.")
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    yield engine.connect()
    # Clean up after the test (optional)
    # Base.metadata.drop_all(bind=engine)


# ... your other code ...
@pytest.mark.asyncio
async def test_google_auth_existing_user(client, test_user):
    # First create a user with Google OAuth
    new_user = {
        "name": "Google Existing",
        "email": "google_existing@example.com",
        "avatar": "https://example.com/avatar.jpg"
    }

    # First request creates the user
    await client.post("/api/auth/google", json=new_user)

    # Second request should recognize existing user
    response = await client.post("/api/auth/google", json=new_user)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == new_user["email"]
