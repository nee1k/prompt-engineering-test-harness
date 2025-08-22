import pytest
import json
from unittest.mock import patch
from models import PromptSystem

def test_create_prompt_system(client, test_db):
    """Test creating a new prompt system."""
    prompt_system_data = {
        "name": "Test Translator",
        "template": "Translate the following text to {language}: {text}",
        "variables": ["text", "language"],
        "provider": "openai",
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1.0,
        "top_k": None
    }
    
    response = client.post("/prompt-systems/", json=prompt_system_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == prompt_system_data["name"]
    assert data["template"] == prompt_system_data["template"]
    assert data["provider"] == prompt_system_data["provider"]
    assert data["model"] == prompt_system_data["model"]
    assert "id" in data

def test_get_prompt_systems_empty(client, test_db):
    """Test getting prompt systems when none exist."""
    response = client.get("/prompt-systems/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_get_prompt_systems_with_data(client, test_db, sample_prompt_system):
    """Test getting prompt systems with existing data."""
    # Create a prompt system first
    db_session = test_db()
    try:
        prompt_system = PromptSystem(**sample_prompt_system)
        db_session.add(prompt_system)
        db_session.commit()
        
        # Get all prompt systems
        response = client.get("/prompt-systems/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["name"] == sample_prompt_system["name"]
    finally:
        db_session.close()

def test_get_prompt_system_by_id(client, test_db, sample_prompt_system):
    """Test getting a specific prompt system by ID."""
    # Create a prompt system first
    db_session = test_db()
    try:
        prompt_system = PromptSystem(**sample_prompt_system)
        db_session.add(prompt_system)
        db_session.commit()
        
        # Get the specific prompt system
        response = client.get(f"/prompt-systems/{sample_prompt_system['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_prompt_system["id"]
        assert data["name"] == sample_prompt_system["name"]
    finally:
        db_session.close()

def test_get_prompt_system_not_found(client, test_db):
    """Test getting a non-existent prompt system."""
    response = client.get("/prompt-systems/non-existent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_prompt_system_invalid_data(client, test_db):
    """Test creating a prompt system with invalid data."""
    invalid_data = {
        "name": "",  # Empty name
        "template": "Invalid template {missing_variable}",
        "variables": ["text"],
        "provider": "invalid_provider"
    }
    
    response = client.post("/prompt-systems/", json=invalid_data)
    assert response.status_code == 422  # Validation error
