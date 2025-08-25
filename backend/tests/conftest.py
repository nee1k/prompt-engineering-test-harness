import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure the backend directory is on PYTHONPATH so `app` can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app


@pytest.fixture(scope="session")
def client():
    os.environ["TESTING"] = "true"
    with TestClient(app) as c:
        yield c

