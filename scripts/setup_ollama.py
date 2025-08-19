#!/usr/bin/env python3
"""
Ollama Setup Script for Emissary

This script helps set up Ollama for use with the Emissary prompt system monitor.
It checks if Ollama is installed, running, and pulls common models.
"""

import subprocess
import sys
import time
import json

# Try to import requests, install if not available
try:
    import requests
except ImportError:
    print("Installing requests...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

def run_command(command, check=True):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if check and result.returncode != 0:
            print(f"Error running command: {command}")
            print(f"Error: {result.stderr}")
            return False
        return result
    except Exception as e:
        print(f"Exception running command {command}: {e}")
        return False

def check_ollama_installed():
    """Check if Ollama is installed"""
    result = run_command("which ollama", check=False)
    if result and result.returncode == 0:
        print("✓ Ollama is installed")
        return True
    else:
        print("✗ Ollama is not installed")
        return False

def install_ollama():
    """Install Ollama based on the operating system"""
    import platform
    system = platform.system().lower()
    
    if system == "darwin":  # macOS
        print("Installing Ollama on macOS...")
        if run_command("brew install ollama"):
            print("✓ Ollama installed successfully")
            return True
        else:
            print("✗ Failed to install Ollama")
            return False
    elif system == "linux":
        print("Installing Ollama on Linux...")
        if run_command("curl -fsSL https://ollama.ai/install.sh | sh"):
            print("✓ Ollama installed successfully")
            return True
        else:
            print("✗ Failed to install Ollama")
            return False
    else:
        print(f"Unsupported operating system: {system}")
        print("Please install Ollama manually from https://ollama.ai")
        return False

def start_ollama():
    """Start the Ollama service"""
    print("Starting Ollama service...")
    if run_command("ollama serve", check=False):
        print("✓ Ollama service started")
        return True
    else:
        print("✗ Failed to start Ollama service")
        return False

def check_ollama_running():
    """Check if Ollama is running and responding"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✓ Ollama is running and responding")
            return True
        else:
            print("✗ Ollama is not responding properly")
            return False
    except requests.exceptions.RequestException:
        print("✗ Ollama is not running")
        return False

def get_available_models():
    """Get list of available models from Ollama"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        return []
    except:
        return []

def pull_model(model_name):
    """Pull a model from Ollama"""
    print(f"Pulling model: {model_name}")
    result = run_command(f"ollama pull {model_name}")
    if result and result.returncode == 0:
        print(f"✓ Successfully pulled {model_name}")
        return True
    else:
        print(f"✗ Failed to pull {model_name}")
        return False

def main():
    print("🚀 Emissary Ollama Setup")
    print("=" * 40)
    
    # Check if Ollama is installed
    if not check_ollama_installed():
        print("\nInstalling Ollama...")
        if not install_ollama():
            sys.exit(1)
    
    # Check if Ollama is running
    if not check_ollama_running():
        print("\nStarting Ollama...")
        if not start_ollama():
            print("Please start Ollama manually: ollama serve")
            sys.exit(1)
        
        # Wait a bit for Ollama to start
        print("Waiting for Ollama to start...")
        for i in range(10):
            time.sleep(1)
            if check_ollama_running():
                break
        else:
            print("Ollama failed to start within 10 seconds")
            sys.exit(1)
    
    # Get available models
    available_models = get_available_models()
    print(f"\nCurrently available models: {', '.join(available_models) if available_models else 'None'}")
    
    # Common models to suggest
    suggested_models = [
        "llama3:8b",
        "mistral:7b",
        "phi3:mini",
        "qwen2.5:7b"
    ]
    
    print(f"\nSuggested models for testing:")
    for model in suggested_models:
        if model in available_models:
            print(f"✓ {model} (already available)")
        else:
            print(f"  {model}")
    
    # Ask user which models to pull
    print("\nWhich models would you like to pull? (comma-separated, or 'all' for all suggested)")
    choice = input("Enter model names: ").strip()
    
    if choice.lower() == 'all':
        models_to_pull = suggested_models
    else:
        models_to_pull = [m.strip() for m in choice.split(',') if m.strip()]
    
    # Pull selected models
    for model in models_to_pull:
        if model not in available_models:
            pull_model(model)
        else:
            print(f"✓ {model} is already available")
    
    print("\n🎉 Ollama setup complete!")
    print("\nYou can now use Ollama models in Emissary:")
    print("1. Go to 'Create System'")
    print("2. Select 'Ollama (Local)' as provider")
    print("3. Choose from the available models")
    print("4. Create your prompt system and run tests!")

if __name__ == "__main__":
    main()
