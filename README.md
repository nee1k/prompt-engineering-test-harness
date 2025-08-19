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

## Deployment & Scaling

### Development vs Production

#### Development (Current)
- **Database**: SQLite (file-based)
- **Architecture**: Monolithic
- **Scaling**: Single instance
- **Use case**: Local development, testing

#### Production (Containerized)
- **Database**: PostgreSQL (client-server)
- **Architecture**: Microservices
- **Scaling**: Horizontal scaling possible
- **Use case**: Multi-user, production deployment

### Quick Start (Production)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd emissary
   cp server/env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - API Docs: http://localhost/api/docs
   - Database: localhost:5432

### Scalable Architecture

The containerized version includes:

- **PostgreSQL**: Production-ready database with ACID compliance
- **Redis**: Caching and session management
- **FastAPI Backend**: Containerized with health checks
- **React Frontend**: Containerized with hot reload
- **Nginx**: Reverse proxy and load balancing
- **Docker Compose**: Orchestration and service management

### Scaling Benefits

#### ✅ **PostgreSQL Advantages**
- **Concurrent users**: Multiple simultaneous connections
- **ACID compliance**: Data integrity guarantees
- **Backup/restore**: Point-in-time recovery
- **Replication**: Read replicas for scaling
- **Connection pooling**: Efficient resource usage

#### ✅ **Containerization Benefits**
- **Isolation**: Services don't interfere with each other
- **Portability**: Run anywhere Docker is available
- **Scalability**: Easy horizontal scaling
- **Orchestration**: Kubernetes-ready
- **Health monitoring**: Built-in health checks

#### ✅ **Redis Benefits**
- **Caching**: Faster response times
- **Session storage**: User session management
- **Rate limiting**: API protection
- **Job queues**: Background task processing

### Deployment Options

#### 1. **Docker Compose (Recommended)**
```bash
docker-compose up -d
```
- Good for: Small to medium deployments
- Pros: Simple, self-contained
- Cons: Limited scaling

#### 2. **Kubernetes**
```bash
kubectl apply -f k8s/
```
- Good for: Large-scale deployments
- Pros: Auto-scaling, high availability
- Cons: Complex setup

#### 3. **Cloud Platforms**
- **AWS**: ECS, EKS, RDS
- **Google Cloud**: GKE, Cloud SQL
- **Azure**: AKS, Azure Database

### Monitoring & Maintenance

#### Health Checks
- Backend: `GET /health`
- Database: PostgreSQL health check
- Redis: Ping health check

#### Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f
```

#### Database Backup
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U emissary emissary > backup.sql

# Restore
docker-compose exec -T postgres psql -U emissary emissary < backup.sql
```

### Performance Tuning

#### Database
- **Connection pooling**: Configure pool size
- **Indexing**: Add indexes for frequent queries
- **Query optimization**: Monitor slow queries

#### Application
- **Caching**: Redis for frequently accessed data
- **Async processing**: Background job queues
- **Load balancing**: Multiple backend instances

#### Infrastructure
- **Resource limits**: Set CPU/memory limits
- **Auto-scaling**: Scale based on metrics
- **CDN**: Static asset delivery

### Security Considerations

- **Environment variables**: Secure API keys
- **Network isolation**: Internal service communication
- **Database security**: Strong passwords, SSL
- **Container security**: Non-root users, minimal images
- **HTTPS**: SSL/TLS termination at Nginx

### Migration from SQLite

To migrate existing data from SQLite to PostgreSQL:

1. **Export SQLite data:**
   ```bash
   sqlite3 server/emissary.db .dump > migration.sql
   ```

2. **Transform for PostgreSQL:**
   ```bash
   # Convert SQLite syntax to PostgreSQL
   sed 's/AUTOINCREMENT/SERIAL/g' migration.sql > postgres_migration.sql
   ```

3. **Import to PostgreSQL:**
   ```bash
   docker-compose exec postgres psql -U emissary emissary < postgres_migration.sql
   ```