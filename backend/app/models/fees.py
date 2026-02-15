"""
Fees database models
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class FeesType(Base):
    """Types of fees: Tuition, Transport, Lab, Library, etc."""
    __tablename__ = "fees_types"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="fees_types")
    fees_masters = relationship("FeesMaster", back_populates="fees_type", cascade="all, delete-orphan")


class FeesGroup(Base):
    """Groups for fee structures: 'Grade 1-5 Fees', 'Grade 6-10 Fees', etc."""
    __tablename__ = "fees_groups"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="fees_groups")
    fees_masters = relationship("FeesMaster", back_populates="fees_group", cascade="all, delete-orphan")


class FeesMaster(Base):
    """Links fee types to groups with amounts - the actual fee structure"""
    __tablename__ = "fees_masters"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_group_id = Column(Integer, ForeignKey("fees_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_type_id = Column(Integer, ForeignKey("fees_types.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=True)
    academic_year = Column(String(20), nullable=False, index=True)
    term = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="fees_masters")
    fees_group = relationship("FeesGroup", back_populates="fees_masters")
    fees_type = relationship("FeesType", back_populates="fees_masters")
    fee_assigns = relationship("FeesAssign", back_populates="fees_master", cascade="all, delete-orphan")
    payments = relationship("FeesPayment", back_populates="fees_master", cascade="all, delete-orphan")


class FeesDiscount(Base):
    """Discount definitions: percentage or fixed amount"""
    __tablename__ = "fees_discounts"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    discount_type = Column(String(20), nullable=False)  # "percentage" or "fixed"
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="fees_discounts")


class FeesAssign(Base):
    """Assigns a fee master entry to a student - what they owe"""
    __tablename__ = "fees_assigns"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_master_id = Column(Integer, ForeignKey("fees_masters.id", ondelete="CASCADE"), nullable=False, index=True)
    discount_id = Column(Integer, ForeignKey("fees_discounts.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0, nullable=False)
    balance = Column(Float, nullable=False)
    status = Column(String(20), default="unpaid", nullable=False, index=True)  # paid, partial, unpaid
    due_date = Column(DateTime, nullable=True)
    is_carried_forward = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School")
    student = relationship("User", back_populates="fees_assigns", foreign_keys=[student_id])
    fees_master = relationship("FeesMaster", back_populates="fee_assigns")
    discount = relationship("FeesDiscount")
    payments = relationship("FeesPayment", back_populates="fees_assign", cascade="all, delete-orphan")


class FeesPayment(Base):
    """Individual payment transactions"""
    __tablename__ = "fees_payments"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_assign_id = Column(Integer, ForeignKey("fees_assigns.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_master_id = Column(Integer, ForeignKey("fees_masters.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), nullable=False)  # cash, bank_transfer, online, cheque
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    transaction_id = Column(String(100), nullable=True, index=True)
    receipt_number = Column(String(100), nullable=True, unique=True, index=True)

    bank_name = Column(String(100), nullable=True)
    cheque_number = Column(String(50), nullable=True)
    cheque_date = Column(DateTime, nullable=True)

    note = Column(Text, nullable=True)
    collected_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_verified = Column(Boolean, default=True)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School")
    student = relationship("User", foreign_keys=[student_id])
    fees_assign = relationship("FeesAssign", back_populates="payments")
    fees_master = relationship("FeesMaster", back_populates="payments")
    collector = relationship("User", foreign_keys=[collected_by])
    verifier = relationship("User", foreign_keys=[verified_by])


class FeesReminder(Base):
    """Fees reminder records"""
    __tablename__ = "fees_reminders"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    fees_assign_id = Column(Integer, ForeignKey("fees_assigns.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_type = Column(String(30), nullable=False)  # email, sms, in_app
    message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    sent_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School")
    fees_assign = relationship("FeesAssign")
    student = relationship("User", foreign_keys=[student_id])
    sender = relationship("User", foreign_keys=[sent_by])
