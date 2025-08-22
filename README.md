# Prompt Engineering Test Harness

A testing framework for LLM prompt systems with automated evaluation and scheduling.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API key

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd prompt-systems-monitor
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   Open [http://localhost](http://localhost) in your browser

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

## Usage

1. **Create Prompt System**: Define templates with `{variable}` placeholders
2. **Upload Test Data**: CSV/JSONL files with test cases and expected outputs
3. **Run Tests**: Choose evaluation method (fuzzy, exact, semantic)
4. **Schedule Tests**: Automate testing with configurable intervals
5. **Compare Models**: Test prompts across different AI models

### Example

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