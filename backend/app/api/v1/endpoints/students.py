"""
Student management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.dependencies import require_school_admin, require_teacher
from app.core.security import get_password_hash
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.student_enrollment import StudentEnrollment
from app.models.student_activity import StudentActivity
from app.models.lesson import Lesson
from app.schemas.student import (
    StudentCreateRequest, StudentUpdateRequest,
    StudentProfileResponse, StudentDetailResponse,
    StudentActivityCreate, StudentActivityResponse,
    ClassProgressResponse,
)
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _require_admin_or_teacher(current_user: User = Depends(require_teacher)):
    return current_user


@router.get("/", response_model=List[dict])
def list_students(
    school_id: Optional[int] = Query(None),
    grade_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(_require_admin_or_teacher),
    db: Session = Depends(get_db)
):
    """List all students in the school"""
    query = db.query(User).filter(User.role == "student")

    # Scope to user's school unless super_admin
    if current_user.role \!= "super_admin":
        query = query.filter(User.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(User.school_id == school_id)

    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    students = query.order_by(User.full_name).all()

    result = []
    for s in students:
        profile = s.student_profile
        enrollment_count = len([e for e in s.enrollments if e.status == "active"])
        result.append({
            "id": s.id,
            "email": s.email,
            "full_name": s.full_name,
            "is_active": s.is_active,
            "school_id": s.school_id,
            "created_at": s.created_at,
            "student_number": profile.student_number if profile else None,
            "grade_level": profile.grade_level if profile else None,
            "enrollment_count": enrollment_count,
        })
    return result


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_student(
    data: StudentCreateRequest,
    current_user: User = Depends(_require_admin_or_teacher),
    db: Session = Depends(get_db)
):
    """Create a student user and profile in one call"""
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    new_user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role="student",
        school_id=data.school_id,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.flush()  # Get the id

    # Create profile
    profile = StudentProfile(
        student_id=new_user.id,
        student_number=data.student_number,
        grade_level=data.grade_level,
        enrollment_date=data.enrollment_date,
        academic_year=data.academic_year,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        phone=data.phone,
        address=data.address,
        city=data.city,
        parent_name=data.parent_name,
        parent_phone=data.parent_phone,
        parent_email=data.parent_email,
        parent_relationship=data.parent_relationship,
        health_notes=data.health_notes,
        special_needs=data.special_needs,
        additional_notes=data.additional_notes,
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "message": "Student created successfully",
    }


@router.get("/{student_id}", response_model=StudentDetailResponse)
def get_student(
    student_id: int,
    current_user: User = Depends(_require_admin_or_teacher),
    db: Session = Depends(get_db)
):
    """Get full student detail: profile, enrollments, recent activities"""
    student = db.query(User).filter(
        User.id == student_id, User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Build response manually to include nested data
    profile = student.student_profile
    enrollments = []
    for e in student.enrollments:
        if e.status == "active":
            p = e.student.student_profile if e.student else None
            enrollments.append({
                "id": e.id,
                "class_id": e.class_id,
                "student_id": e.student_id,
                "enrolled_by": e.enrolled_by,
                "enrolled_at": e.enrolled_at,
                "status": e.status,
                "student_name": student.full_name,
                "student_email": student.email,
                "student_number": p.student_number if p else None,
            })

    recent_activities = db.query(StudentActivity).filter(
        StudentActivity.student_id == student_id
    ).order_by(StudentActivity.created_at.desc()).limit(20).all()

    act_list = []
    for a in recent_activities:
        lesson_topic = None
        if a.lesson_id and a.lesson:
            lesson_topic = a.lesson.topic
        act_list.append({
            "id": a.id,
            "student_id": a.student_id,
            "class_id": a.class_id,
            "lesson_id": a.lesson_id,
            "activity_type": a.activity_type,
            "score": a.score,
            "max_score": a.max_score,
            "progress_percent": a.progress_percent,
            "notes": a.notes,
            "created_at": a.created_at,
            "lesson_topic": lesson_topic,
        })

    return {
        "id": student.id,
        "email": student.email,
        "full_name": student.full_name,
        "is_active": student.is_active,
        "school_id": student.school_id,
        "created_at": student.created_at,
        "profile": {
            "id": profile.id,
            "student_id": profile.student_id,
            "student_number": profile.student_number,
            "grade_level": profile.grade_level,
            "enrollment_date": profile.enrollment_date,
            "academic_year": profile.academic_year,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "phone": profile.phone,
            "address": profile.address,
            "city": profile.city,
            "parent_name": profile.parent_name,
            "parent_phone": profile.parent_phone,
            "parent_email": profile.parent_email,
            "parent_relationship": profile.parent_relationship,
            "health_notes": profile.health_notes,
            "special_needs": profile.special_needs,
            "additional_notes": profile.additional_notes,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        } if profile else None,
        "enrollments": enrollments,
        "recent_activities": act_list,
    }


@router.put("/{student_id}", response_model=dict)
def update_student(
    student_id: int,
    data: StudentUpdateRequest,
    current_user: User = Depends(_require_admin_or_teacher),
    db: Session = Depends(get_db)
):
    """Update student profile data"""
    student = db.query(User).filter(
        User.id == student_id, User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if data.full_name is not None:
        student.full_name = data.full_name
    if data.is_active is not None:
        student.is_active = data.is_active

    profile = student.student_profile
    if not profile:
        profile = StudentProfile(student_id=student_id)
        db.add(profile)

    profile_fields = [
        "student_number", "grade_level", "enrollment_date", "academic_year",
        "date_of_birth", "gender", "phone", "address", "city",
        "parent_name", "parent_phone", "parent_email", "parent_relationship",
        "health_notes", "special_needs", "additional_notes",
    ]
    for field in profile_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(profile, field, val)

    db.commit()
    return {"message": "Student updated successfully"}


@router.delete("/{student_id}", response_model=dict)
def deactivate_student(
    student_id: int,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    """Deactivate a student account"""
    student = db.query(User).filter(
        User.id == student_id, User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.is_active = False
    db.commit()
    return {"message": "Student deactivated"}


@router.post("/{student_id}/activities", response_model=dict, status_code=status.HTTP_201_CREATED)
def record_activity(
    student_id: int,
    data: StudentActivityCreate,
    db: Session = Depends(get_db)
):
    """Record a student activity (lesson view, score, progress)"""
    activity = StudentActivity(
        student_id=student_id,
        class_id=data.class_id,
        lesson_id=data.lesson_id,
        activity_type=data.activity_type.value,
        score=data.score,
        max_score=data.max_score,
        progress_percent=data.progress_percent,
        notes=data.notes,
    )
    db.add(activity)
    db.commit()
    return {"message": "Activity recorded", "id": activity.id}


@router.get("/{student_id}/activities", response_model=List[dict])
def get_activities(
    student_id: int,
    activity_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get student activity history"""
    query = db.query(StudentActivity).filter(
        StudentActivity.student_id == student_id
    )
    if activity_type:
        query = query.filter(StudentActivity.activity_type == activity_type)

    activities = query.order_by(StudentActivity.created_at.desc()).limit(100).all()
    result = []
    for a in activities:
        lesson_topic = a.lesson.topic if a.lesson_id and a.lesson else None
        result.append({
            "id": a.id,
            "student_id": a.student_id,
            "class_id": a.class_id,
            "lesson_id": a.lesson_id,
            "activity_type": a.activity_type,
            "score": a.score,
            "max_score": a.max_score,
            "progress_percent": a.progress_percent,
            "notes": a.notes,
            "created_at": a.created_at,
            "lesson_topic": lesson_topic,
        })
    return result


@router.get("/{student_id}/progress", response_model=List[dict])
def get_progress(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get aggregated progress per class"""
    enrollments = db.query(StudentEnrollment).filter(
        StudentEnrollment.student_id == student_id,
        StudentEnrollment.status == "active",
    ).all()

    result = []
    for enrollment in enrollments:
        cls = enrollment.class_obj
        if not cls:
            continue

        total_lessons = db.query(Lesson).filter(
            Lesson.class_id == cls.id
        ).count()

        lessons_viewed = db.query(StudentActivity).filter(
            StudentActivity.student_id == student_id,
            StudentActivity.class_id == cls.id,
            StudentActivity.activity_type == "lesson_view",
        ).count()

        scores = db.query(StudentActivity.score).filter(
            StudentActivity.student_id == student_id,
            StudentActivity.class_id == cls.id,
            StudentActivity.activity_type == "assessment_score",
            StudentActivity.score.isnot(None),
        ).all()

        avg_score = None
        if scores:
            avg_score = sum(s[0] for s in scores) / len(scores)

        last_activity = db.query(StudentActivity.created_at).filter(
            StudentActivity.student_id == student_id,
            StudentActivity.class_id == cls.id,
        ).order_by(StudentActivity.created_at.desc()).first()

        result.append({
            "class_id": cls.id,
            "class_name": cls.name,
            "lessons_viewed": lessons_viewed,
            "total_lessons": total_lessons,
            "avg_score": round(avg_score, 1) if avg_score else None,
            "last_activity": last_activity[0] if last_activity else None,
        })

    return result
