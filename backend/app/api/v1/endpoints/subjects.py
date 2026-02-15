"""
Subject management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_school_admin
from app.models.user import User
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse


router = APIRouter()


@router.get("/", response_model=List[SubjectResponse])
def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    school_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List subjects for a school"""
    query = db.query(Subject)

    if current_user.role == "super_admin":
        if school_id is not None:
            query = query.filter(Subject.school_id == school_id)
    else:
        query = query.filter(Subject.school_id == current_user.school_id)

    if is_active is not None:
        query = query.filter(Subject.is_active == is_active)

    return query.order_by(Subject.name).offset(skip).limit(limit).all()


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get subject by ID"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()

    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if current_user.role != "super_admin" and subject.school_id != current_user.school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return subject


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_data: SubjectCreate,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    """Create a new subject"""
    if current_user.role != "super_admin" and subject_data.school_id != current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create subjects for other schools"
        )

    # Check for duplicate code in same school
    existing = db.query(Subject).filter(
        Subject.school_id == subject_data.school_id,
        Subject.code == subject_data.code
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject with code '{subject_data.code}' already exists in this school"
        )

    new_subject = Subject(**subject_data.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_update: SubjectUpdate,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    """Update a subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()

    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if current_user.role != "super_admin" and subject.school_id != current_user.school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_data = subject_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    """Delete a subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()

    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if current_user.role != "super_admin" and subject.school_id != current_user.school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(subject)
    db.commit()
    return None
