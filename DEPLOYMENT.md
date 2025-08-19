# Emissary Deployment Guide

## Scalable Architecture Overview

The containerized version of Emissary includes:

- **PostgreSQL**: Production-ready database with ACID compliance
- **Redis**: Caching and session management
- **FastAPI Backend**: Containerized with health checks
- **React Frontend**: Containerized with hot reload
- **Nginx**: Reverse proxy and load balancing
- **Docker Compose**: Orchestration and service management

## Quick Start (Production)

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

## Development vs Production

### Development (Current)
- **Database**: SQLite (file-based)
- **Architecture**: Monolithic
- **Scaling**: Single instance
- **Use case**: Local development, testing

### Production (Containerized)
- **Database**: PostgreSQL (client-server)
- **Architecture**: Microservices
- **Scaling**: Horizontal scaling possible
- **Use case**: Multi-user, production deployment

## Scaling Benefits

### ✅ **PostgreSQL Advantages**
- **Concurrent users**: Multiple simultaneous connections
- **ACID compliance**: Data integrity guarantees
- **Backup/restore**: Point-in-time recovery
- **Replication**: Read replicas for scaling
- **Connection pooling**: Efficient resource usage

### ✅ **Containerization Benefits**
- **Isolation**: Services don't interfere with each other
- **Portability**: Run anywhere Docker is available
- **Scalability**: Easy horizontal scaling
- **Orchestration**: Kubernetes-ready
- **Health monitoring**: Built-in health checks

### ✅ **Redis Benefits**
- **Caching**: Faster response times
- **Session storage**: User session management
- **Rate limiting**: API protection
- **Job queues**: Background task processing

## Deployment Options

### 1. **Docker Compose (Recommended)**
```bash
docker-compose up -d
```
- Good for: Small to medium deployments
- Pros: Simple, self-contained
- Cons: Limited scaling

### 2. **Kubernetes**
```bash
kubectl apply -f k8s/
```
- Good for: Large-scale deployments
- Pros: Auto-scaling, high availability
- Cons: Complex setup

### 3. **Cloud Platforms**
- **AWS**: ECS, EKS, RDS
- **Google Cloud**: GKE, Cloud SQL
- **Azure**: AKS, Azure Database

## Monitoring & Maintenance

### Health Checks
- Backend: `GET /health`
- Database: PostgreSQL health check
- Redis: Ping health check

### Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f
```

### Database Backup
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U emissary emissary > backup.sql

# Restore
docker-compose exec -T postgres psql -U emissary emissary < backup.sql
```

## Performance Tuning

### Database
- **Connection pooling**: Configure pool size
- **Indexing**: Add indexes for frequent queries
- **Query optimization**: Monitor slow queries

### Application
- **Caching**: Redis for frequently accessed data
- **Async processing**: Background job queues
- **Load balancing**: Multiple backend instances

### Infrastructure
- **Resource limits**: Set CPU/memory limits
- **Auto-scaling**: Scale based on metrics
- **CDN**: Static asset delivery

## Security Considerations

- **Environment variables**: Secure API keys
- **Network isolation**: Internal service communication
- **Database security**: Strong passwords, SSL
- **Container security**: Non-root users, minimal images
- **HTTPS**: SSL/TLS termination at Nginx

## Migration from SQLite

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
