# Docker Setup for Qik URL

This guide explains how to run the Qik URL shortener using Docker and Docker Compose.

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **Update environment variables in `.env`:**
   ```bash
   PORT=3000
   FIREBASE_PROJECT_ID=your-actual-project-id
   REDIS_PASSWORD=your-redis-password  # Optional
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

## Services

### Redis
- **Image:** redis:7-alpine
- **Port:** 6379
- **Data persistence:** Enabled with volume
- **Health checks:** Enabled

### Application
- **Build:** From Dockerfile
- **Port:** 3000 (configurable)
- **Dependencies:** Waits for Redis to be healthy
- **Health checks:** Enabled

## Development vs Production

### Development
```bash
# Run with live reload (if you add nodemon)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or run just Redis and your app locally
docker-compose up redis
npm run dev
```

### Production
```bash
# Build and run optimized containers
docker-compose up -d --build
```

## Useful Commands

```bash
# View running containers
docker-compose ps

# Execute commands in containers
docker-compose exec app sh
docker-compose exec redis redis-cli

# View resource usage
docker stats

# Clean up everything
docker-compose down -v --remove-orphans
docker system prune -a
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connectivity
docker-compose exec redis redis-cli ping
```

### Application Issues
```bash
# Check app logs
docker-compose logs app

# Rebuild app container
docker-compose up --build app
```

### Health Check Status
```bash
# Check health status
docker-compose ps
curl http://localhost:3000/health
```
