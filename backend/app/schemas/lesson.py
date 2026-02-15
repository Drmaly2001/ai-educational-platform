"""
Lesson Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class LessonBase(BaseModel):
    """Base lesson schema"""
    topic: str = Field(..., min_length=2, max_length=255)
    week_number: int = Field(..., ge=1)
    day_number: Optional[int] = None
    difficulty_level: Optional[str] = "intermediate"
    duration_minutes: int = Field(default=60, ge=10, le=300)


class LessonCreate(LessonBase):
    """Schema for creating a new lesson"""
    syllabus_id: Optional[int] = None
    class_id: Optional[int] = None
    slug: Optional[str] = None
    learning_goals: List[str]
    prerequisites: Optional[List[str]] = None
    explanation: str = Field(..., min_length=10)
    examples: Optional[List[Dict[str, Any]]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    discussion_questions: Optional[List[str]] = None
    homework: Optional[str] = None
    resources: Optional[List[Dict[str, Any]]] = []
    ai_generated: bool = False
    ai_model_version: Optional[str] = None


class LessonUpdate(BaseModel):
    """Schema for updating a lesson"""
    topic: Optional[str] = Field(None, min_length=2, max_length=255)
    week_number: Optional[int] = Field(None, ge=1)
    day_number: Optional[int] = None
    difficulty_level: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=10, le=300)
    learning_goals: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    explanation: Optional[str] = None
    examples: Optional[List[Dict[str, Any]]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    discussion_questions: Optional[List[str]] = None
    homework: Optional[str] = None
    resources: Optional[List[Dict[str, Any]]] = None
    is_published: Optional[bool] = None


class LessonInDB(LessonBase):
    """Schema for lesson in database"""
    id: int
    syllabus_id: Optional[int]
    class_id: Optional[int]
    slug: Optional[str]
    learning_goals: List[str]
    prerequisites: Optional[List[str]]
    explanation: str
    examples: Optional[Any]
    activities: Optional[Any]
    discussion_questions: Optional[List[str]]
    homework: Optional[str]
    resources: Optional[Any]
    differentiated_versions: Optional[Any]
    ai_generated: bool
    ai_model_version: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonResponse(LessonInDB):
    """Schema for lesson response"""
    pass


class LessonGenerateRequest(BaseModel):
    """Schema for AI lesson generation request"""
    syllabus_id: int
    week_number: Optional[int] = None
    additional_instructions: Optional[str] = None
