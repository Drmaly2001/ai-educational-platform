"""
Student Enrollment model — links students to classes
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class StudentEnrollment(Base):
    """Junction table linking students to classes"""
    __tablename__ = "student_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrolled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")  # active, inactive

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student"),
    )

    # Relationships
    class_obj = relationship("Class", back_populates="enrollments")
    student = relationship("User", foreign_keys=[student_id], back_populates="enrollments")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by])

    def __repr__(self):
        return f"<StudentEnrollment(class_id={self.class_id}, student_id={self.student_id})>"
