# Prompt Engineering Test Harness

A testing framework for LLM prompt systems with automated evaluation, scheduling, and AI-powered prompt optimization.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API key

### Installation & Running

1. **Clone and setup:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd prompt-systems-monitor
   cp env.template .env
   # Edit .env with your OpenAI API key
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:8000](http://localhost:8000)
   - Nginx (proxy): [http://localhost](http://localhost)

## Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Optional (for email notifications):
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
```

## Features

- **Prompt Systems**: Create and manage prompt templates with variables
- **Test Execution**: Run tests with multiple evaluation methods
- **Scheduled Testing**: Automate tests with configurable intervals
- **Model Comparison**: Compare prompts across different AI models
- **AI Prompt Optimizer**: Automatically improve prompts using LLM analysis
- **Redis Persistence**: Optimization sessions survive server restarts

## Usage Example

**Prompt Template:**
```
Translate the following text to {language}: {text}
```

**Test Data (CSV):**
```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
```

**Result:** Get scores comparing AI outputs with expected translations

## Evaluation Methods

- `fuzzy` - String similarity (0.0-1.0)
- `exact` - Perfect match (0.0 or 1.0)
- `semantic` - Semantic similarity
- `contains` - Substring matching

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, Redis
- **Frontend**: React 18, Vite
- **LLM**: OpenAI, Ollama
- **Infrastructure**: Docker, Nginx