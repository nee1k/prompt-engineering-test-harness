import pytest
import json
from unittest.mock import patch, AsyncMock
from models import PromptSystem, TestRun, TestResult

@pytest.fixture
def setup_prompt_system(test_db, sample_prompt_system):
    """Setup a prompt system for testing."""
    db_session = test_db()
    try:
        prompt_system = PromptSystem(**sample_prompt_system)
        db_session.add(prompt_system)
        db_session.commit()
        return sample_prompt_system["id"]
    finally:
        db_session.close()

def test_create_test_run_success(client, test_db, setup_prompt_system, sample_regression_set, mock_openai):
    """Test creating a test run successfully."""
    test_run_data = {
        "prompt_system_id": setup_prompt_system,
        "regression_set": sample_regression_set,
        "evaluation_function": "fuzzy"
    }
    
    # Mock the call_llm function to return a predictable response
    with patch('main.call_llm', new_callable=AsyncMock) as mock_call_llm:
        mock_call_llm.return_value = "Mocked translation response"
        
        response = client.post("/test-runs/", json=test_run_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "test_run_id" in data
        assert "avg_score" in data
        assert "total_samples" in data
        assert "results" in data
        assert len(data["results"]) == len(sample_regression_set)

def test_create_test_run_prompt_system_not_found(client, test_db, sample_regression_set):
    """Test creating a test run with non-existent prompt system."""
    test_run_data = {
        "prompt_system_id": "non-existent-id",
        "regression_set": sample_regression_set,
        "evaluation_function": "fuzzy"
    }
    
    response = client.post("/test-runs/", json=test_run_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_test_run_missing_variable(client, test_db, setup_prompt_system):
    """Test creating a test run with missing template variables."""
    test_run_data = {
        "prompt_system_id": setup_prompt_system,
        "regression_set": [
            {
                "text": "Hello world",  # Missing 'language' variable
                "expected_output": "Hola mundo"
            }
        ],
        "evaluation_function": "fuzzy"
    }
    
    response = client.post("/test-runs/", json=test_run_data)
    assert response.status_code == 400
    assert "missing variable" in response.json()["detail"].lower()

def test_get_test_runs_empty(client, test_db):
    """Test getting test runs when none exist."""
    response = client.get("/test-runs/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_get_test_run_by_id(client, test_db, setup_prompt_system, sample_regression_set, mock_openai):
    """Test getting a specific test run by ID."""
    # Create a test run first
    test_run_data = {
        "prompt_system_id": setup_prompt_system,
        "regression_set": sample_regression_set,
        "evaluation_function": "fuzzy"
    }
    
    with patch('main.call_llm', new_callable=AsyncMock) as mock_call_llm:
        mock_call_llm.return_value = "Mocked translation response"
        
        create_response = client.post("/test-runs/", json=test_run_data)
        test_run_id = create_response.json()["test_run_id"]
        
        # Get the specific test run
        response = client.get(f"/test-runs/{test_run_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_run_id
        assert "avg_score" in data
        assert "total_samples" in data

def test_get_test_run_not_found(client, test_db):
    """Test getting a non-existent test run."""
    response = client.get("/test-runs/non-existent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_get_test_run_history(client, test_db, setup_prompt_system, sample_regression_set, mock_openai):
    """Test getting test run history."""
    # Create a test run first
    test_run_data = {
        "prompt_system_id": setup_prompt_system,
        "regression_set": sample_regression_set,
        "evaluation_function": "fuzzy"
    }
    
    with patch('main.call_llm', new_callable=AsyncMock) as mock_call_llm:
        mock_call_llm.return_value = "Mocked translation response"
        
        create_response = client.post("/test-runs/", json=test_run_data)
        
        # Get test run history
        response = client.get(f"/test-runs/{setup_prompt_system}/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

def test_create_test_run_openai_api_error(client, test_db, setup_prompt_system, sample_regression_set):
    """Test creating a test run when OpenAI API fails."""
    test_run_data = {
        "prompt_system_id": setup_prompt_system,
        "regression_set": sample_regression_set,
        "evaluation_function": "fuzzy"
    }
    
    # Mock the call_llm function to raise an HTTPException
    with patch('main.call_llm', new_callable=AsyncMock) as mock_call_llm:
        from fastapi import HTTPException
        mock_call_llm.side_effect = HTTPException(
            status_code=401, 
            detail="Invalid OpenAI API key. Please check your API key configuration."
        )
        
        response = client.post("/test-runs/", json=test_run_data)
        assert response.status_code == 401
        assert "Invalid OpenAI API key" in response.json()["detail"]
