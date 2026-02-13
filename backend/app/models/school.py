"""
School database model
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class School(Base):
    """School/Organization model"""
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    
    # Contact information
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default="US")
    postal_code = Column(String(20))
    phone = Column(String(50))
    email = Column(String(255))
    website = Column(Text)
    
    # Branding
    logo_url = Column(Text)
    description = Column(Text)
    
    # Subscription
    subscription_tier = Column(String(50), default="free")  # free, premium, school, enterprise
    subscription_status = Column(String(50), default="active")
    max_teachers = Column(Integer, default=5)
    max_students = Column(Integer, default=100)
    
    # Settings
    settings = Column(JSON, default={})
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="school")
    classes = relationship("Class", back_populates="school", cascade="all, delete-orphan")
    syllabi = relationship("Syllabus", back_populates="school", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<School(id={self.id}, name='{self.name}', code='{self.code}')>"
