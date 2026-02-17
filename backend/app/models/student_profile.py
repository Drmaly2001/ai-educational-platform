"""
Student Profile model — stores personal, contact, academic and medical data
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class StudentProfile(Base):
    """Extended profile data for student users"""
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Academic
    student_number = Column(String(50), nullable=True, index=True)
    grade_level = Column(String(50), nullable=True)
    enrollment_date = Column(Date, nullable=True)
    academic_year = Column(String(20), nullable=True)

    # Personal
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)  # male, female, other

    # Contact
    phone = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)

    # Parent / Guardian
    parent_name = Column(String(100), nullable=True)
    parent_phone = Column(String(30), nullable=True)
    parent_email = Column(String(255), nullable=True)
    parent_relationship = Column(String(50), nullable=True)  # father, mother, guardian

    # Medical / Notes
    health_notes = Column(Text, nullable=True)
    special_needs = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="student_profile")

    def __repr__(self):
        return f"<StudentProfile(student_id={self.student_id}, number='{self.student_number}')>"
