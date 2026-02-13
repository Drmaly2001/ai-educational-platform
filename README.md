# AI Educational Platform

A comprehensive AI-powered educational platform for schools, teachers, and students, powered by Anthropic Claude.

## Features

- 🤖 AI-powered syllabus and lesson generation
- 📚 Interactive learning spaces with real-time AI tutoring
- 📊 Comprehensive analytics and progress tracking
- 📝 Automated assessment generation and grading
- 🎯 Curriculum alignment and standards mapping
- 👥 Multi-role support (Admin, Teacher, Student)
- 🔒 Secure authentication with JWT and OAuth
- 💰 Flexible subscription tiers

## Tech Stack

### Frontend
- Next.js 14+ (React)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand (state management)
- React Query (server state)

### Backend
- FastAPI (Python)
- PostgreSQL 15+
- Redis 7+
- Anthropic Claude API
- JWT authentication

### Infrastructure
- Docker & Docker Compose
- Kubernetes (production)
- AWS/GCP (cloud deployment)
- GitHub Actions (CI/CD)

## Project Structure

```
ai-educational-platform/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── hooks/         # Custom hooks
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
├── docker/                 # Docker configurations
├── k8s/                   # Kubernetes manifests
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-educational-platform
```

2. Set up environment variables:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit the .env files with your configuration
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

### Development Setup

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

```bash
# Application
APP_NAME=AI Educational Platform
APP_ENV=development
DEBUG=true
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/edu_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# Anthropic Claude
ANTHROPIC_API_KEY=your-api-key

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRY=900
JWT_REFRESH_TOKEN_EXPIRY=604800

# OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_APP_NAME=AI Educational Platform
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

## API Documentation

API documentation is available at `/docs` when running the backend server.

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Deployment

See [Deployment Guide](docs/deployment.md) for detailed deployment instructions.

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@educational-platform.com or open an issue.

## Acknowledgments

- Powered by Anthropic Claude AI
- Built with Next.js and FastAPI
- UI components from shadcn/ui
