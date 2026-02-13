"""
School management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from slugify import slugify

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_super_admin, require_school_admin
from app.models.user import User
from app.models.school import School
from app.models.class_model import Class
from app.models.syllabus import Syllabus
from app.schemas.school import SchoolCreate, SchoolUpdate, SchoolResponse, SchoolStats


router = APIRouter()


@router.get("/", response_model=List[SchoolResponse])
def list_schools(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    subscription_tier: Optional[str] = None,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    List all schools (super admin only)
    """
    query = db.query(School)
    
    if is_active is not None:
        query = query.filter(School.is_active == is_active)
    
    if subscription_tier is not None:
        query = query.filter(School.subscription_tier == subscription_tier)
    
    schools = query.offset(skip).limit(limit).all()
    return schools


@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get school by ID
    """
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # School admins can only view their own school
    if current_user.role == "school_admin":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this school"
            )
    
    return school


@router.get("/{school_id}/stats", response_model=SchoolStats)
def get_school_stats(
    school_id: int,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    """
    Get school statistics
    """
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # School admins can only view their own school stats
    if current_user.role == "school_admin":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this school's statistics"
            )
    
    # Count teachers
    total_teachers = db.query(func.count(User.id)).filter(
        User.school_id == school_id,
        User.role == "teacher",
        User.is_active == True
    ).scalar()
    
    # Count students
    total_students = db.query(func.count(User.id)).filter(
        User.school_id == school_id,
        User.role == "student",
        User.is_active == True
    ).scalar()
    
    # Count classes
    total_classes = db.query(func.count(Class.id)).filter(
        Class.school_id == school_id,
        Class.is_active == True
    ).scalar()
    
    # Count syllabi
    total_syllabi = db.query(func.count(Syllabus.id)).filter(
        Syllabus.school_id == school_id
    ).scalar()
    
    # Count active users
    active_users = db.query(func.count(User.id)).filter(
        User.school_id == school_id,
        User.is_active == True
    ).scalar()
    
    return {
        "total_teachers": total_teachers,
        "total_students": total_students,
        "total_classes": total_classes,
        "total_syllabi": total_syllabi,
        "active_users": active_users
    }


@router.post("/", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
def create_school(
    school_data: SchoolCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new school (super admin only)
    """
    # Check if school code already exists
    existing_school = db.query(School).filter(School.code == school_data.code).first()
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School code already exists"
        )
    
    # Generate slug from name
    slug = slugify(school_data.name)
    
    # Check if slug already exists
    existing_slug = db.query(School).filter(School.slug == slug).first()
    if existing_slug:
        # Append code to make it unique
        slug = f"{slug}-{school_data.code.lower()}"
    
    # Create new school
    new_school = School(
        name=school_data.name,
        code=school_data.code,
        slug=slug,
        address=school_data.address,
        city=school_data.city,
        state=school_data.state,
        country=school_data.country,
        postal_code=school_data.postal_code,
        phone=school_data.phone,
        email=school_data.email,
        website=school_data.website,
        description=school_data.description,
        subscription_tier=school_data.subscription_tier.value,
        max_teachers=school_data.max_teachers,
        max_students=school_data.max_students,
        is_active=True
    )
    
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    
    return new_school


@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: int,
    school_update: SchoolUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Update school (super admin only)
    """
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Update school fields
    update_data = school_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "subscription_tier" and value:
            setattr(school, field, value.value)
        else:
            setattr(school, field, value)
    
    db.commit()
    db.refresh(school)
    
    return school


@router.delete("/{school_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school(
    school_id: int,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Delete school (super admin only)
    """
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    db.delete(school)
    db.commit()
    
    return None
