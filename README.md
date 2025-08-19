# Prompt System Monitor

> **A lightweight, scalable application for monitoring and evaluating LLM prompt systems**

Define prompt templates, upload test datasets, and run automated evaluations with detailed scoring. Perfect for development teams, researchers, and anyone working with LLM applications.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage Guide](#-usage-guide)
- [🤖 Model Providers](#-model-providers)
- [📝 Example Workflow](#-example-workflow)
- [📄 File Formats](#-file-formats)
- [🚀 Deployment & Scaling](#-deployment--scaling)
- [🔧 Manual Setup](#-manual-setup)
- [📊 Contributing](#-contributing)

## ✨ Features

- **🎯 Prompt System Management** - Create and save prompt templates with variable placeholders
- **⚙️ Model Configuration** - Configure temperature, max_tokens, top_p for different LLM models
- **📊 Regression Testing** - Upload CSV/JSONL files with test cases and expected outputs
- **🤖 Automated Evaluation** - Run tests with fuzzy string matching and detailed scoring
- **📈 Results Tracking** - View historical test runs and per-sample results
- **🎨 Modern UI** - Clean React interface with real-time feedback
- **🔌 Multi-Provider Support** - OpenAI (cloud) and Ollama (local) models
- **📦 Containerized** - Production-ready with Docker and Kubernetes support

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) with SQLAlchemy
- **Frontend**: React + Vite
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Cache**: Redis (production)
- **LLM Providers**: OpenAI API + Ollama
- **Evaluation**: Fuzzy string similarity using difflib

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- **OpenAI API key** (optional - can use Ollama for local models)

### Simple Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd prompt-systems-monitor
   ```

2. **Configure environment (optional):**
   ```bash
   cp server/env.example .env
   # Add your OpenAI API key to .env (only needed for OpenAI models)
   ```

3. **Start everything with Docker:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - 🌐 **Frontend**: http://localhost
   - 📚 **API Docs**: http://localhost/api/docs

That's it! The application is now running with PostgreSQL, Redis, and all services ready to use.

### Development Setup

For local development without Docker:

```bash
# Install dependencies
npm run install-all

# Set up environment
cd server && cp env.example .env

# Start services
npm run dev
```

## 📖 Usage Guide

### 1. Create a Prompt System
- Navigate to **"Create System"**
- Choose your **provider**: OpenAI (cloud) or Ollama (local)
- Select a **model** from the available options
- Enter a **name** and **template** with `{variable}` placeholders
- Define your **variables** (comma-separated)
- Configure **model parameters** (temperature, max_tokens, etc.)

### 2. Upload a Regression Set
- Go to **"Run Test"**
- Upload a **CSV** or **JSONL** file with your test data
- Ensure your file has columns for variables and an `expected_output` column

### 3. Run Tests
- Select your **prompt system**
- Upload your **regression set**
- Click **"Run Test"** to execute

### 4. View Results
- See **immediate results** after test completion
- View **historical results** in "Test Results"
- Analyze **per-sample scoring** and **aggregate metrics**

## 🔧 Advanced Setup

### Manual Installation (without Docker)

If you prefer to run services manually:

```bash
# Backend
cd server
pip install -r requirements.txt
cp env.example .env
python run.py

# Frontend (in another terminal)
cd client
npm install
npm run dev
```

### Ollama Setup (for local models)

```bash
# Run the automated setup script
python scripts/setup_ollama.py

# Or manually install Ollama
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

## 📝 Example Workflow

### 1. Create a Prompt System
```
Template: "Translate the following text to {language}: {text}"
Variables: text, language
Provider: OpenAI
Model: GPT-3.5 Turbo
```

### 2. Prepare Test Data (CSV)
```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
"Thank you","German","Danke"
```

### 3. Run Tests & Analyze Results
- Upload your regression set
- Execute tests across all samples
- Review per-sample scoring and aggregate metrics
- Track performance over time

## 📄 File Formats

### CSV Format
- Headers should include variable names and `expected_output`
- Example: `text,language,expected_output`

### JSONL Format
- Each line is a JSON object
- Should include variable fields and `expected_output`
- Example: `{"text": "Hello", "language": "French", "expected_output": "Bonjour"}`

## 🚀 Deployment & Scaling

### Simple Production Deployment

The Docker setup is production-ready out of the box:

```bash
# Clone and start
git clone https://github.com/nee1k/prompt-systems-monitor.git
cd emissary
docker-compose up -d

# Access your application
# Frontend: http://localhost
# API: http://localhost/api/docs
```
