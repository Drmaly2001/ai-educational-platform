"""
Student Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, date
from enum import Enum


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class ActivityTypeEnum(str, Enum):
    LESSON_VIEW = "lesson_view"
    ASSESSMENT_SCORE = "assessment_score"
    PROGRESS_UPDATE = "progress_update"


# ── Student Profile ──────────────────────────────────────────────────────────

class StudentProfileBase(BaseModel):
    student_number: Optional[str] = None
    grade_level: Optional[str] = None
    enrollment_date: Optional[date] = None
    academic_year: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    parent_relationship: Optional[str] = None
    health_notes: Optional[str] = None
    special_needs: Optional[str] = None
    additional_notes: Optional[str] = None


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileUpdate(StudentProfileBase):
    pass


class StudentProfileResponse(StudentProfileBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Student Create (user + profile together) ─────────────────────────────────

class StudentCreateRequest(BaseModel):
    """Create a student user and profile in one call"""
    email: str = Field(..., min_length=3)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    school_id: Optional[int] = None
    # Profile fields (optional)
    student_number: Optional[str] = None
    grade_level: Optional[str] = None
    enrollment_date: Optional[date] = None
    academic_year: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    parent_relationship: Optional[str] = None
    health_notes: Optional[str] = None
    special_needs: Optional[str] = None
    additional_notes: Optional[str] = None


class StudentUpdateRequest(StudentProfileBase):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


# ── Enrollment ────────────────────────────────────────────────────────────────

class StudentEnrollmentCreate(BaseModel):
    student_id: int


class StudentEnrollmentResponse(BaseModel):
    id: int
    class_id: int
    student_id: int
    enrolled_by: Optional[int]
    enrolled_at: datetime
    status: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_number: Optional[str] = None

    class Config:
        from_attributes = True


# ── Activity ──────────────────────────────────────────────────────────────────

class StudentActivityCreate(BaseModel):
    activity_type: ActivityTypeEnum
    class_id: Optional[int] = None
    lesson_id: Optional[int] = None
    score: Optional[float] = None
    max_score: Optional[float] = None
    progress_percent: Optional[float] = None
    notes: Optional[str] = None


class StudentActivityResponse(BaseModel):
    id: int
    student_id: int
    class_id: Optional[int]
    lesson_id: Optional[int]
    activity_type: str
    score: Optional[float]
    max_score: Optional[float]
    progress_percent: Optional[float]
    notes: Optional[str]
    created_at: datetime
    lesson_topic: Optional[str] = None

    class Config:
        from_attributes = True


# ── Progress ──────────────────────────────────────────────────────────────────

class ClassProgressResponse(BaseModel):
    class_id: int
    class_name: str
    lessons_viewed: int
    total_lessons: int
    avg_score: Optional[float]
    last_activity: Optional[datetime]


# ── Student Detail ────────────────────────────────────────────────────────────

class StudentDetailResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    school_id: Optional[int]
    created_at: datetime
    student_profile: Optional[StudentProfileResponse] = None
    enrollments: List[StudentEnrollmentResponse] = []
    recent_activities: List[StudentActivityResponse] = []

    class Config:
        from_attributes = True
