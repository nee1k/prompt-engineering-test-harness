# Emissary Setup Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (optional - can use Ollama for local models)
- Ollama (optional - for local model inference)

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd emissary
   npm run install-all
   ```

2. **Set up environment variables (optional for OpenAI):**
   ```bash
   cd server
   cp env.example .env
   # Edit .env and add your OpenAI API key (only needed for OpenAI models)
   ```

3. **Set up Ollama (optional for local models):**
   ```bash
   # Run the setup script
   python scripts/setup_ollama.py
   
   # Or manually:
   # macOS: brew install ollama
   # Linux: curl -fsSL https://ollama.ai/install.sh | sh
   # Then: ollama serve
   # Pull a model: ollama pull llama3:8b
   ```

4. **Start the application:**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:8000
   - Frontend on http://localhost:3000

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

## Example

**Prompt Template:**
```
Translate the following text to {language}: {text}
```

**Variables:** `text, language`

**Sample Regression Set (CSV):**
```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
```

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

## API Documentation

Once the server is running, visit http://localhost:8000/docs for interactive API documentation.

## File Formats

### CSV Format
- Headers should include variable names and `expected_output`
- Example: `text,language,expected_output`

### JSONL Format
- Each line is a JSON object
- Should include variable fields and `expected_output`
- Example: `{"text": "Hello", "language": "French", "expected_output": "Bonjour"}`
