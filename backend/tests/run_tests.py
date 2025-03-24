# /home/sdg/Alpha/backend/run_tests.py
import os
import sys
import pytest


def main():
    # Set environment variables
    os.environ["SECRET_KEY"] = "testing_secret_key"
    os.environ["ALGORITHM"] = "HS256"

    wd = os.getcwd()
    tests_path = os.path.join(wd,"backend", "tests")
    # Run pytest with verbose output
    return pytest.main(["-v", wd])


if __name__ == "__main__":
    sys.exit(main())
