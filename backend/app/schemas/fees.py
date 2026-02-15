"""
Fees Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ---- Enums ----

class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    ONLINE = "online"
    CHEQUE = "cheque"


class PaymentStatusEnum(str, Enum):
    PAID = "paid"
    PARTIAL = "partial"
    UNPAID = "unpaid"


class DiscountTypeEnum(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class ReminderTypeEnum(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


# ---- FeesType ----

class FeesTypeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class FeesTypeCreate(FeesTypeBase):
    school_id: int


class FeesTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FeesTypeResponse(FeesTypeBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- FeesGroup ----

class FeesGroupBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None


class FeesGroupCreate(FeesGroupBase):
    school_id: int


class FeesGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FeesGroupResponse(FeesGroupBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- FeesMaster ----

class FeesMasterBase(BaseModel):
    fees_group_id: int
    fees_type_id: int
    amount: float = Field(..., gt=0)
    due_date: Optional[datetime] = None
    academic_year: str = Field(..., min_length=4, max_length=20)
    term: Optional[str] = None


class FeesMasterCreate(FeesMasterBase):
    school_id: int


class FeesMasterUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[datetime] = None
    term: Optional[str] = None
    is_active: Optional[bool] = None


class FeesMasterResponse(FeesMasterBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    fees_type_name: Optional[str] = None
    fees_group_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- FeesDiscount ----

class FeesDiscountBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    discount_type: DiscountTypeEnum
    amount: float = Field(..., gt=0)
    description: Optional[str] = None

    @validator("amount")
    def validate_percentage(cls, v, values):
        if values.get("discount_type") == DiscountTypeEnum.PERCENTAGE and v > 100:
            raise ValueError("Percentage discount cannot exceed 100")
        return v


class FeesDiscountCreate(FeesDiscountBase):
    school_id: int


class FeesDiscountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = None
    discount_type: Optional[DiscountTypeEnum] = None
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FeesDiscountResponse(FeesDiscountBase):
    id: int
    school_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- FeesAssign ----

class FeesAssignCreate(BaseModel):
    school_id: int
    student_id: int
    fees_master_id: int
    discount_id: Optional[int] = None


class FeesAssignResponse(BaseModel):
    id: int
    school_id: int
    student_id: int
    fees_master_id: int
    discount_id: Optional[int] = None
    total_amount: float
    paid_amount: float
    balance: float
    status: str
    due_date: Optional[datetime] = None
    is_carried_forward: bool
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    fees_type_name: Optional[str] = None
    fees_group_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- FeesPayment ----

class FeesPaymentCreate(BaseModel):
    school_id: int
    student_id: int
    fees_assign_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethodEnum
    payment_date: Optional[datetime] = None
    transaction_id: Optional[str] = None
    bank_name: Optional[str] = None
    cheque_number: Optional[str] = None
    cheque_date: Optional[datetime] = None
    note: Optional[str] = None


class FeesPaymentResponse(BaseModel):
    id: int
    school_id: int
    student_id: int
    fees_assign_id: int
    fees_master_id: int
    amount: float
    payment_method: str
    payment_date: datetime
    transaction_id: Optional[str] = None
    receipt_number: Optional[str] = None
    bank_name: Optional[str] = None
    cheque_number: Optional[str] = None
    cheque_date: Optional[datetime] = None
    note: Optional[str] = None
    collected_by: Optional[int] = None
    is_verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Quick Fees (bulk assign) ----

class QuickFeesAssign(BaseModel):
    school_id: int
    fees_master_id: int
    class_id: Optional[int] = None
    student_ids: Optional[List[int]] = None
    discount_id: Optional[int] = None


# ---- Carry Forward ----

class FeesCarryForwardRequest(BaseModel):
    school_id: int
    from_academic_year: str
    to_academic_year: str
    from_term: Optional[str] = None
    to_term: Optional[str] = None
    student_ids: Optional[List[int]] = None


class FeesCarryForwardPreview(BaseModel):
    student_id: int
    student_name: str
    total_balance: float
    items_count: int


# ---- Reminders ----

class FeesReminderCreate(BaseModel):
    school_id: int
    student_ids: List[int]
    reminder_type: ReminderTypeEnum
    message: Optional[str] = None


class FeesReminderResponse(BaseModel):
    id: int
    school_id: int
    fees_assign_id: int
    student_id: int
    reminder_type: str
    message: Optional[str] = None
    sent_at: datetime
    sent_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Offline Bank Payment ----

class OfflineBankPaymentVerify(BaseModel):
    is_verified: bool = True
    note: Optional[str] = None
