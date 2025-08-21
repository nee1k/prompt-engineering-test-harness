<h1 align="center">Prompt Engineering Test Harness</h1>

<div align="center">


**A comprehensive testing framework for LLM prompt systems with automated evaluation and scheduling**

[Features](#-features) • [Quick Start](#-quick-start) • [Configuration](#️-configuration) • [Usage](#-usage) • [API Reference](#-api-reference)

</div>

---

**Prompt Engineering Test Harness** is a production-ready testing framework designed for Large Language Model (LLM) prompt systems. It enables you to create, test, and monitor prompt templates with automated evaluation, regression testing, and performance monitoring.

## ✨ Features

- 🧪 **Automated Testing**: Run regression tests with multiple evaluation methods
- 📊 **Performance Monitoring**: Track scores over time with detailed analytics
- ⏰ **Scheduled Testing**: Automate test runs with configurable intervals
- 📧 **Email Alerts**: Get notified when performance drops or tests fail
- 🔄 **Multi-Provider Support**: Test with OpenAI, Ollama, and custom providers
- 🎯 **Flexible Evaluation**: Fuzzy matching, exact match, semantic similarity
- 🐳 **Docker Ready**: Complete containerized setup with PostgreSQL and Redis

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose) installed
- **OpenAI API key** (or Ollama for local models)
- **Gmail account** (for email notifications, optional)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd prompt-systems-monitor
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   Open [http://localhost](http://localhost) in your browser


## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

```bash
# Required: OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Email Notifications (Gmail recommended)
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password
FROM_EMAIL=your_email@gmail.com

# Optional: Ollama Configuration
OLLAMA_HOST=host.docker.internal
```

### Gmail App Password Setup

For email notifications, you'll need a Gmail App Password:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a 16-character password
3. **Use the App Password** (not your regular Gmail password) in `SMTP_PASSWORD`

### Alternative Email Providers

- **Outlook/Hotmail**: `SMTP_SERVER=smtp-mail.outlook.com`
- **Yahoo**: `SMTP_SERVER=smtp.mail.yahoo.com`
- **Custom SMTP**: Use your own server details

## 📖 Usage

### 1. Create a Prompt System

Navigate to the **Prompt Systems** tab and click **"Create New Prompt System"**:

- **Name**: Give your system a descriptive name
- **Template**: Create a prompt template with `{variable}` placeholders
- **Variables**: Define the variables used in your template
- **Provider**: Choose OpenAI or Ollama
- **Model**: Select the appropriate model for your use case

**Example:**
```
Template: "Translate the following text to {language}: {text}"
Variables: text, language
Provider: OpenAI
Model: GPT-4 Turbo
```

### 2. Upload Test Data

Prepare a CSV or JSONL file with your test cases:

**CSV Format:**
```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
"Thank you","German","Danke"
```

**JSONL Format:**
```jsonl
{"text": "Hello world", "language": "French", "expected_output": "Bonjour le monde"}
{"text": "Good morning", "language": "Spanish", "expected_output": "Buenos días"}
```

### 3. Run Tests

1. Click **"Test a System"** next to your prompt system
2. Select your prompt system from the dropdown
3. Choose an evaluation function (fuzzy, exact, semantic)
4. Upload your test data file
5. Click **"Run Test"** to execute

### 4. View Results

- **Immediate Results**: See scores and predictions for each test case
- **Performance Metrics**: Average score, total samples, evaluation method
- **Detailed Analysis**: Compare expected vs. predicted outputs

### 5. Schedule Automated Testing

1. Go to **"Test Schedules"** tab
2. Click **"Create New Schedule"**
3. Configure:
   - **Schedule Name**: Descriptive name for your automated test
   - **Prompt System**: Select the system to test
   - **Interval**: How often to run tests (minutes)
   - **Evaluation Function**: Choose evaluation method
   - **Email Notifications**: Enable alerts for performance drops
   - **Test Data**: Upload your regression set

### 6. Monitor Performance

- **History**: View all test runs for each system
- **Trends**: Track performance over time
- **Alerts**: Receive email notifications when scores drop

## 🔧 Tech Stack

### Backend
- **Framework**: FastAPI (Python) with async support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for session management
- **Scheduler**: APScheduler for automated test runs
- **Email**: SMTP integration for notifications

### Frontend
- **Framework**: React 18 with modern hooks
- **Build Tool**: Vite for fast development
- **Styling**: CSS3 with modern design patterns
- **State Management**: React hooks and context

### LLM Integration
- **OpenAI**: GPT-3.5, GPT-4, and other models
- **Ollama**: Local model support
- **Extensible**: Easy to add new providers

### Evaluation Methods
- **Fuzzy Matching**: String similarity with difflib
- **Exact Match**: Perfect string comparison
- **Semantic Similarity**: Advanced text comparison
- **Contains**: Substring matching

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Reverse Proxy**: Nginx for production deployment
- **Health Checks**: Built-in monitoring
- **Environment Management**: Comprehensive .env support

## 🐳 Ollama Setup (Local Models)

### Automated Setup
```bash
python scripts/setup_ollama.py
```

### Manual Installation

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [Ollama.ai](https://ollama.ai/download)

### Using Ollama Models

1. **Start Ollama service:**
   ```bash
   ollama serve
   ```

2. **Pull a model:**
   ```bash
   ollama pull llama2
   ```

3. **Configure in the app:**
   - Set `OLLAMA_HOST=localhost` in your `.env` file
   - Select "Ollama" as provider when creating prompt systems
   - Choose your local model from the dropdown

## Evaluation Functions

- `fuzzy` - String similarity (0.0-1.0)
- `exact` - Perfect match (0.0 or 1.0)
- `semantic` - Semantic similarity
- `contains` - Substring matching