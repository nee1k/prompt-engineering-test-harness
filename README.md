<h1 align="center">Prompt Engineering Test Harness</h1>

> **A comprehensive testing framework for LLM prompt systems with automated evaluation and scheduling**

Create prompt templates with variables, upload regression test datasets, run evaluations with scoring functions, and schedule automated testing workflows. Monitor performance over time with detailed results and notifications.

## Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose) installed and running.
- **OpenAI API key** (optional - can use Ollama for local models)
- Copy `.env.example` to `.env` and fill in your API keys and settings:

**Clone and start:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd prompt-systems-monitor
   cp .env.example .env
   # Edit .env with your API keys and email settings
   docker-compose up -d
   ```
Go to [http://localhost](http://localhost) to access the application.

## ⚙️ Configuration

### Environment Setup
1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your API keys and settings:**
   ```bash
   # Required: OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Email notifications (Gmail recommended)
   SMTP_SERVER=smtp.gmail.com
   SMTP_USERNAME=your_email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   FROM_EMAIL=your_email@gmail.com
   ```

3. **Gmail App Password Setup:**
   - Enable 2-Factor Authentication on your Google account
   - Go to Google Account → Security → App passwords → Mail
   - Generate a 16-character App Password
   - Use this App Password (not your regular Gmail password)

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