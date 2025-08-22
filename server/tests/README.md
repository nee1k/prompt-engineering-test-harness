# API Tests

This directory contains comprehensive tests for the Prompt Engineering Test Harness API.

## Test Structure

- `conftest.py` - Test configuration and fixtures
- `test_basic_endpoints.py` - Basic endpoint tests (health, models, etc.)
- `test_prompt_systems.py` - Prompt systems CRUD operations
- `test_test_runs.py` - Test runs and evaluation endpoints
- `test_prompt_optimizer.py` - Prompt optimization endpoints

## Test Features

### Mocked Dependencies
- **Database**: In-memory SQLite for fast, isolated tests
- **Redis**: Mocked Redis client
- **OpenAI**: Mocked OpenAI API calls
- **External APIs**: All external dependencies are mocked

### Test Coverage
- ✅ Basic endpoint health checks
- ✅ Prompt systems CRUD operations
- ✅ Test runs with LLM evaluation
- ✅ Prompt optimization workflows
- ✅ Error handling (404, 400, 401, 422)
- ✅ API key validation
- ✅ Missing variable detection

## Running Tests

### Quick Start
```bash
# From the server directory
python run_tests.py
```

### Using pytest directly
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_prompt_systems.py

# Run specific test
pytest tests/test_prompt_systems.py::test_create_prompt_system

# Run tests matching pattern
pytest -k "prompt"
```

### Test Categories
```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

## Test Data

The tests use sample data fixtures:
- Sample prompt systems with translation templates
- Sample regression sets with expected outputs
- Mocked LLM responses
- Test database with proper relationships

## Adding New Tests

1. Create a new test file: `test_feature_name.py`
2. Import required fixtures from `conftest.py`
3. Use the `client` fixture for HTTP requests
4. Mock external dependencies as needed
5. Test both success and error cases

## Example Test Structure

```python
def test_feature_success(client, test_db, mock_redis):
    """Test successful feature operation."""
    # Setup test data
    # Make API call
    # Assert response
    
def test_feature_error_handling(client, test_db):
    """Test error handling."""
    # Setup invalid data
    # Make API call
    # Assert error response
```
