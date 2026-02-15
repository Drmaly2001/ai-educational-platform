"""
Class Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.subject import ClassSubjectResponse


class ClassBase(BaseModel):
    """Base class schema"""
    name: str = Field(..., min_length=2, max_length=255)
    grade_level: str = Field(..., min_length=1, max_length=50)
    academic_year: str = Field(..., min_length=4, max_length=20)
    term: Optional[str] = None
    section: Optional[str] = None


class ClassCreate(ClassBase):
    """Schema for creating a new class"""
    school_id: int
    code: Optional[str] = Field(None, max_length=50)
    subject: Optional[str] = Field(None, max_length=100)
    teacher_id: Optional[int] = None
    syllabus_id: Optional[int] = None
    max_students: int = Field(default=50, ge=1)


class ClassUpdate(BaseModel):
    """Schema for updating a class"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    subject: Optional[str] = Field(None, max_length=100)
    grade_level: Optional[str] = Field(None, min_length=1, max_length=50)
    academic_year: Optional[str] = Field(None, min_length=4, max_length=20)
    term: Optional[str] = None
    section: Optional[str] = None
    teacher_id: Optional[int] = None
    syllabus_id: Optional[int] = None
    max_students: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None


class ClassInDB(ClassBase):
    """Schema for class in database"""
    id: int
    school_id: int
    code: Optional[str]
    subject: Optional[str] = None
    teacher_id: Optional[int]
    syllabus_id: Optional[int]
    max_students: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClassResponse(ClassInDB):
    """Schema for class response"""
    class_subjects: List[ClassSubjectResponse] = []
