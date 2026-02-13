"""
Database models package
"""
from app.models.user import User
from app.models.school import School
from app.models.class_model import Class
from app.models.syllabus import Syllabus
from app.models.lesson import Lesson

__all__ = [
    "User",
    "School",
    "Class",
    "Syllabus",
    "Lesson",
]
