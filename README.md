# Emissary - Prompt System Monitor

A lightweight application for monitoring and evaluating LLM prompt systems. Define prompt templates, upload test datasets, and run automated evaluations with detailed scoring.

## Features

- **Prompt System Management**: Create and save prompt templates with variable placeholders
- **Model Configuration**: Set parameters like temperature, max_tokens, top_p for different LLM models
- **Regression Testing**: Upload CSV/JSONL files with test cases and expected outputs
- **Automated Evaluation**: Run tests and get detailed scoring using fuzzy string matching
- **Results Tracking**: View historical test runs and detailed per-sample results
- **Simple UI**: Clean React interface for easy interaction

## Tech Stack

- **Backend**: FastAPI (Python) with SQLAlchemy and SQLite
- **Frontend**: React + Vite
- **LLM Integration**: OpenAI API + Ollama (local models)
- **Evaluation**: Fuzzy string similarity using difflib

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment (optional for OpenAI):**
   ```bash
   cd server
   cp env.example .env
   # Add your OpenAI API key to .env (only needed for OpenAI models)
   ```

3. **Set up Ollama (optional for local models):**
   ```bash
   python scripts/setup_ollama.py
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## Usage Example

1. **Create a prompt system:**
   - Choose provider (OpenAI or Ollama)
   - Select model (GPT-3.5 Turbo, Llama 3, etc.)
   - Template: `"Translate the following text to {language}: {text}"`
   - Variables: `text, language`

2. **Upload a regression set (CSV):**
   ```csv
   text,language,expected_output
   "Hello world","French","Bonjour le monde"
   "Good morning","Spanish","Buenos días"
   ```

3. **Run the test** and view detailed results with per-sample scoring.

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (optional - can use Ollama for local models)
- Ollama (optional - for local model inference)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment (optional for OpenAI):**
   ```bash
   cd server
   cp env.example .env
   # Add your OpenAI API key to .env (only needed for OpenAI models)
   ```

3. **Set up Ollama (optional for local models):**
   ```bash
   python scripts/setup_ollama.py
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## Manual Setup

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd server
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   cp env.example .env
   # Add your OpenAI API key to .env
   ```

3. **Run the server:**
   ```bash
   python run.py
   ```

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

## Usage

1. **Create a Prompt System:**
   - Go to "Create System"
   - Choose provider: OpenAI (cloud) or Ollama (local)
   - Select a model from the available options
   - Enter a name, template with {variable} placeholders, and variables
   - Set model parameters (temperature, max_tokens, etc.)

2. **Upload a Regression Set:**
   - Go to "Run Test"
   - Upload a CSV or JSONL file with your test data
   - File should have columns for variables and an 'expected_output' column

3. **Run Tests:**
   - Select a prompt system
   - Upload regression set
   - Click "Run Test" to execute

4. **View Results:**
   - See immediate results after test completion
   - View historical results in "Test Results"

## Model Providers

### OpenAI (Cloud)
- Requires API key
- Models: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- Higher quality, faster inference
- Pay-per-use pricing

### Ollama (Local)
- Free, runs locally
- Models: Llama 3, Mistral, Phi-3, Qwen, Code Llama
- Lower quality but sufficient for testing
- No API costs, privacy-friendly

## File Formats

### CSV Format
- Headers should include variable names and `expected_output`
- Example: `text,language,expected_output`

### JSONL Format
- Each line is a JSON object
- Should include variable fields and `expected_output`
- Example: `{"text": "Hello", "language": "French", "expected_output": "Bonjour"}`