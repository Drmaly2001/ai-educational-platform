"""
Syllabus database model
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Syllabus(Base):
    """Syllabus/Curriculum model"""
    __tablename__ = "syllabi"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False, index=True)
    grade_level = Column(String(50), nullable=False)
    curriculum_standard = Column(String(50), nullable=False)  # IGCSE, IB, Common Core, etc.
    duration_weeks = Column(Integer, nullable=False)
    
    learning_objectives = Column(JSON, nullable=False)
    weekly_breakdown = Column(JSON, nullable=False)  # JSON structure with weekly plans
    assessment_plan = Column(JSON, nullable=False)  # JSON structure with assessment schedule
    revision_schedule = Column(JSON)
    resources = Column(JSON, default=[])
    
    is_published = Column(Boolean, default=False, index=True)
    published_at = Column(DateTime, nullable=True)
    ai_generated = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    school = relationship("School", back_populates="syllabi")
    classes = relationship("Class", back_populates="syllabus")
    lessons = relationship("Lesson", back_populates="syllabus", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Syllabus(id={self.id}, name='{self.name}', subject='{self.subject}')>"
