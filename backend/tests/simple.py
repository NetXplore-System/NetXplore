# /home/sdg/Alpha/backend/tests/simple_test.py
import sys
import os
import unittest
import psycopg2
import bcrypt

# Get the backend directory path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


# Create a mock 'backend' module to fix imports
class MockModule:
    pass


mock_backend = MockModule()
sys.modules['backend'] = mock_backend
mock_backend.database = __import__('database')


# Test database connection
class TestDatabaseConnection(unittest.TestCase):
    def test_connect_to_postgres(self):
        """Test that we can connect to PostgreSQL."""
        conn = psycopg2.connect(
            host="localhost",
            database="netxplore",
            user="postgres",
            password="password",
            port="5432"
        )
        self.assertIsNotNone(conn)
        conn.close()
        print("✅ Successfully connected to PostgreSQL")

    def test_bcrypt_works(self):
        """Test that bcrypt is working correctly."""
        password = "test_password"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        self.assertTrue(bcrypt.checkpw(password.encode(), hashed))
        print("✅ Bcrypt is working correctly")


if __name__ == "__main__":
    unittest.main()
