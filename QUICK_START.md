# Quick Start Guide

Get the AI Educational Platform running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Anthropic Claude API key ([Get one here](https://console.anthropic.com/))

## Step 1: Clone and Navigate

```bash
cd ai-educational-platform
```

## Step 2: Set Environment Variables

```bash
# Create backend .env file
cp backend/.env.example backend/.env

# Edit backend/.env and add your Anthropic API key:
# ANTHROPIC_API_KEY=your-api-key-here
```

## Step 3: Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Step 4: Verify System is Running

Test the backend is working:

```bash
# Test root endpoint
curl http://localhost:3001/

# Test health check
curl http://localhost:3001/health

# View API documentation
# Open in browser: http://localhost:3001/v1/docs
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:3001/ | Select-Object -Expand Content
```

**Access Points:**
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/v1/docs
- **Health Check**: http://localhost:3001/health

> **Note**: Frontend is not yet implemented. See `TESTING_GUIDE.md` for complete testing instructions.

## Step 5: Test Database and Redis

```bash
# Test PostgreSQL
docker exec -it edu-postgres psql -U postgres -d edu_platform -c "SELECT current_database();"

# Test Redis
docker exec -it edu-redis redis-cli PING
```

Expected outputs:
- PostgreSQL: `edu_platform`
- Redis: `PONG`

> **Note**: User creation and authentication endpoints are not yet implemented. See `IMPLEMENTATION_GUIDE.md` to implement these features.

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs edu-postgres
```

### Backend Not Starting
```bash
# View backend logs
docker logs edu-backend

# Check if .env file exists
ls backend/.env
```

### Frontend Not Loading
```bash
# View frontend logs
docker logs edu-frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

## Development Mode

For development with hot-reload:

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Next Steps

1. **Explore the API**: Visit http://localhost:3001/v1/docs
2. **Review Documentation**: Check `/plans` directory for complete specs
3. **Start Implementing**: Follow `IMPLEMENTATION_GUIDE.md`
4. **Run Tests**: `cd backend && pytest`

## Need Help?

- Check `PROJECT_STATUS.md` for implementation status
- Review `IMPLEMENTATION_GUIDE.md` for detailed instructions
- See `/plans` directory for complete documentation

## Stop Services

```bash
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## What You Can Test Now

### ✅ Currently Available

1. **Authentication System**
   ```bash
   # Register a new user
   curl -X POST http://localhost:3001/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"teacher@example.com","password":"Teacher123!","full_name":"John Teacher","role":"teacher"}'
   
   # Login
   curl -X POST http://localhost:3001/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teacher@example.com","password":"Teacher123!"}'
   
   # Get your profile (use token from login)
   curl -X GET http://localhost:3001/v1/users/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. **User Management**
   ```bash
   # Update your profile
   curl -X PUT http://localhost:3001/v1/users/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"full_name":"Updated Name"}'
   
   # Change password
   curl -X PUT http://localhost:3001/v1/users/me/password \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"current_password":"Teacher123!","new_password":"NewPass123!"}'
   ```

3. **API Documentation**
   - Open http://localhost:3001/v1/docs in your browser
   - Click "Authorize" and enter your access token
   - Test all endpoints interactively

4. **Database & Infrastructure**
   ```bash
   # Access PostgreSQL
   docker exec -it edu-postgres psql -U postgres -d edu_platform
   
   # Access Redis
   docker exec -it edu-redis redis-cli PING
   ```

### ❌ Not Yet Implemented

The following features still need implementation:

- School management endpoints
- Class management endpoints
- Syllabus and lesson management
- Assessment system
- AI generation endpoints (Anthropic Claude integration)
- Analytics and reporting
- Frontend application
- WebSocket support

**For complete testing instructions, see [`TEST_API.md`](TEST_API.md) and [`TESTING_GUIDE.md`](TESTING_GUIDE.md)**

## Implementation Status

### ✅ What's Ready
- Backend infrastructure (FastAPI, PostgreSQL, Redis)
- Docker containerization
- Database models (User model)
- Security utilities (JWT, password hashing)
- API documentation structure
- Health check endpoints

### 🚧 What Needs Implementation
- Authentication system (register, login, JWT tokens)
- User management endpoints
- School management system
- Class and syllabus management
- AI integration (Anthropic Claude)
- Assessment system
- Analytics engine
- Frontend application (Next.js)

### 📋 Next Steps to Make It Functional

1. **Implement Authentication** (2-3 hours)
   - Create auth endpoints
   - Implement JWT token generation
   - Add login/register functionality
   - See `IMPLEMENTATION_GUIDE.md` Phase 1

2. **Implement User Management** (2-3 hours)
   - Create user CRUD endpoints
   - Add role-based access control
   - Implement user profile management

3. **Implement AI Integration** (3-4 hours)
   - Set up Anthropic Claude client
   - Create syllabus generation endpoint
   - Create lesson generation endpoint
   - Add AI tutor functionality

4. **Build Frontend** (1-2 weeks)
   - Set up Next.js application
   - Create authentication pages
   - Build dashboard layouts
   - Implement feature pages

**For detailed implementation steps, see [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)**

## Environment Variables Reference

### Backend (.env)
```bash
# Required
ANTHROPIC_API_KEY=your-api-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/edu_platform
SECRET_KEY=your-secret-key-here

# Optional
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

## Performance Tips

### Backend Optimization
```bash
# Enable Redis caching
REDIS_URL=redis://localhost:6379

# Adjust worker count (Gunicorn)
WORKERS=4
WORKER_CLASS=uvicorn.workers.UvicornWorker

# Database connection pooling
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

### Frontend Optimization
```bash
# Enable production build
npm run build
npm start

# Use CDN for static assets
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY in backend/.env
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Review API key permissions
- [ ] Enable audit logging

## Database Management

### Backup Database
```bash
# Create backup
docker exec edu-postgres pg_dump -U postgres edu_platform > backup.sql

# Restore backup
docker exec -i edu-postgres psql -U postgres edu_platform < backup.sql
```

### Run Migrations
```bash
# Create new migration
docker exec -it edu-backend alembic revision --autogenerate -m "description"

# Apply migrations
docker exec -it edu-backend alembic upgrade head

# Rollback migration
docker exec -it edu-backend alembic downgrade -1
```

### Database Console
```bash
# Access PostgreSQL console
docker exec -it edu-postgres psql -U postgres edu_platform

# Common queries
SELECT COUNT(*) FROM users;
SELECT * FROM schools LIMIT 10;
SELECT * FROM lessons WHERE created_at > NOW() - INTERVAL '7 days';
```

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Database connection
curl http://localhost:3001/health/db

# Redis connection
curl http://localhost:3001/health/redis
```

## Advanced Configuration

### Custom Domain Setup
```bash
# Update docker-compose.yml
environment:
  - VIRTUAL_HOST=yourdomain.com
  - LETSENCRYPT_HOST=yourdomain.com
  - LETSENCRYPT_EMAIL=admin@yourdomain.com
```

### Scaling Services
```bash
# Scale backend workers
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.prod.yml up -d
```

### Enable Debug Mode
```bash
# Backend debug
DEBUG=true
LOG_LEVEL=DEBUG

# Frontend debug
NEXT_PUBLIC_DEBUG=true
```

## Useful Commands

### Docker
```bash
# Rebuild specific service
docker-compose up -d --build backend

# Remove all containers and volumes
docker-compose down -v --remove-orphans

# View resource usage
docker stats

# Clean up unused images
docker system prune -a
```

### Development
```bash
# Format code (backend)
cd backend && black . && isort .

# Lint code (backend)
cd backend && flake8 . && mypy .

# Format code (frontend)
cd frontend && npm run format

# Lint code (frontend)
cd frontend && npm run lint
```

### Testing
```bash
# Run all tests
cd backend && pytest

# Run with coverage
cd backend && pytest --cov=app --cov-report=html

# Run specific test file
cd backend && pytest tests/test_auth.py

# Frontend tests
cd frontend && npm test
```

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Restart service | `docker-compose restart backend` |
| Access backend shell | `docker exec -it edu-backend bash` |
| Access database | `docker exec -it edu-postgres psql -U postgres edu_platform` |
| Run migrations | `docker exec -it edu-backend alembic upgrade head` |
| Create admin user | `docker exec -it edu-backend python scripts/seed.py` |
| Backup database | `docker exec edu-postgres pg_dump -U postgres edu_platform > backup.sql` |
| View API docs | Open http://localhost:3001/v1/docs |

## Getting Help

- **Documentation**: Check `/plans` directory for detailed specs
- **API Reference**: http://localhost:3001/v1/docs
- **Implementation Guide**: See `IMPLEMENTATION_GUIDE.md`
- **Project Status**: Check `PROJECT_STATUS.md`
- **Architecture**: Review `plans/ai-educational-platform-architecture.md`
- **Database Schema**: See `plans/database-schema.md`

## What's Next?

### For Testing Current System
1. **Follow Testing Guide**: See [`TESTING_GUIDE.md`](TESTING_GUIDE.md) for complete testing instructions
2. **Verify Infrastructure**: Ensure all containers are running
3. **Test Endpoints**: Check health and readiness endpoints
4. **Explore API Docs**: Review Swagger UI at http://localhost:3001/v1/docs

### For Development
1. **Review Architecture**: Read `/plans` directory for complete specifications
2. **Start Implementation**: Follow [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md) Phase 1
3. **Implement Auth**: Create authentication endpoints first
4. **Build Features**: Add user management, schools, AI integration
5. **Create Frontend**: Build Next.js application
6. **Deploy**: Use `plans/deployment-guide.md` for production

### Quick Command Reference

```bash
# Start system
docker-compose up -d

# Test backend
curl http://localhost:3001/health

# View logs
docker-compose logs -f backend

# Access database
docker exec -it edu-postgres psql -U postgres -d edu_platform

# Stop system
docker-compose down
```

---

**Current Status**: Infrastructure ready ✅ | Features need implementation 🚧

**See [`TESTING_GUIDE.md`](TESTING_GUIDE.md) for detailed testing instructions.**
