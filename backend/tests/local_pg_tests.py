# /home/sdg/Alpha/backend/tests/local_pg_test.py
import sys
import os
import unittest
import subprocess
import bcrypt
import getpass

# Get the backend directory path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


class TestLocalPostgres(unittest.TestCase):
    def test_postgresql_connection(self):
        """Test connecting to local PostgreSQL."""
        print("\n=== PostgreSQL Connection Test ===")

        # Method 1: Try with peer authentication (current system user)
        try:
            postgres_password = "sisma"
            result = subprocess.run(
                ["psql", "-U", "postgres", "-h", "localhost", "-c", "SELECT current_user;"],
                input=postgres_password,  # Encode the password
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                current_user = result.stdout.strip().split("\n")[2].strip()
                print(f"✅ Connected to PostgreSQL as: {current_user}")

                # Create test db with peer auth
                create_result = subprocess.run(
                    ["createdb", "netxplore_test"],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print("✅ Connected to PostgreSQL as postgres")

                    # Create test db with postgres user
                    create_result = subprocess.run(
                        ["createdb", "-U", "postgres", "-h", "localhost", "netxplore_test"],
                        input=postgres_password,  # Encode the password
                        capture_output=True,
                        text=True
                    )

                if create_result.returncode == 0 or "already exists" in create_result.stderr:
                    print("✅ Test database created or already exists")

                    # Store the connection info for other tests
                    with open(os.path.join(backend_dir, ".test_db_config"), "w") as f:
                        f.write(f"USER={current_user}\nPASSWORD=\nAUTH=peer\nDB=netxplore_test")
                    return
                else:
                    print(f"⚠️ Could not create test database: {create_result.stderr}")
            else:
                print(f"⚠️ Peer authentication failed: {result.stderr}")
        except Exception as e:
            print(f"⚠️ Error with peer authentication: {e}")

        # Method 2: Ask for the postgres password
        try:
            print("\nTrying password authentication for 'postgres' user...")
            postgres_password = "sisma"

            result = subprocess.run(
                ["psql", "-U", "postgres", "-h", "localhost", "-c", "SELECT current_user;"],
                input=postgres_password,
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                print("✅ Connected to PostgreSQL as postgres")

                # Create test db with postgres user
                create_result = subprocess.run(
                    ["create database", "-U", "postgres", "-h", "sisma", "netxplore_test"],
                    input=postgres_password,
                    capture_output=True,
                    text=True
                )

                if create_result.returncode == 0 or "already exists" in create_result.stderr:
                    print("✅ Test database created or already exists")

                    # Store the connection info for other tests
                    with open(os.path.join(backend_dir, ".test_db_config"), "w") as f:
                        f.write(f"USER=postgres\nPASSWORD={postgres_password}\nAUTH=password\nDB=netxplore_test")
                    return
                else:
                    print(f"⚠️ Could not create test database: {create_result.stderr}")
            else:
                print(f"⚠️ Password authentication failed: {result.stderr}")
        except Exception as e:
            print(f"⚠️ Error with password authentication: {e}")

        self.fail("Could not connect to PostgreSQL with either method")

    def test_bcrypt_works(self):
        """Test that bcrypt is working correctly."""
        password = "test_password"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        self.assertTrue(bcrypt.checkpw(password.encode(), hashed))
        print("✅ Bcrypt is working correctly")


if __name__ == "__main__":
    unittest.main()
