"""
Lesson database model
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Lesson(Base):
    """Lesson model"""
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id", ondelete="CASCADE"), nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=True)
    
    week_number = Column(Integer, nullable=False, index=True)
    day_number = Column(Integer)
    topic = Column(String(255), nullable=False, index=True)
    slug = Column(String(255))
    difficulty_level = Column(String(50))  # beginner, intermediate, advanced
    duration_minutes = Column(Integer, default=60)
    
    learning_goals = Column(JSON, nullable=False)
    prerequisites = Column(JSON)
    explanation = Column(Text, nullable=False)
    examples = Column(JSON)  # JSON array of examples
    activities = Column(JSON)  # JSON array of activities
    discussion_questions = Column(JSON)
    homework = Column(Text)
    resources = Column(JSON, default=[])
    differentiated_versions = Column(JSON)  # Different versions for different ability levels
    
    ai_generated = Column(Boolean, default=False)
    ai_model_version = Column(String(50))
    
    is_published = Column(Boolean, default=False, index=True)
    published_at = Column(DateTime, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    syllabus = relationship("Syllabus", back_populates="lessons")
    class_obj = relationship("Class", back_populates="lessons")
    
    def __repr__(self):
        return f"<Lesson(id={self.id}, topic='{self.topic}', week={self.week_number})>"
