"""
Syllabus management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_teacher
from app.models.user import User
from app.models.syllabus import Syllabus
from app.schemas.syllabus import SyllabusCreate, SyllabusUpdate, SyllabusResponse


router = APIRouter()


@router.get("/", response_model=List[SyllabusResponse])
def list_syllabi(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    school_id: Optional[int] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    is_published: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List syllabi. Teachers see their own, admins see all in their school.
    """
    query = db.query(Syllabus)

    if current_user.role == "teacher":
        query = query.filter(Syllabus.teacher_id == current_user.id)
    elif current_user.role == "school_admin":
        query = query.filter(Syllabus.school_id == current_user.school_id)
    elif current_user.role == "super_admin" and school_id is not None:
        query = query.filter(Syllabus.school_id == school_id)

    if subject is not None:
        query = query.filter(Syllabus.subject == subject)

    if grade_level is not None:
        query = query.filter(Syllabus.grade_level == grade_level)

    if is_published is not None:
        query = query.filter(Syllabus.is_published == is_published)

    syllabi = query.offset(skip).limit(limit).all()
    return syllabi


@router.get("/{syllabus_id}", response_model=SyllabusResponse)
def get_syllabus(
    syllabus_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get syllabus by ID
    """
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()

    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this syllabus"
        )

    if current_user.role == "school_admin" and syllabus.school_id != current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this syllabus"
        )

    return syllabus


@router.post("/", response_model=SyllabusResponse, status_code=status.HTTP_201_CREATED)
def create_syllabus(
    syllabus_data: SyllabusCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Create a new syllabus (teacher+)
    """
    if current_user.role == "teacher":
        if syllabus_data.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create syllabi for other schools"
            )

    data = syllabus_data.dict()
    if current_user.role == "teacher" and not data.get("teacher_id"):
        data["teacher_id"] = current_user.id

    new_syllabus = Syllabus(**data)

    db.add(new_syllabus)
    db.commit()
    db.refresh(new_syllabus)

    return new_syllabus


@router.put("/{syllabus_id}", response_model=SyllabusResponse)
def update_syllabus(
    syllabus_id: int,
    syllabus_update: SyllabusUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Update a syllabus
    """
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()

    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this syllabus"
        )

    update_data = syllabus_update.dict(exclude_unset=True)

    if update_data.get("is_published") and not syllabus.is_published:
        update_data["published_at"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(syllabus, field, value)

    db.commit()
    db.refresh(syllabus)

    return syllabus


@router.delete("/{syllabus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_syllabus(
    syllabus_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Delete a syllabus
    """
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()

    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this syllabus"
        )

    db.delete(syllabus)
    db.commit()

    return None
