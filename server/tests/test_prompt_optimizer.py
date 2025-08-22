import json
from unittest.mock import AsyncMock, patch

import pytest

from models import PromptSystem, TestResult, TestRun


@pytest.fixture
def setup_prompt_system_with_test_run(
    test_db, sample_prompt_system, sample_regression_set
):
    """Setup a prompt system with a test run for optimization testing."""
    db_session = test_db()
    try:
        # Create prompt system
        prompt_system = PromptSystem(**sample_prompt_system)
        db_session.add(prompt_system)
        db_session.commit()

        # Create a test run
        test_run = TestRun(
            id="test-run-123",
            prompt_system_id=sample_prompt_system["id"],
            avg_score=0.85,
            total_samples=2,
        )
        db_session.add(test_run)

        # Create test results
        for i, sample in enumerate(sample_regression_set):
            result = TestResult(
                id=f"result-{i}",
                test_run_id="test-run-123",
                sample_id=str(i),
                input_variables=json.dumps(
                    {k: v for k, v in sample.items() if k != "expected_output"}
                ),
                expected_output=sample["expected_output"],
                predicted_output="Mocked response",
                score=0.85,
                evaluation_method="fuzzy",
            )
            db_session.add(result)

        db_session.commit()
        return sample_prompt_system["id"]
    finally:
        db_session.close()


def test_start_prompt_optimization_success(
    client, test_db, setup_prompt_system_with_test_run, mock_redis
):
    """Test starting a prompt optimization successfully."""
    optimization_data = {
        "promptSystemId": setup_prompt_system_with_test_run,
        "config": {"maxIterations": 2, "costBudget": 0.10, "evaluationMethod": "fuzzy"},
    }

    # Mock the optimization functions
    with patch("main.get_improved_prompt", new_callable=AsyncMock) as mock_get_prompt:
        with patch(
            "main.test_improved_prompt", new_callable=AsyncMock
        ) as mock_test_prompt:
            mock_get_prompt.return_value = "Improved prompt template"
            mock_test_prompt.return_value = 0.9

            response = client.post("/prompt-optimizer/start", json=optimization_data)
            assert response.status_code == 200

            data = response.json()
            assert "optimizationId" in data
            assert data["status"] == "started"


def test_start_prompt_optimization_prompt_system_not_found(client, test_db, mock_redis):
    """Test starting optimization with non-existent prompt system."""
    optimization_data = {
        "promptSystemId": "non-existent-id",
        "config": {"maxIterations": 2, "costBudget": 0.10, "evaluationMethod": "fuzzy"},
    }

    response = client.post("/prompt-optimizer/start", json=optimization_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_start_prompt_optimization_no_test_runs(
    client, test_db, sample_prompt_system, mock_redis
):
    """Test starting optimization with no existing test runs."""
    # Create prompt system without test runs
    db_session = test_db()
    try:
        prompt_system = PromptSystem(**sample_prompt_system)
        db_session.add(prompt_system)
        db_session.commit()

        optimization_data = {
            "promptSystemId": sample_prompt_system["id"],
            "config": {
                "maxIterations": 2,
                "costBudget": 0.10,
                "evaluationMethod": "fuzzy",
            },
        }

        response = client.post("/prompt-optimizer/start", json=optimization_data)
        assert response.status_code == 400
        assert "no test runs found" in response.json()["detail"].lower()
    finally:
        db_session.close()


def test_get_optimization_status(
    client, test_db, setup_prompt_system_with_test_run, mock_redis
):
    """Test getting optimization status."""
    # Start an optimization first
    optimization_data = {
        "promptSystemId": setup_prompt_system_with_test_run,
        "config": {"maxIterations": 1, "costBudget": 0.10, "evaluationMethod": "fuzzy"},
    }

    with patch("main.get_improved_prompt", new_callable=AsyncMock) as mock_get_prompt:
        with patch(
            "main.test_improved_prompt", new_callable=AsyncMock
        ) as mock_test_prompt:
            mock_get_prompt.return_value = "Improved prompt template"
            mock_test_prompt.return_value = 0.9

            start_response = client.post(
                "/prompt-optimizer/start", json=optimization_data
            )
            optimization_id = start_response.json()["optimizationId"]

            # Get status
            response = client.get(f"/prompt-optimizer/{optimization_id}/status")
            assert response.status_code == 200

            data = response.json()
            assert "status" in data
            assert "currentIteration" in data
            assert "totalCost" in data
            assert "baselineScore" in data
            assert "bestScore" in data
            assert "results" in data


def test_get_optimization_status_not_found(client, test_db, mock_redis):
    """Test getting status for non-existent optimization."""
    response = client.get("/prompt-optimizer/non-existent-id/status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_stop_optimization(client, test_db, mock_redis):
    """Test stopping all optimizations."""
    response = client.post("/prompt-optimizer/stop")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert "stopped_sessions" in data


def test_list_optimization_sessions_empty(client, test_db, mock_redis):
    """Test listing optimization sessions when none exist."""
    response = client.get("/prompt-optimizer/sessions/")
    assert response.status_code == 200

    data = response.json()
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    assert len(data["sessions"]) == 0


def test_delete_optimization_session(
    client, test_db, setup_prompt_system_with_test_run, mock_redis
):
    """Test deleting an optimization session."""
    # Start an optimization first
    optimization_data = {
        "promptSystemId": setup_prompt_system_with_test_run,
        "config": {"maxIterations": 1, "costBudget": 0.10, "evaluationMethod": "fuzzy"},
    }

    with patch("main.get_improved_prompt", new_callable=AsyncMock) as mock_get_prompt:
        with patch(
            "main.test_improved_prompt", new_callable=AsyncMock
        ) as mock_test_prompt:
            mock_get_prompt.return_value = "Improved prompt template"
            mock_test_prompt.return_value = 0.9

            start_response = client.post(
                "/prompt-optimizer/start", json=optimization_data
            )
            optimization_id = start_response.json()["optimizationId"]

            # Delete the session
            response = client.delete(f"/prompt-optimizer/{optimization_id}/")
            assert response.status_code == 200

            data = response.json()
            assert "status" in data
            assert data["status"] == "deleted"


def test_delete_optimization_session_not_found(client, test_db, mock_redis):
    """Test deleting a non-existent optimization session."""
    response = client.delete("/prompt-optimizer/non-existent-id/")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
