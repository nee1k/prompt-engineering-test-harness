#!/bin/bash

# Setup script for Prompt Engineering Test Harness API
# This script creates a virtual environment and installs all dependencies

set -e  # Exit on any error

echo "🚀 Setting up Prompt Engineering Test Harness API..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if we're in the server directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Please run this script from the server directory."
    echo "   cd server && ./setup.sh"
    exit 1
fi

# Remove existing virtual environment if it exists
if [ -d "venv" ]; then
    echo "🗑️  Removing existing virtual environment..."
    rm -rf venv
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Verify installation
echo "✅ Verifying installation..."
python -c "import fastapi, pytest, sqlalchemy, openai, redis, pandas; print('All packages installed successfully!')"

# Run a quick test
echo "🧪 Running quick test..."
python -m pytest tests/test_simple.py -v

echo ""
echo "🎉 Setup complete! Your virtual environment is ready."
echo ""
echo "To activate the virtual environment:"
echo "  source venv/bin/activate"
echo ""
echo "To run tests:"
echo "  python -m pytest tests/ -v"
echo ""
echo "To run the API server:"
echo "  python main.py"
echo ""
echo "To deactivate the virtual environment:"
echo "  deactivate"
