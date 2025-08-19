# Prompt System Monitor

> **A lightweight, scalable application for monitoring and evaluating LLM prompt systems**

Define prompt templates, upload test datasets, and run automated evaluations with detailed scoring. Perfect for development teams, researchers, and anyone working with LLM applications.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage Guide](#-usage-guide)
- [🤖 Model Providers](#-model-providers)
- [📝 Example Workflow](#-example-workflow)
- [📄 File Formats](#-file-formats)
- [🚀 Deployment & Scaling](#-deployment--scaling)
- [🔧 Manual Setup](#-manual-setup)
- [📊 Contributing](#-contributing)

## ✨ Features

- **🎯 Prompt System Management** - Create and save prompt templates with variable placeholders
- **⚙️ Model Configuration** - Configure temperature, max_tokens, top_p for different LLM models
- **📊 Regression Testing** - Upload CSV/JSONL files with test cases and expected outputs
- **🤖 Automated Evaluation** - Run tests with fuzzy string matching and detailed scoring
- **📈 Results Tracking** - View historical test runs and per-sample results
- **🎨 Modern UI** - Clean React interface with real-time feedback
- **🔌 Multi-Provider Support** - OpenAI (cloud) and Ollama (local) models
- **📦 Containerized** - Production-ready with Docker and Kubernetes support

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) with SQLAlchemy
- **Frontend**: React + Vite
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Cache**: Redis (production)
- **LLM Providers**: OpenAI API + Ollama
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

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- **OpenAI API key** (optional - can use Ollama for local models)

### Simple Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nee1k/prompt-systems-monitor.git
   cd emissary
   ```

2. **Configure environment (optional):**
   ```bash
   cp server/env.example .env
   # Add your OpenAI API key to .env (only needed for OpenAI models)
   ```

3. **Start everything with Docker:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - 🌐 **Frontend**: http://localhost
   - 📚 **API Docs**: http://localhost/api/docs

That's it! The application is now running with PostgreSQL, Redis, and all services ready to use.

### Alternative: Development Setup

For local development without Docker:

```bash
# Install dependencies
npm run install-all

# Set up environment
cd server && cp env.example .env

# Start services
npm run dev
```

## 📖 Usage Guide

### 1. Create a Prompt System
- Navigate to **"Create System"**
- Choose your **provider**: OpenAI (cloud) or Ollama (local)
- Select a **model** from the available options
- Enter a **name** and **template** with `{variable}` placeholders
- Define your **variables** (comma-separated)
- Configure **model parameters** (temperature, max_tokens, etc.)

### 2. Upload a Regression Set
- Go to **"Run Test"**
- Upload a **CSV** or **JSONL** file with your test data
- Ensure your file has columns for variables and an `expected_output` column

### 3. Run Tests
- Select your **prompt system**
- Upload your **regression set**
- Click **"Run Test"** to execute

### 4. View Results
- See **immediate results** after test completion
- View **historical results** in "Test Results"
- Analyze **per-sample scoring** and **aggregate metrics**

## 🔧 Advanced Setup

### Manual Installation (without Docker)

If you prefer to run services manually:

```bash
# Backend
cd server
pip install -r requirements.txt
cp env.example .env
python run.py

# Frontend (in another terminal)
cd client
npm install
npm run dev
```

### Ollama Setup (for local models)

```bash
# Run the automated setup script
python scripts/setup_ollama.py

# Or manually install Ollama
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
```

## 🤖 Model Providers

| Provider | Cost | Quality | Speed | Use Case |
|----------|------|---------|-------|----------|
| **OpenAI** | Pay-per-use | High | Fast | Production, high-quality outputs |
| **Ollama** | Free | Good | Variable | Development, testing, privacy |

### OpenAI (Cloud) ☁️
- **Models**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- **Pros**: High quality, fast inference, reliable
- **Cons**: API costs, requires internet
- **Best for**: Production applications, high-quality outputs

### Ollama (Local) 🏠
- **Models**: Llama 3, Mistral, Phi-3, Qwen, Code Llama
- **Pros**: Free, privacy-friendly, no internet required
- **Cons**: Lower quality, variable speed
- **Best for**: Development, testing, cost-sensitive projects

## 📝 Example Workflow

### 1. Create a Prompt System
```
Template: "Translate the following text to {language}: {text}"
Variables: text, language
Provider: OpenAI
Model: GPT-3.5 Turbo
```

### 2. Prepare Test Data (CSV)
```csv
text,language,expected_output
"Hello world","French","Bonjour le monde"
"Good morning","Spanish","Buenos días"
"Thank you","German","Danke"
```

### 3. Run Tests & Analyze Results
- Upload your regression set
- Execute tests across all samples
- Review per-sample scoring and aggregate metrics
- Track performance over time

## 📄 File Formats

### CSV Format
- Headers should include variable names and `expected_output`
- Example: `text,language,expected_output`

### JSONL Format
- Each line is a JSON object
- Should include variable fields and `expected_output`
- Example: `{"text": "Hello", "language": "French", "expected_output": "Bonjour"}`

## 🚀 Deployment & Scaling

### Simple Production Deployment

The Docker setup is production-ready out of the box:

```bash
# Clone and start
git clone https://github.com/nee1k/prompt-systems-monitor.git
cd emissary
docker-compose up -d

# Access your application
# Frontend: http://localhost
# API: http://localhost/api/docs
```

### Architecture Comparison

| Aspect | Development | Production (Docker) |
|--------|-------------|---------------------|
| **Database** | SQLite (file-based) | PostgreSQL (client-server) |
| **Architecture** | Monolithic | Microservices |
| **Scaling** | Single instance | Horizontal scaling ready |
| **Use Case** | Local development | Multi-user, production |



### 🏗️ Scalable Architecture

The production-ready containerized version includes:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │ PostgreSQL  │
│   (React)   │◄──►│  (FastAPI)  │◄──►│  Database   │
│   Port 3000 │    │   Port 8000 │    │   Port 5432 │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌─────────────┐
                    │    Redis    │
                    │   Cache     │
                    │   Port 6379 │
                    └─────────────┘
```

**Components:**
- **🗄️ PostgreSQL** - Production-ready database with ACID compliance
- **⚡ Redis** - Caching and session management
- **🔧 FastAPI Backend** - Containerized with health checks
- **🎨 React Frontend** - Containerized with hot reload
- **🌐 Nginx** - Reverse proxy and load balancing
- **🐳 Docker Compose** - Orchestration and service management

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