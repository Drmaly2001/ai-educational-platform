"""
Class management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_teacher
from app.models.user import User
from app.models.class_model import Class
from app.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse


router = APIRouter()


@router.get("/", response_model=List[ClassResponse])
def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    school_id: Optional[int] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List classes. Teachers see their own classes, admins see all in their school.
    """
    query = db.query(Class)

    # Role-based filtering
    if current_user.role == "teacher":
        query = query.filter(Class.teacher_id == current_user.id)
    elif current_user.role in ("school_admin",):
        query = query.filter(Class.school_id == current_user.school_id)
    elif current_user.role == "super_admin" and school_id is not None:
        query = query.filter(Class.school_id == school_id)

    if subject is not None:
        query = query.filter(Class.subject == subject)

    if grade_level is not None:
        query = query.filter(Class.grade_level == grade_level)

    if is_active is not None:
        query = query.filter(Class.is_active == is_active)

    classes = query.offset(skip).limit(limit).all()
    return classes


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get class by ID
    """
    cls = db.query(Class).filter(Class.id == class_id).first()

    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Authorization: teachers can only view their own classes
    if current_user.role == "teacher" and cls.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this class"
        )

    if current_user.role == "school_admin" and cls.school_id != current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this class"
        )

    return cls


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Create a new class (teacher+)
    """
    # Teachers can only create classes for their own school
    if current_user.role == "teacher":
        if class_data.school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create classes for other schools"
            )
        class_data_dict = class_data.dict()
        class_data_dict["teacher_id"] = current_user.id
    else:
        class_data_dict = class_data.dict()

    new_class = Class(**class_data_dict)

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return new_class


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_update: ClassUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Update a class
    """
    cls = db.query(Class).filter(Class.id == class_id).first()

    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    # Teachers can only update their own classes
    if current_user.role == "teacher" and cls.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this class"
        )

    update_data = class_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cls, field, value)

    db.commit()
    db.refresh(cls)

    return cls


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Delete a class
    """
    cls = db.query(Class).filter(Class.id == class_id).first()

    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

    if current_user.role == "teacher" and cls.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this class"
        )

    db.delete(cls)
    db.commit()

    return None
