"""
School Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class SubscriptionTier(str, Enum):
    """Subscription tier enumeration"""
    FREE = "free"
    PREMIUM = "premium"
    SCHOOL = "school"
    ENTERPRISE = "enterprise"


class SchoolBase(BaseModel):
    """Base school schema"""
    name: str = Field(..., min_length=2, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "US"
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class SchoolCreate(SchoolBase):
    """Schema for creating a new school"""
    code: str = Field(..., min_length=2, max_length=50)
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    max_teachers: int = Field(default=5, ge=1)
    max_students: int = Field(default=100, ge=1)
    
    @validator('code')
    def validate_code(cls, v):
        """Validate school code format"""
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Code must contain only alphanumeric characters, hyphens, and underscores')
        return v.upper()


class SchoolUpdate(BaseModel):
    """Schema for updating a school"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: Optional[SubscriptionTier] = None
    subscription_status: Optional[str] = None
    max_teachers: Optional[int] = Field(None, ge=1)
    max_students: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None


class SchoolInDB(SchoolBase):
    """Schema for school in database"""
    id: int
    code: str
    slug: str
    logo_url: Optional[str]
    subscription_tier: str
    subscription_status: str
    max_teachers: int
    max_students: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SchoolResponse(SchoolInDB):
    """Schema for school response"""
    pass


class SchoolStats(BaseModel):
    """Schema for school statistics"""
    total_teachers: int
    total_students: int
    total_classes: int
    total_syllabi: int
    active_users: int
