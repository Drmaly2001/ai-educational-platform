"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text, pool as sa_pool
from app.core.config import settings
from app.core.database import engine, Base
from app.models import User, School, Class, Syllabus, Lesson, Subject, ClassSubject, StudentProfile, StudentEnrollment, StudentActivity  # Import all models
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Educational Platform API",
    version="1.0.0",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_migrations():
    """Add missing columns that were added after initial table creation."""
    migrations = [
        "ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS detailed_assessment_plan JSONB",
        "ALTER TABLE syllabi ADD COLUMN IF NOT EXISTS exam_preparation JSONB",
    ]
    # Use NullPool (no connection pooling) so the migration connection is
    # completely independent and won't be blocked by the main pool.
    migration_engine = create_engine(
        settings.DATABASE_URL,
        poolclass=sa_pool.NullPool,
        connect_args={"connect_timeout": 15, "options": "-c lock_timeout=10000"},
    )
    try:
        with migration_engine.connect() as conn:
            for sql in migrations:
                conn.execute(text(sql))
            conn.commit()
        logger.info("Database migrations completed successfully")
    except Exception as e:
        logger.warning(f"Migration warning (non-critical if columns already exist): {e}")
    finally:
        migration_engine.dispose()


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    # Run any missing column migrations
    _run_migrations()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info(f"Shutting down {settings.APP_NAME}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "environment": settings.APP_ENV
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # TODO: Add database and Redis connection checks
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }


# Include API routers
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
