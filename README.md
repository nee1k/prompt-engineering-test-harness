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

## Documentation

See [SETUP.md](SETUP.md) for detailed setup instructions and examples.