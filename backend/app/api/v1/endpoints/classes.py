"""
Class management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_teacher
from app.models.user import User
from app.models.class_model import Class
from app.models.subject import ClassSubject, Subject
from app.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.schemas.subject import ClassSubjectCreate, ClassSubjectResponse, BulkAssignSubjects


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
    query = db.query(Class).options(
        joinedload(Class.class_subjects).joinedload(ClassSubject.subject)
    )

    # Role-based filtering
    if current_user.role == "teacher":
        query = query.filter(Class.teacher_id == current_user.id)
    elif current_user.role in ("school_admin",):
        query = query.filter(Class.school_id == current_user.school_id)
    elif current_user.role == "super_admin" and school_id is not None:
        query = query.filter(Class.school_id == school_id)

    if subject is not None:
        query = query.join(ClassSubject).join(Subject).filter(Subject.name == subject)

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
    cls = db.query(Class).options(
        joinedload(Class.class_subjects).joinedload(ClassSubject.subject)
    ).filter(Class.id == class_id).first()

    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found"
        )

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


# ---- Class-Subject Assignment Endpoints ----


@router.get("/{class_id}/subjects", response_model=List[ClassSubjectResponse])
def list_class_subjects(
    class_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List subjects assigned to a class"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    class_subjects = db.query(ClassSubject).options(
        joinedload(ClassSubject.subject)
    ).filter(ClassSubject.class_id == class_id).all()

    return class_subjects


@router.post("/{class_id}/subjects", response_model=ClassSubjectResponse, status_code=status.HTTP_201_CREATED)
def assign_subject_to_class(
    class_id: int,
    data: ClassSubjectCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Assign a subject to a class"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    subject = db.query(Subject).filter(Subject.id == data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Check for duplicate
    existing = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == data.subject_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject already assigned to this class"
        )

    class_subject = ClassSubject(
        class_id=class_id,
        subject_id=data.subject_id,
        teacher_id=data.teacher_id
    )
    db.add(class_subject)
    db.commit()
    db.refresh(class_subject)

    # Load the subject relationship for response
    db.refresh(class_subject, ["subject"])

    return class_subject


@router.post("/{class_id}/subjects/bulk", response_model=List[ClassSubjectResponse])
def bulk_assign_subjects(
    class_id: int,
    data: BulkAssignSubjects,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Assign multiple subjects to a class at once"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    results = []
    for subject_id in data.subject_ids:
        # Skip duplicates
        existing = db.query(ClassSubject).filter(
            ClassSubject.class_id == class_id,
            ClassSubject.subject_id == subject_id
        ).first()
        if existing:
            continue

        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            continue

        cs = ClassSubject(class_id=class_id, subject_id=subject_id)
        db.add(cs)
        results.append(cs)

    db.commit()
    for cs in results:
        db.refresh(cs, ["subject"])

    return results


@router.delete("/{class_id}/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_subject_from_class(
    class_id: int,
    subject_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Remove a subject from a class"""
    class_subject = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == subject_id
    ).first()

    if not class_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not assigned to this class")

    db.delete(class_subject)
    db.commit()

    return None


# ─── Student Enrollment Endpoints ────────────────────────────────────────────

from app.models.student_enrollment import StudentEnrollment
from app.models.student_activity import StudentActivity
from app.models.lesson import Lesson as LessonModel
from app.schemas.student import StudentEnrollmentCreate, StudentEnrollmentResponse


@router.get("/{class_id}/students", response_model=List[dict])
def list_class_students(
    class_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all students enrolled in a class"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    enrollments = db.query(StudentEnrollment).filter(
        StudentEnrollment.class_id == class_id,
        StudentEnrollment.status == "active",
    ).all()

    total_lessons = db.query(LessonModel).filter(LessonModel.class_id == class_id).count()

    result = []
    for e in enrollments:
        student = e.student
        profile = student.student_profile if student else None
        lessons_viewed = db.query(StudentActivity).filter(
            StudentActivity.student_id == e.student_id,
            StudentActivity.class_id == class_id,
            StudentActivity.activity_type == "lesson_view",
        ).count()
        result.append({
            "enrollment_id": e.id,
            "student_id": e.student_id,
            "student_name": student.full_name if student else "",
            "student_email": student.email if student else "",
            "student_number": profile.student_number if profile else None,
            "grade_level": profile.grade_level if profile else None,
            "enrolled_at": e.enrolled_at,
            "status": e.status,
            "lessons_viewed": lessons_viewed,
            "total_lessons": total_lessons,
        })
    return result


@router.post("/{class_id}/students", response_model=dict, status_code=status.HTTP_201_CREATED)
def enroll_student(
    class_id: int,
    data: StudentEnrollmentCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Enroll a student in a class"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    student = db.query(User).filter(User.id == data.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = db.query(StudentEnrollment).filter(
        StudentEnrollment.class_id == class_id,
        StudentEnrollment.student_id == data.student_id,
    ).first()
    if existing:
        if existing.status == "active":
            raise HTTPException(status_code=400, detail="Student already enrolled in this class")
        existing.status = "active"
        db.commit()
        return {"message": "Student re-enrolled successfully"}

    enrollment = StudentEnrollment(
        class_id=class_id,
        student_id=data.student_id,
        enrolled_by=current_user.id,
    )
    db.add(enrollment)
    db.commit()
    return {"message": "Student enrolled successfully"}


@router.delete("/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def unenroll_student(
    class_id: int,
    student_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Unenroll a student from a class"""
    enrollment = db.query(StudentEnrollment).filter(
        StudentEnrollment.class_id == class_id,
        StudentEnrollment.student_id == student_id,
    ).first()

    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    enrollment.status = "inactive"
    db.commit()
    return None
