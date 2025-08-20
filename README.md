# LLM Prompt Evaluation Dashboard

> **A lightweight application for monitoring and evaluating LLM prompt systems**

Define prompt templates, upload test datasets, and run automated evaluations with detailed scoring.

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- **OpenAI API key** (optional - can use Ollama for local models)

1. **Clone and start:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd llm-prompt-evaluation-dashboard
   docker-compose up -d
   ```

2. **Access the application:**
   - 🌐 **Frontend**: http://localhost
   - 📚 **API Docs**: http://localhost/api/docs

### Environment Setup (Optional)
```bash
# Add your OpenAI API key (only needed for OpenAI models)
echo "OPENAI_API_KEY=your_key_here" >> .env
```

## 📖 Usage

### 1. Create a Prompt System
- Go to **"Create System"**
- Enter a **name** and **template** with `{variable}` placeholders
- Define your **variables** (comma-separated)
- Select a **model** and **provider** (OpenAI or Ollama)

```
Template: "Translate the following text to {language}: {text}"
Variables: text, language
Provider: OpenAI
Model: GPT-3.5 Turbo
```

### 2. Run Tests
- Select your **prompt system**
- Upload a **CSV** or **JSONL** file with test data
- Click **"Run Test"** to execute

```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
```

View results in **"Test Results"**

## 🔧 Tech Stack

- **Backend**: FastAPI (Python) with SQLAlchemy
- **Frontend**: React + Vite
- **Database**: PostgreSQL
- **LLM Providers**: OpenAI API + Ollama
- **Evaluation**: Fuzzy string similarity

## 🐳 Ollama Setup (Local Models)

```bash
# Automated setup
python scripts/setup_ollama.py

# Or manual installation
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```