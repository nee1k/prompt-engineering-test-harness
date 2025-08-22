import asyncio
import os
import sys
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from server
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base
from main import app
from models import PromptSystem, TestResult, TestRun

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a test database with tables."""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    yield TestingSessionLocal

    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def mock_redis():
    """Mock Redis client."""
    with patch("main.redis_client") as mock_redis:
        mock_redis.ping.return_value = True
        mock_redis.set.return_value = True
        mock_redis.get.return_value = None
        mock_redis.keys.return_value = []
        yield mock_redis


@pytest.fixture(scope="function")
def mock_openai():
    """Mock OpenAI client."""
    with patch("main.openai_client") as mock_openai:
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Mocked OpenAI response"
        mock_openai.chat.completions.create.return_value = mock_response
        yield mock_openai


@pytest.fixture(scope="function")
def client(test_db, mock_redis, mock_openai):
    """Create a test client with mocked dependencies."""
    with patch("main.SessionLocal", test_db):
        with patch("main.redis_client", mock_redis):
            with patch("main.openai_client", mock_openai):
                with TestClient(app) as test_client:
                    yield test_client


@pytest.fixture
def sample_prompt_system():
    """Sample prompt system data."""
    return {
        "id": "test-prompt-system-123",
        "name": "Test Translator",
        "template": "Translate the following text to {language}: {text}",
        "variables": '["text", "language"]',
        "provider": "openai",
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1.0,
        "top_k": None,
    }


@pytest.fixture
def sample_test_run():
    """Sample test run data."""
    return {
        "id": "test-run-123",
        "prompt_system_id": "test-prompt-system-123",
        "avg_score": 0.85,
        "total_samples": 2,
        "created_at": "2025-08-22T10:00:00",
    }


@pytest.fixture
def sample_regression_set():
    """Sample regression set data."""
    return [
        {"text": "Hello world", "language": "Spanish", "expected_output": "Hola mundo"},
        {"text": "Good morning", "language": "French", "expected_output": "Bonjour"},
    ]
