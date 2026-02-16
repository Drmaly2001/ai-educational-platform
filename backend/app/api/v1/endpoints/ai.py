"""
AI generation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.core.dependencies import require_teacher
from app.models.user import User
from app.models.syllabus import Syllabus
from app.models.lesson import Lesson
from app.models.class_model import Class
from app.schemas.syllabus import SyllabusResponse, SyllabusGenerateRequest
from app.schemas.lesson import LessonResponse, LessonGenerateRequest
from app.core.config import settings
from app.services.ai_service import generate_syllabus, generate_lesson

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate-syllabus", response_model=SyllabusResponse, status_code=status.HTTP_201_CREATED)
def ai_generate_syllabus(
    request: SyllabusGenerateRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Generate a syllabus using AI and save it to the database
    """
    # Authorization
    if current_user.role == "teacher" and request.school_id != current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create syllabi for other schools"
        )

    try:
        ai_result = generate_syllabus(
            subject=request.subject,
            grade_level=request.grade_level,
            curriculum_standard=request.curriculum_standard,
            duration_weeks=request.duration_weeks,
            learning_objectives=request.learning_objectives,
            additional_instructions=request.additional_instructions,
        )
    except Exception as e:
        logger.error(f"AI syllabus generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate syllabus. Please try again."
        )

    new_syllabus = Syllabus(
        school_id=request.school_id,
        teacher_id=current_user.id,
        name=ai_result.get("name", f"{request.subject} - {request.grade_level} Syllabus"),
        subject=request.subject,
        grade_level=request.grade_level,
        curriculum_standard=request.curriculum_standard,
        duration_weeks=request.duration_weeks,
        learning_objectives=ai_result.get("learning_objectives", []),
        weekly_breakdown=ai_result.get("weekly_breakdown", []),
        assessment_plan=ai_result.get("assessment_plan", []),
        revision_schedule=ai_result.get("revision_schedule"),
        resources=ai_result.get("recommended_resources", []),
        ai_generated=True,
        is_published=False,
    )

    db.add(new_syllabus)
    db.commit()
    db.refresh(new_syllabus)

    # Link the syllabus to the class if class_id was provided
    if request.class_id:
        cls = db.query(Class).filter(Class.id == request.class_id).first()
        if cls:
            cls.syllabus_id = new_syllabus.id
            db.commit()

    return new_syllabus


@router.post("/generate-lessons", response_model=List[LessonResponse], status_code=status.HTTP_201_CREATED)
def ai_generate_lessons(
    request: LessonGenerateRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """
    Generate lessons for a syllabus using AI
    """
    syllabus = db.query(Syllabus).filter(Syllabus.id == request.syllabus_id).first()

    if not syllabus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Syllabus not found"
        )

    if current_user.role == "teacher" and syllabus.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate lessons for this syllabus"
        )

    # Determine which weeks to generate
    weekly_breakdown = syllabus.weekly_breakdown or []
    if request.week_number:
        weeks_to_generate = [w for w in weekly_breakdown if w.get("week") == request.week_number]
    else:
        weeks_to_generate = weekly_breakdown

    if not weeks_to_generate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No weeks found to generate lessons for"
        )

    created_lessons = []

    for week_data in weeks_to_generate:
        week_num = week_data.get("week", 1)
        topic = week_data.get("topic", "")
        learning_goals = week_data.get("learning_goals", [])

        try:
            ai_result = generate_lesson(
                topic=topic,
                week_number=week_num,
                subject=syllabus.subject,
                grade_level=syllabus.grade_level,
                learning_goals=learning_goals,
                additional_instructions=request.additional_instructions,
            )
        except Exception as e:
            logger.error(f"AI lesson generation failed for week {week_num}: {e}")
            continue

        from slugify import slugify as make_slug

        new_lesson = Lesson(
            syllabus_id=syllabus.id,
            week_number=week_num,
            topic=ai_result.get("topic", topic),
            slug=make_slug(topic),
            difficulty_level="intermediate",
            duration_minutes=60,
            learning_goals=learning_goals or ai_result.get("learning_goals", []),
            prerequisites=ai_result.get("prerequisites", []),
            explanation=ai_result.get("explanation", ""),
            examples=ai_result.get("examples", []),
            activities=ai_result.get("activities", []),
            discussion_questions=ai_result.get("discussion_questions", []),
            homework=ai_result.get("homework", ""),
            resources=ai_result.get("resources", []),
            ai_generated=True,
            ai_model_version=settings.CLAUDE_MODEL,
            is_published=False,
            created_by=current_user.id,
        )

        db.add(new_lesson)
        created_lessons.append(new_lesson)

    db.commit()

    for lesson in created_lessons:
        db.refresh(lesson)

    return created_lessons
