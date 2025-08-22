# Prompt Engineering Test Harness

[![Tests](https://github.com/nee1k/prompt-engineering-test-harness/workflows/Run%20Tests/badge.svg)](https://github.com/nee1k/prompt-engineering-test-harness/actions)

A comprehensive testing framework for prompt engineering systems with automated evaluation, optimization, and monitoring capabilities.

## Features

- **Automated Test Runs**: Execute prompt systems against regression datasets
- **LLM Integration**: Support for OpenAI and Ollama providers
- **Prompt Optimization**: AI-powered prompt improvement suggestions
- **Evaluation Metrics**: Multiple evaluation functions (fuzzy, exact, semantic, contains)
- **Real-time Monitoring**: Live optimization progress tracking
- **Comprehensive Testing**: Full test suite with mocked dependencies

## Quick Start

### Prerequisites

- Python 3.9+
- Docker and Docker Compose (for full stack)
- OpenAI API key (optional, for OpenAI integration)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nee1k/prompt-engineering-test-harness.git
   cd prompt-engineering-test-harness
   ```

2. **Run with Docker** (recommended):
   ```bash
   docker-compose up -d
   ```
   Access the application at: http://localhost:3000

3. **Or run locally**:
   ```bash
   # Backend setup
   cd server
   ./setup.sh  # macOS/Linux
   # or setup.bat  # Windows
   
   # Start the backend
   source venv/bin/activate
   python main.py
   
   # Frontend setup (in another terminal)
   cd client
   npm install
   npm start
   ```

## API Documentation

Once running, visit:
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

## Testing

The project includes a comprehensive test suite:

```bash
cd server
source venv/bin/activate
python -m pytest tests/ -v
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.