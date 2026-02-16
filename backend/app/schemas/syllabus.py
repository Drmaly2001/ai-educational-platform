"""
Syllabus Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CurriculumStandard(str, Enum):
    """Curriculum standard enumeration"""
    IGCSE = "IGCSE"
    IB = "IB"
    COMMON_CORE = "Common Core"
    A_LEVEL = "A-Level"
    AP = "AP"
    CBSE = "CBSE"
    NATIONAL = "National"
    OTHER = "Other"


class SyllabusBase(BaseModel):
    """Base syllabus schema"""
    name: str = Field(..., min_length=2, max_length=255)
    subject: str = Field(..., min_length=1, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=50)
    curriculum_standard: str = Field(..., min_length=1, max_length=50)
    duration_weeks: int = Field(..., ge=1, le=52)


class SyllabusCreate(SyllabusBase):
    """Schema for creating a new syllabus"""
    school_id: int
    teacher_id: Optional[int] = None
    learning_objectives: List[str]
    weekly_breakdown: List[Dict[str, Any]]
    assessment_plan: List[Dict[str, Any]]
    revision_schedule: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[Dict[str, Any]]] = []
    ai_generated: bool = False


class SyllabusUpdate(BaseModel):
    """Schema for updating a syllabus"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    grade_level: Optional[str] = None
    curriculum_standard: Optional[str] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=52)
    learning_objectives: Optional[List[str]] = None
    weekly_breakdown: Optional[List[Dict[str, Any]]] = None
    assessment_plan: Optional[List[Dict[str, Any]]] = None
    revision_schedule: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[Dict[str, Any]]] = None
    detailed_assessment_plan: Optional[Any] = None
    exam_preparation: Optional[Any] = None
    is_published: Optional[bool] = None


class SyllabusInDB(SyllabusBase):
    """Schema for syllabus in database"""
    id: int
    school_id: int
    teacher_id: Optional[int]
    learning_objectives: List[str]
    weekly_breakdown: Any
    assessment_plan: Any
    revision_schedule: Optional[Any]
    resources: Optional[Any]
    detailed_assessment_plan: Optional[Any] = None
    exam_preparation: Optional[Any] = None
    is_published: bool
    published_at: Optional[datetime]
    ai_generated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyllabusResponse(SyllabusInDB):
    """Schema for syllabus response"""
    pass


class AssessmentPlanGenerateRequest(BaseModel):
    """Schema for AI detailed assessment plan generation"""
    syllabus_id: int
    additional_instructions: Optional[str] = None


class ExamPrepGenerateRequest(BaseModel):
    """Schema for AI exam preparation generation"""
    syllabus_id: int
    additional_instructions: Optional[str] = None


class SyllabusGenerateRequest(BaseModel):
    """Schema for AI syllabus generation request"""
    school_id: int
    class_id: Optional[int] = None
    subject: str = Field(..., min_length=1, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=50)
    curriculum_standard: str = Field(..., min_length=1, max_length=50)
    duration_weeks: int = Field(..., ge=1, le=52)
    learning_objectives: Optional[List[str]] = None
    additional_instructions: Optional[str] = None
