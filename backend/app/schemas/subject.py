"""
Subject Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ---- Subject ----

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class SubjectCreate(SubjectBase):
    school_id: int


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(SubjectBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- ClassSubject ----

class ClassSubjectCreate(BaseModel):
    subject_id: int
    teacher_id: Optional[int] = None


class ClassSubjectUpdate(BaseModel):
    teacher_id: Optional[int] = None


class ClassSubjectResponse(BaseModel):
    id: int
    class_id: int
    subject_id: int
    teacher_id: Optional[int]
    created_at: datetime
    subject: Optional[SubjectResponse] = None

    class Config:
        from_attributes = True


class BulkAssignSubjects(BaseModel):
    subject_ids: List[int]
