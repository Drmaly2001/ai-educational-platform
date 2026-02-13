"""
Class database model
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Class(Base):
    """Class/Course model"""
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    subject = Column(String(100), nullable=False, index=True)
    grade_level = Column(String(50), nullable=False, index=True)
    academic_year = Column(String(20), nullable=False, index=True)
    term = Column(String(50))
    section = Column(String(50))
    
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id", ondelete="SET NULL"), nullable=True)
    
    max_students = Column(Integer, default=50)
    settings = Column(JSON, default={})
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    school = relationship("School", back_populates="classes")
    syllabus = relationship("Syllabus", back_populates="classes")
    lessons = relationship("Lesson", back_populates="class_obj", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Class(id={self.id}, name='{self.name}', subject='{self.subject}')>"
