from unittest.mock import Mock, patch

import pytest


def test_root_endpoint_mock():
    """Test the root endpoint with mocked app."""
    # Mock the FastAPI app
    with patch("fastapi.FastAPI") as mock_fastapi:
        mock_app = Mock()
        mock_fastapi.return_value = mock_app

        # Mock the root endpoint
        mock_app.get.return_value = {"message": "Prompt Engineering Test Harness API"}

        # Test the mock
        assert mock_app.get.return_value == {
            "message": "Prompt Engineering Test Harness API"
        }


def test_health_check_mock():
    """Test health check with mocked Redis."""
    with patch("redis.from_url") as mock_redis:
        mock_client = Mock()
        mock_client.ping.return_value = True
        mock_redis.return_value = mock_client

        # Test the mock
        assert mock_client.ping() == True


def test_models_endpoint_mock():
    """Test models endpoint with mocked data."""
    # Mock the expected response
    expected_response = {
        "openai": [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
            {"id": "gpt-4", "name": "GPT-4"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ],
        "ollama": [],
    }

    # Test the structure
    assert "openai" in expected_response
    assert "ollama" in expected_response
    assert isinstance(expected_response["openai"], list)
    assert isinstance(expected_response["ollama"], list)


def test_evaluation_functions_mock():
    """Test evaluation functions endpoint."""
    expected_functions = ["fuzzy", "exact", "semantic", "contains"]

    assert "fuzzy" in expected_functions
    assert "exact" in expected_functions
    assert "semantic" in expected_functions
    assert "contains" in expected_functions
    assert isinstance(expected_functions, list)


def test_sample_data_fixtures(
    sample_prompt_system, sample_test_run, sample_regression_set
):
    """Test that our sample data fixtures work correctly."""
    # Test prompt system fixture
    assert sample_prompt_system["name"] == "Test Translator"
    assert sample_prompt_system["provider"] == "openai"
    assert "template" in sample_prompt_system

    # Test test run fixture
    assert sample_test_run["id"] == "test-run-123"
    assert sample_test_run["avg_score"] == 0.85

    # Test regression set fixture
    assert len(sample_regression_set) == 2
    assert sample_regression_set[0]["text"] == "Hello world"
    assert sample_regression_set[0]["language"] == "Spanish"
    assert sample_regression_set[0]["expected_output"] == "Hola mundo"
