"""
Student Activity model — tracks lesson views, assessment scores, progress updates
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class StudentActivity(Base):
    """Records student activities for tracking progress"""
    __tablename__ = "student_activities"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)

    # Activity type: "lesson_view" | "assessment_score" | "progress_update"
    activity_type = Column(String(50), nullable=False, index=True)

    # For assessment_score
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)

    # For progress_update
    progress_percent = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="activities")
    lesson = relationship("Lesson", foreign_keys=[lesson_id])
    class_obj = relationship("Class", foreign_keys=[class_id])

    def __repr__(self):
        return f"<StudentActivity(student_id={self.student_id}, type='{self.activity_type}')>"
