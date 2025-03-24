# /home/sdg/Alpha/backend/run_tests.py
import os
import sys
import pytest


def main():
    # Set environment variables
    os.environ["SECRET_KEY"] = "testing_secret_key"
    os.environ["ALGORITHM"] = "HS256"

    # Run pytest with verbose output
    return pytest.main(["-v", "backend/tests/"])


if __name__ == "__main__":
    sys.exit(main())
