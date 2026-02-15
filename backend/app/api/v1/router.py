"""
Main API v1 router
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, schools, classes, syllabi, lessons, ai, fees


api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

api_router.include_router(
    schools.router,
    prefix="/schools",
    tags=["Schools"]
)

api_router.include_router(
    classes.router,
    prefix="/classes",
    tags=["Classes"]
)

api_router.include_router(
    syllabi.router,
    prefix="/syllabi",
    tags=["Syllabi"]
)

api_router.include_router(
    lessons.router,
    prefix="/lessons",
    tags=["Lessons"]
)

api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["AI Generation"]
)

api_router.include_router(
    fees.router,
    prefix="/fees",
    tags=["Fees Management"]
)
