#!/bin/bash

# Script to generate complete project structure for AI Educational Platform
# This creates all necessary directories and placeholder files

echo "Generating AI Educational Platform project structure..."

# Backend directories
mkdir -p backend/app/core
mkdir -p backend/app/models
mkdir -p backend/app/schemas
mkdir -p backend/app/api/v1/endpoints
mkdir -p backend/app/services
mkdir -p backend/app/utils
mkdir -p backend/app/middleware
mkdir -p backend/alembic/versions
mkdir -p backend/tests

# Frontend directories
mkdir -p frontend/src/app/\(auth\)/login
mkdir -p frontend/src/app/\(auth\)/register
mkdir -p frontend/src/app/dashboard/classes
mkdir -p frontend/src/app/dashboard/syllabi
mkdir -p frontend/src/app/dashboard/lessons
mkdir -p frontend/src/app/dashboard/assessments
mkdir -p frontend/src/app/dashboard/analytics
mkdir -p frontend/src/app/dashboard/settings
mkdir -p frontend/src/app/student/lessons
mkdir -p frontend/src/app/student/assessments
mkdir -p frontend/src/app/student/progress
mkdir -p frontend/src/app/student/tutor
mkdir -p frontend/src/app/admin/schools
mkdir -p frontend/src/app/admin/users
mkdir -p frontend/src/app/admin/subscriptions
mkdir -p frontend/src/app/admin/analytics
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/auth
mkdir -p frontend/src/components/dashboard
mkdir -p frontend/src/components/syllabus
mkdir -p frontend/src/components/lessons
mkdir -p frontend/src/components/assessments
mkdir -p frontend/src/components/analytics
mkdir -p frontend/src/components/tutor
mkdir -p frontend/src/components/common
mkdir -p frontend/src/lib
mkdir -p frontend/src/hooks
mkdir -p frontend/src/types
mkdir -p frontend/src/styles
mkdir -p frontend/public

# Docker directories
mkdir -p docker

# Kubernetes directories
mkdir -p k8s

# Documentation directories
mkdir -p docs

# Scripts directory
mkdir -p scripts

echo "✅ Directory structure created"

# Create __init__.py files for Python packages
touch backend/app/__init__.py
touch backend/app/core/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/api/__init__.py
touch backend/app/api/v1/__init__.py
touch backend/app/api/v1/endpoints/__init__.py
touch backend/app/services/__init__.py
touch backend/app/utils/__init__.py
touch backend/app/middleware/__init__.py
touch backend/tests/__init__.py

echo "✅ Python package files created"

# Create placeholder model files
cat > backend/app/models/school.py << 'EOF'
"""School database model"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class School(Base):
    """School/organization model"""
    __tablename__ = "schools"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    # Add remaining columns from schema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
EOF

cat > backend/app/models/class.py << 'EOF'
"""Class database model"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Class(Base):
    """Class/subject grouping model"""
    __tablename__ = "classes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    grade_level = Column(String(50), nullable=False)
    # Add remaining columns from schema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
EOF

echo "✅ Sample model files created"

# Create placeholder service files
cat > backend/app/services/ai_service.py << 'EOF'
"""AI service for content generation using Anthropic Claude"""
from anthropic import Anthropic
from app.core.config import settings

class AIService:
    """Service for AI-powered content generation"""
    
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def generate_syllabus(self, params: dict) -> dict:
        """Generate syllabus using Claude"""
        # TODO: Implement syllabus generation
        pass
    
    async def generate_lesson(self, params: dict) -> dict:
        """Generate lesson using Claude"""
        # TODO: Implement lesson generation
        pass
    
    async def generate_assessment(self, params: dict) -> dict:
        """Generate assessment using Claude"""
        # TODO: Implement assessment generation
        pass
    
    async def tutor_chat(self, message: str, context: dict) -> str:
        """AI tutor chat response"""
        # TODO: Implement tutor chat
        pass
EOF

echo "✅ Service files created"

# Create frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "ai-educational-platform-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "socket.io-client": "^4.6.1",
    "recharts": "^2.10.3",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
EOF

echo "✅ Frontend package.json created"

# Create Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: edu-postgres
    environment:
      POSTGRES_DB: edu_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: edu-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: edu-backend
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/edu_platform
      - REDIS_URL=redis://redis:6379/0
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: edu-frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
EOF

echo "✅ Docker Compose created"

echo ""
echo "========================================="
echo "Project structure generated successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review the generated structure"
echo "2. Install dependencies:"
echo "   - Backend: cd backend && pip install -r requirements.txt"
echo "   - Frontend: cd frontend && npm install"
echo "3. Set up environment variables:"
echo "   - Copy backend/.env.example to backend/.env"
echo "   - Copy frontend/.env.example to frontend/.env.local"
echo "4. Start development:"
echo "   - docker-compose up -d"
echo ""
