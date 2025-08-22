@echo off
REM Setup script for Prompt Engineering Test Harness API (Windows)
REM This script creates a virtual environment and installs all dependencies

echo 🚀 Setting up Prompt Engineering Test Harness API...

REM Check if Python 3 is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if we're in the server directory
if not exist "requirements.txt" (
    echo ❌ Please run this script from the server directory.
    echo    cd server ^&^& setup.bat
    pause
    exit /b 1
)

REM Remove existing virtual environment if it exists
if exist "venv" (
    echo 🗑️  Removing existing virtual environment...
    rmdir /s /q venv
)

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Verify installation
echo ✅ Verifying installation...
python -c "import fastapi, pytest, sqlalchemy, openai, redis, pandas; print('All packages installed successfully!')"

REM Run a quick test
echo 🧪 Running quick test...
python -m pytest tests/test_simple.py -v

echo.
echo 🎉 Setup complete! Your virtual environment is ready.
echo.
echo To activate the virtual environment:
echo   venv\Scripts\activate.bat
echo.
echo To run tests:
echo   python -m pytest tests/ -v
echo.
echo To run the API server:
echo   python main.py
echo.
echo To deactivate the virtual environment:
echo   deactivate
echo.
pause
