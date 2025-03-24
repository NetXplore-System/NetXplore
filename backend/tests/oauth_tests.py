# tests/test_oauth.py
import psycopg2
import pytest
from sqlalchemy import create_engine

from backend.database import Base

pytest.fixture(scope="session", autouse=True)  # autouse will run this fixture before all tests


def create_test_database():
    """Creates the test database if it doesn't exist."""
    try:
        # Attempt to connect to the 'postgres' database (default)
        conn = psycopg2.connect(
            dbname="postgres", user="postgres", password="sisma", host="localhost"
        )
        conn.autocommit = True  # Important for creating databases
        cur = conn.cursor()

        # Check if the database already exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'test_netxplore'")
        exists = cur.fetchone()

        if not exists:
            # Create the database if it doesn't exist
            cur.execute("CREATE DATABASE test_netxplore")
            print("Test database 'test_netxplore' created.")
        else:
            print("Test database 'test_netxplore' already exists.")

        cur.close()
        conn.close()

        # Now, create the SQLAlchemy engine
        global engine
        engine = create_engine("postgresql://postgres:sisma@localhost/test_netxplore")

    except psycopg2.OperationalError as e:
        print(f"Error creating test database: {e}")
        raise


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
