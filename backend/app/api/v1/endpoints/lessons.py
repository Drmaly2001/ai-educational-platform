"""
Lesson management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from slugify import slugify

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_teacher
from app.models.user import User
from app.models.lesson import Lesson
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse


router = APIRouter()


@router.get("/", response_model=List[LessonResponse])
def list_lessons(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    syllabus_id: Optional[int] = None,
    class_id: Optional[int] = None,
    week_number: Optional[int] = None,
    is_published: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List lessons with optional filters
    """
    query = db.query(Lesson)

    if syllabus_id is not None:
        query = query.filter(Lesson.syllabus_id == syllabus_id)

    if class_id is not None:
        query = query.filter(Lesson.class_id == class_id)

    if week_number is not None:
        query = query.filter(Lesson.week_number == week_number)

    if is_published is not None:
        query = query.filter(Lesson.is_published == is_published)

    # Filter by creator for teachers
    if current_user.role == "teacher":
        query = query.filter(Lesson.created_by == current_user.id)

    lessons = query.order_by(Lesson.week_number, Lesson.day_number).offset(skip).limit(limit).all()
    return lessons


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get lesson by ID
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    return lesson


@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Create a new lesson (teacher+)
    """
    data = lesson_data.dict()
    data["created_by"] = current_user.id

    if not data.get("slug"):
        data["slug"] = slugify(data["topic"])

    new_lesson = Lesson(**data)

    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    return new_lesson


@router.put("/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Update a lesson
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    if current_user.role == "teacher" and lesson.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this lesson"
        )

    update_data = lesson_update.dict(exclude_unset=True)

    if update_data.get("is_published") and not lesson.is_published:
        update_data["published_at"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)

    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Delete a lesson
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )

    if current_user.role == "teacher" and lesson.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this lesson"
        )

    db.delete(lesson)
    db.commit()

    return None
