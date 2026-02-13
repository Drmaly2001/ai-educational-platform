# Testing Guide - AI Educational Platform

## Current Implementation Status

**What's Implemented:**
- ✅ Backend core structure (FastAPI app)
- ✅ Database configuration (PostgreSQL)
- ✅ Redis configuration
- ✅ Docker setup
- ✅ Basic health endpoints
- ✅ User model
- ✅ Security utilities

**What's NOT Yet Implemented:**
- ❌ API endpoints (auth, users, schools, etc.)
- ❌ Frontend application
- ❌ AI integration
- ❌ Full database models

## How to Test the Current System

### Step 1: Prerequisites Check

```bash
# Check Docker is installed
docker --version
# Should show: Docker version 20.x or higher

# Check Docker Compose is installed
docker-compose --version
# Should show: Docker Compose version 2.x or higher

# Navigate to project directory
cd ai-educational-platform
```

### Step 2: Set Up Environment

```bash
# Create backend .env file
cp backend/.env.example backend/.env

# Edit backend/.env and add required variables
# Minimum required:
# ANTHROPIC_API_KEY=your-key-here (get from https://console.anthropic.com/)
# JWT_SECRET=your-secret-key-here (any random string)
```

**Windows (PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

**Windows (CMD):**
```cmd
copy backend\.env.example backend\.env
notepad backend\.env
```

### Step 3: Start the System

```bash
# Start all services
docker-compose up -d

# Expected output:
# Creating network "edu-network"
# Creating volume "postgres_data"
# Creating volume "redis_data"
# Creating edu-postgres ... done
# Creating edu-redis    ... done
# Creating edu-backend  ... done
```

**Windows:**
```cmd
docker-compose up -d
```

### Step 4: Verify Services Are Running

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME           STATUS    PORTS
# edu-postgres   Up        0.0.0.0:5432->5432/tcp
# edu-redis      Up        0.0.0.0:6379->6379/tcp
# edu-backend    Up        0.0.0.0:3001->3001/tcp
```

**Windows:**
```cmd
docker-compose ps
```

### Step 5: Test Backend Health

#### Test 1: Root Endpoint
```bash
curl http://localhost:3001/

# Expected response:
# {
#   "name": "AI Educational Platform",
#   "version": "1.0.0",
#   "status": "running",
#   "environment": "development"
# }
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/ | Select-Object -Expand Content
```

**Windows (CMD with curl):**
```cmd
curl http://localhost:3001/
```

**Browser:**
Open http://localhost:3001/ in your browser

#### Test 2: Health Check
```bash
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-02-12T20:00:00.000000"
# }
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/health | Select-Object -Expand Content
```

**Browser:**
Open http://localhost:3001/health

#### Test 3: Readiness Check
```bash
curl http://localhost:3001/ready

# Expected response:
# {
#   "status": "ready",
#   "timestamp": "2026-02-12T20:00:00.000000"
# }
```

#### Test 4: API Documentation
**Browser:**
Open http://localhost:3001/v1/docs

You should see the Swagger UI with API documentation.

### Step 6: Test Database Connection

```bash
# Access PostgreSQL container
docker exec -it edu-postgres psql -U postgres -d edu_platform

# Run test query
SELECT current_database();

# Expected output:
# current_database
# -----------------
# edu_platform

# Check if users table exists
\dt

# Expected output:
# List of relations
# Schema | Name  | Type  | Owner
# --------+-------+-------+----------
# public | users | table | postgres

# Exit PostgreSQL
\q
```

**Windows:**
```cmd
docker exec -it edu-postgres psql -U postgres -d edu_platform
```

### Step 7: Test Redis Connection

```bash
# Access Redis container
docker exec -it edu-redis redis-cli

# Test Redis
PING

# Expected output:
# PONG

# Set a test value
SET test "Hello Redis"

# Get the value
GET test

# Expected output:
# "Hello Redis"

# Exit Redis
exit
```

**Windows:**
```cmd
docker exec -it edu-redis redis-cli
```

### Step 8: View Logs

```bash
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend

# View last 50 lines
docker-compose logs --tail=50 backend
```

**Windows:**
```cmd
docker-compose logs backend
```

### Step 9: Test Backend Directly (Without Docker)

If you want to test the backend without Docker:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://postgres:password@localhost:5432/edu_platform
export REDIS_URL=redis://localhost:6379/0
export ANTHROPIC_API_KEY=your-key-here
export JWT_SECRET=your-secret-here

# Run the application
python -m app.main

# Or use uvicorn directly
uvicorn app.main:app --reload --port 3001
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/edu_platform"
$env:REDIS_URL="redis://localhost:6379/0"
$env:ANTHROPIC_API_KEY="your-key-here"
$env:JWT_SECRET="your-secret-here"
python -m app.main
```

**Windows (CMD):**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
set DATABASE_URL=postgresql://postgres:password@localhost:5432/edu_platform
set REDIS_URL=redis://localhost:6379/0
set ANTHROPIC_API_KEY=your-key-here
set JWT_SECRET=your-secret-here
python -m app.main
```

## Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Bind for 0.0.0.0:3001 failed: port is already allocated`

**Solution:**
```bash
# Find process using port 3001
# Linux/Mac:
lsof -i :3001
# Windows:
netstat -ano | findstr :3001

# Kill the process or change port in docker-compose.yml
```

### Issue 2: Database Connection Failed

**Error:** `could not connect to server: Connection refused`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs edu-postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for health check
docker-compose ps postgres
```

### Issue 3: Backend Container Exits Immediately

**Error:** Container exits with code 1

**Solution:**
```bash
# View backend logs
docker logs edu-backend

# Common issues:
# - Missing .env file
# - Invalid environment variables
# - Python dependency errors

# Rebuild backend
docker-compose up -d --build backend
```

### Issue 4: Cannot Access API Documentation

**Error:** 404 Not Found at http://localhost:3001/v1/docs

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/

# Check backend logs
docker logs edu-backend

# Restart backend
docker-compose restart backend
```

### Issue 5: Docker Compose Command Not Found

**Error:** `docker-compose: command not found`

**Solution:**
```bash
# Try with docker compose (without hyphen)
docker compose up -d

# Or install docker-compose
# Linux:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Windows: Install Docker Desktop (includes docker-compose)
```

## Testing Checklist

Use this checklist to verify your setup:

- [ ] Docker and Docker Compose installed
- [ ] `.env` file created in backend directory
- [ ] `ANTHROPIC_API_KEY` set in `.env`
- [ ] `JWT_SECRET` set in `.env`
- [ ] All containers running (`docker-compose ps`)
- [ ] Root endpoint responds (`curl http://localhost:3001/`)
- [ ] Health endpoint responds (`curl http://localhost:3001/health`)
- [ ] API docs accessible (http://localhost:3001/v1/docs)
- [ ] PostgreSQL accessible (`docker exec -it edu-postgres psql -U postgres`)
- [ ] Redis accessible (`docker exec -it edu-redis redis-cli`)
- [ ] Backend logs show no errors (`docker logs edu-backend`)

## What You Can Test Now

### ✅ Available Tests

1. **Backend API is running**
   - Root endpoint: http://localhost:3001/
   - Health check: http://localhost:3001/health
   - Readiness check: http://localhost:3001/ready
   - API docs: http://localhost:3001/v1/docs

2. **Database is working**
   - PostgreSQL container is running
   - Database `edu_platform` exists
   - Tables are created (users table)

3. **Redis is working**
   - Redis container is running
   - Can set/get values

4. **Docker setup is correct**
   - All containers start successfully
   - Networking between containers works
   - Volumes are created

### ❌ Not Yet Available

1. **Authentication endpoints** - Not implemented yet
   - `/v1/auth/register`
   - `/v1/auth/login`
   - `/v1/auth/refresh`

2. **User management** - Not implemented yet
   - `/v1/users`
   - `/v1/users/{id}`

3. **School management** - Not implemented yet
   - `/v1/schools`

4. **AI features** - Not implemented yet
   - `/v1/ai/generate-syllabus`
   - `/v1/ai/generate-lesson`

5. **Frontend** - Not implemented yet
   - No UI available at http://localhost:3000

## Next Steps

To test more features, you need to implement:

1. **Authentication System**
   - Follow `IMPLEMENTATION_GUIDE.md` Phase 1
   - Implement auth endpoints
   - Test with cURL or Postman

2. **User Management**
   - Implement user CRUD endpoints
   - Create test users
   - Test user operations

3. **Frontend Application**
   - Set up Next.js frontend
   - Create login/register pages
   - Test UI interactions

4. **AI Integration**
   - Implement AI service
   - Test syllabus generation
   - Test lesson generation

## Automated Testing (When Implemented)

Once the backend is fully implemented, you can run automated tests:

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run specific test
pytest tests/test_auth.py::test_register_user
```

## Performance Testing (When Implemented)

```bash
# Install Apache Bench
# Linux: apt-get install apache2-utils
# Mac: brew install ab
# Windows: Download from Apache website

# Test endpoint performance
ab -n 1000 -c 10 http://localhost:3001/health

# Load test with multiple concurrent users
ab -n 10000 -c 100 http://localhost:3001/v1/users
```

## Monitoring (When Implemented)

```bash
# View resource usage
docker stats

# Monitor logs in real-time
docker-compose logs -f

# Check database connections
docker exec -it edu-postgres psql -U postgres -d edu_platform -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory usage
docker exec -it edu-redis redis-cli INFO memory
```

## Clean Up

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove all containers, networks, and images
docker-compose down -v --rmi all

# Clean up Docker system
docker system prune -a
```

**Windows:**
```cmd
docker-compose down
docker-compose down -v
```

## Summary

**Current Status:**
- ✅ Infrastructure is ready (Docker, PostgreSQL, Redis)
- ✅ Backend skeleton is running
- ✅ Basic health endpoints work
- ❌ No API endpoints implemented yet
- ❌ No frontend implemented yet
- ❌ No AI features implemented yet

**To test the full system:**
1. Follow the `IMPLEMENTATION_GUIDE.md`
2. Implement Phase 1 (Authentication & Core)
3. Return to this guide for testing instructions
4. Implement subsequent phases
5. Test each feature as it's implemented

**Current testing is limited to:**
- Verifying infrastructure is running
- Checking basic health endpoints
- Confirming database and Redis connectivity
- Viewing API documentation structure

For full feature testing, continue with implementation following the `IMPLEMENTATION_GUIDE.md`.
