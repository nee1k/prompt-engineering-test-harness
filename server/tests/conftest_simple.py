import pytest


@pytest.fixture
def sample_data():
    """Sample data for testing."""
    return {"name": "Test", "value": 42}
