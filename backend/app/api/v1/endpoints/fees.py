"""
Fees management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_school_admin
from app.models.user import User
from app.models.fees import (
    FeesType, FeesGroup, FeesMaster, FeesDiscount,
    FeesAssign, FeesPayment, FeesReminder
)
from app.schemas.fees import (
    FeesTypeCreate, FeesTypeUpdate, FeesTypeResponse,
    FeesGroupCreate, FeesGroupUpdate, FeesGroupResponse,
    FeesMasterCreate, FeesMasterUpdate, FeesMasterResponse,
    FeesDiscountCreate, FeesDiscountUpdate, FeesDiscountResponse,
    FeesAssignCreate, FeesAssignResponse,
    FeesPaymentCreate, FeesPaymentResponse,
    QuickFeesAssign,
    FeesCarryForwardRequest, FeesCarryForwardPreview,
    FeesReminderCreate, FeesReminderResponse,
    OfflineBankPaymentVerify,
)

router = APIRouter()


# ===================== FEES TYPE =====================

@router.get("/types/", response_model=List[FeesTypeResponse])
def list_fees_types(
    school_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesType)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesType.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesType.school_id == school_id)
    if is_active is not None:
        query = query.filter(FeesType.is_active == is_active)
    return query.order_by(FeesType.name).all()


@router.get("/types/{type_id}", response_model=FeesTypeResponse)
def get_fees_type(type_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    ft = db.query(FeesType).filter(FeesType.id == type_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Fees type not found")
    return ft


@router.post("/types/", response_model=FeesTypeResponse, status_code=status.HTTP_201_CREATED)
def create_fees_type(data: FeesTypeCreate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    ft = FeesType(**data.dict())
    db.add(ft)
    db.commit()
    db.refresh(ft)
    return ft


@router.put("/types/{type_id}", response_model=FeesTypeResponse)
def update_fees_type(type_id: int, data: FeesTypeUpdate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    ft = db.query(FeesType).filter(FeesType.id == type_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Fees type not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(ft, key, value)
    db.commit()
    db.refresh(ft)
    return ft


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fees_type(type_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    ft = db.query(FeesType).filter(FeesType.id == type_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Fees type not found")
    db.delete(ft)
    db.commit()
    return None


# ===================== FEES GROUP =====================

@router.get("/groups/", response_model=List[FeesGroupResponse])
def list_fees_groups(
    school_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesGroup)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesGroup.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesGroup.school_id == school_id)
    if is_active is not None:
        query = query.filter(FeesGroup.is_active == is_active)
    return query.order_by(FeesGroup.name).all()


@router.get("/groups/{group_id}", response_model=FeesGroupResponse)
def get_fees_group(group_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fg = db.query(FeesGroup).filter(FeesGroup.id == group_id).first()
    if not fg:
        raise HTTPException(status_code=404, detail="Fees group not found")
    return fg


@router.post("/groups/", response_model=FeesGroupResponse, status_code=status.HTTP_201_CREATED)
def create_fees_group(data: FeesGroupCreate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fg = FeesGroup(**data.dict())
    db.add(fg)
    db.commit()
    db.refresh(fg)
    return fg


@router.put("/groups/{group_id}", response_model=FeesGroupResponse)
def update_fees_group(group_id: int, data: FeesGroupUpdate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fg = db.query(FeesGroup).filter(FeesGroup.id == group_id).first()
    if not fg:
        raise HTTPException(status_code=404, detail="Fees group not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(fg, key, value)
    db.commit()
    db.refresh(fg)
    return fg


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fees_group(group_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fg = db.query(FeesGroup).filter(FeesGroup.id == group_id).first()
    if not fg:
        raise HTTPException(status_code=404, detail="Fees group not found")
    db.delete(fg)
    db.commit()
    return None


# ===================== FEES MASTER =====================

@router.get("/masters/", response_model=List[FeesMasterResponse])
def list_fees_masters(
    school_id: Optional[int] = None,
    fees_group_id: Optional[int] = None,
    fees_type_id: Optional[int] = None,
    academic_year: Optional[str] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesMaster)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesMaster.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesMaster.school_id == school_id)
    if fees_group_id:
        query = query.filter(FeesMaster.fees_group_id == fees_group_id)
    if fees_type_id:
        query = query.filter(FeesMaster.fees_type_id == fees_type_id)
    if academic_year:
        query = query.filter(FeesMaster.academic_year == academic_year)
    masters = query.order_by(FeesMaster.id).all()
    result = []
    for m in masters:
        resp = FeesMasterResponse.from_orm(m)
        resp.fees_type_name = m.fees_type.name if m.fees_type else None
        resp.fees_group_name = m.fees_group.name if m.fees_group else None
        result.append(resp)
    return result


@router.get("/masters/{master_id}", response_model=FeesMasterResponse)
def get_fees_master(master_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fm = db.query(FeesMaster).filter(FeesMaster.id == master_id).first()
    if not fm:
        raise HTTPException(status_code=404, detail="Fees master not found")
    resp = FeesMasterResponse.from_orm(fm)
    resp.fees_type_name = fm.fees_type.name if fm.fees_type else None
    resp.fees_group_name = fm.fees_group.name if fm.fees_group else None
    return resp


@router.post("/masters/", response_model=FeesMasterResponse, status_code=status.HTTP_201_CREATED)
def create_fees_master(data: FeesMasterCreate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fm = FeesMaster(**data.dict())
    db.add(fm)
    db.commit()
    db.refresh(fm)
    resp = FeesMasterResponse.from_orm(fm)
    resp.fees_type_name = fm.fees_type.name if fm.fees_type else None
    resp.fees_group_name = fm.fees_group.name if fm.fees_group else None
    return resp


@router.put("/masters/{master_id}", response_model=FeesMasterResponse)
def update_fees_master(master_id: int, data: FeesMasterUpdate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fm = db.query(FeesMaster).filter(FeesMaster.id == master_id).first()
    if not fm:
        raise HTTPException(status_code=404, detail="Fees master not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(fm, key, value)
    db.commit()
    db.refresh(fm)
    resp = FeesMasterResponse.from_orm(fm)
    resp.fees_type_name = fm.fees_type.name if fm.fees_type else None
    resp.fees_group_name = fm.fees_group.name if fm.fees_group else None
    return resp


@router.delete("/masters/{master_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fees_master(master_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fm = db.query(FeesMaster).filter(FeesMaster.id == master_id).first()
    if not fm:
        raise HTTPException(status_code=404, detail="Fees master not found")
    db.delete(fm)
    db.commit()
    return None


# ===================== FEES DISCOUNT =====================

@router.get("/discounts/", response_model=List[FeesDiscountResponse])
def list_fees_discounts(
    school_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesDiscount)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesDiscount.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesDiscount.school_id == school_id)
    if is_active is not None:
        query = query.filter(FeesDiscount.is_active == is_active)
    return query.order_by(FeesDiscount.name).all()


@router.get("/discounts/{discount_id}", response_model=FeesDiscountResponse)
def get_fees_discount(discount_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fd = db.query(FeesDiscount).filter(FeesDiscount.id == discount_id).first()
    if not fd:
        raise HTTPException(status_code=404, detail="Fees discount not found")
    return fd


@router.post("/discounts/", response_model=FeesDiscountResponse, status_code=status.HTTP_201_CREATED)
def create_fees_discount(data: FeesDiscountCreate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fd = FeesDiscount(**data.dict())
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return fd


@router.put("/discounts/{discount_id}", response_model=FeesDiscountResponse)
def update_fees_discount(discount_id: int, data: FeesDiscountUpdate, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fd = db.query(FeesDiscount).filter(FeesDiscount.id == discount_id).first()
    if not fd:
        raise HTTPException(status_code=404, detail="Fees discount not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(fd, key, value)
    db.commit()
    db.refresh(fd)
    return fd


@router.delete("/discounts/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fees_discount(discount_id: int, current_user: User = Depends(require_school_admin), db: Session = Depends(get_db)):
    fd = db.query(FeesDiscount).filter(FeesDiscount.id == discount_id).first()
    if not fd:
        raise HTTPException(status_code=404, detail="Fees discount not found")
    db.delete(fd)
    db.commit()
    return None


# ===================== COLLECT FEES =====================

@router.post("/collect/", response_model=FeesPaymentResponse, status_code=status.HTTP_201_CREATED)
def collect_fees(
    data: FeesPaymentCreate,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    # Fetch the fees assignment
    assign = db.query(FeesAssign).filter(FeesAssign.id == data.fees_assign_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Fees assignment not found")

    if assign.student_id != data.student_id:
        raise HTTPException(status_code=400, detail="Student ID does not match the fees assignment")

    if data.amount > assign.balance:
        raise HTTPException(status_code=400, detail=f"Payment amount ({data.amount}) exceeds balance ({assign.balance})")

    if assign.status == "paid":
        raise HTTPException(status_code=400, detail="This fee has already been fully paid")

    # Generate receipt number
    import time
    receipt_number = f"RCP-{data.school_id}-{int(time.time())}-{assign.id}"

    # Create payment
    payment = FeesPayment(
        school_id=data.school_id,
        student_id=data.student_id,
        fees_assign_id=assign.id,
        fees_master_id=assign.fees_master_id,
        amount=data.amount,
        payment_method=data.payment_method.value,
        payment_date=data.payment_date or datetime.utcnow(),
        transaction_id=data.transaction_id,
        receipt_number=receipt_number,
        bank_name=data.bank_name,
        cheque_number=data.cheque_number,
        cheque_date=data.cheque_date,
        note=data.note,
        collected_by=current_user.id,
        is_verified=True,
    )
    db.add(payment)

    # Update assignment
    assign.paid_amount += data.amount
    assign.balance -= data.amount
    assign.status = "paid" if assign.balance <= 0 else "partial"

    db.commit()
    db.refresh(payment)

    resp = FeesPaymentResponse.from_orm(payment)
    student = db.query(User).filter(User.id == data.student_id).first()
    resp.student_name = student.full_name if student else None
    return resp


# ===================== SEARCH PAYMENTS =====================

@router.get("/payments/", response_model=List[FeesPaymentResponse])
def search_payments(
    school_id: Optional[int] = None,
    student_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    is_verified: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesPayment)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesPayment.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesPayment.school_id == school_id)
    if student_id:
        query = query.filter(FeesPayment.student_id == student_id)
    if payment_method:
        query = query.filter(FeesPayment.payment_method == payment_method)
    if is_verified is not None:
        query = query.filter(FeesPayment.is_verified == is_verified)
    if date_from:
        query = query.filter(FeesPayment.payment_date >= date_from)
    if date_to:
        query = query.filter(FeesPayment.payment_date <= date_to)

    payments = query.order_by(FeesPayment.payment_date.desc()).all()
    result = []
    for p in payments:
        resp = FeesPaymentResponse.from_orm(p)
        resp.student_name = p.student.full_name if p.student else None
        result.append(resp)
    return result


@router.get("/payments/student/{student_id}", response_model=List[FeesPaymentResponse])
def get_student_payments(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Students can only see their own payments
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    payments = db.query(FeesPayment).filter(
        FeesPayment.student_id == student_id
    ).order_by(FeesPayment.payment_date.desc()).all()

    result = []
    for p in payments:
        resp = FeesPaymentResponse.from_orm(p)
        resp.student_name = p.student.full_name if p.student else None
        result.append(resp)
    return result


@router.get("/payments/{payment_id}", response_model=FeesPaymentResponse)
def get_payment(payment_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    payment = db.query(FeesPayment).filter(FeesPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if current_user.role == "student" and current_user.id != payment.student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    resp = FeesPaymentResponse.from_orm(payment)
    resp.student_name = payment.student.full_name if payment.student else None
    return resp


# ===================== SEARCH DUE FEES =====================

@router.get("/due/", response_model=List[FeesAssignResponse])
def search_due_fees(
    school_id: Optional[int] = None,
    student_id: Optional[int] = None,
    fees_group_id: Optional[int] = None,
    status: Optional[str] = None,
    academic_year: Optional[str] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesAssign)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesAssign.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesAssign.school_id == school_id)
    if student_id:
        query = query.filter(FeesAssign.student_id == student_id)
    if fees_group_id:
        query = query.join(FeesMaster).filter(FeesMaster.fees_group_id == fees_group_id)
    if status:
        query = query.filter(FeesAssign.status == status)
    else:
        query = query.filter(FeesAssign.status.in_(["unpaid", "partial"]))
    if academic_year:
        query = query.join(FeesMaster, isouter=True).filter(FeesMaster.academic_year == academic_year)

    assigns = query.order_by(FeesAssign.created_at.desc()).all()
    result = []
    for a in assigns:
        resp = FeesAssignResponse.from_orm(a)
        resp.student_name = a.student.full_name if a.student else None
        resp.fees_type_name = a.fees_master.fees_type.name if a.fees_master and a.fees_master.fees_type else None
        resp.fees_group_name = a.fees_master.fees_group.name if a.fees_master and a.fees_master.fees_group else None
        result.append(resp)
    return result


@router.get("/due/student/{student_id}", response_model=List[FeesAssignResponse])
def get_student_due_fees(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    assigns = db.query(FeesAssign).filter(
        FeesAssign.student_id == student_id
    ).order_by(FeesAssign.created_at.desc()).all()

    result = []
    for a in assigns:
        resp = FeesAssignResponse.from_orm(a)
        resp.student_name = a.student.full_name if a.student else None
        resp.fees_type_name = a.fees_master.fees_type.name if a.fees_master and a.fees_master.fees_type else None
        resp.fees_group_name = a.fees_master.fees_group.name if a.fees_master and a.fees_master.fees_group else None
        result.append(resp)
    return result


# ===================== QUICK FEES (BULK ASSIGN) =====================

@router.post("/quick-assign/", response_model=List[FeesAssignResponse], status_code=status.HTTP_201_CREATED)
def quick_assign_fees(
    data: QuickFeesAssign,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    # Get the fees master
    master = db.query(FeesMaster).filter(FeesMaster.id == data.fees_master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Fees master not found")

    # Get discount if provided
    discount = None
    if data.discount_id:
        discount = db.query(FeesDiscount).filter(FeesDiscount.id == data.discount_id).first()

    # Get student IDs
    student_ids = data.student_ids or []
    if data.class_id:
        from app.models.class_model import Class
        cls = db.query(Class).filter(Class.id == data.class_id).first()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")
        # Get all students in the school (for now, since we don't have enrollment)
        students = db.query(User).filter(
            User.school_id == data.school_id,
            User.role == "student",
            User.is_active == True
        ).all()
        student_ids = [s.id for s in students]

    if not student_ids:
        raise HTTPException(status_code=400, detail="No students specified")

    created = []
    for sid in student_ids:
        # Check if already assigned
        existing = db.query(FeesAssign).filter(
            FeesAssign.student_id == sid,
            FeesAssign.fees_master_id == master.id,
            FeesAssign.is_carried_forward == False
        ).first()
        if existing:
            continue

        # Calculate amount after discount
        total = master.amount
        if discount:
            if discount.discount_type == "percentage":
                total = total * (1 - discount.amount / 100)
            else:
                total = max(0, total - discount.amount)

        assign = FeesAssign(
            school_id=data.school_id,
            student_id=sid,
            fees_master_id=master.id,
            discount_id=data.discount_id,
            total_amount=round(total, 2),
            paid_amount=0,
            balance=round(total, 2),
            status="unpaid",
            due_date=master.due_date,
        )
        db.add(assign)
        created.append(assign)

    db.commit()

    result = []
    for a in created:
        db.refresh(a)
        resp = FeesAssignResponse.from_orm(a)
        resp.student_name = a.student.full_name if a.student else None
        resp.fees_type_name = a.fees_master.fees_type.name if a.fees_master and a.fees_master.fees_type else None
        resp.fees_group_name = a.fees_master.fees_group.name if a.fees_master and a.fees_master.fees_group else None
        result.append(resp)
    return result


# ===================== OFFLINE BANK PAYMENTS =====================

@router.post("/offline-bank-payments/", response_model=FeesPaymentResponse, status_code=status.HTTP_201_CREATED)
def create_offline_bank_payment(
    data: FeesPaymentCreate,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    assign = db.query(FeesAssign).filter(FeesAssign.id == data.fees_assign_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Fees assignment not found")

    if data.amount > assign.balance:
        raise HTTPException(status_code=400, detail=f"Payment amount exceeds balance ({assign.balance})")

    import time
    receipt_number = f"OBP-{data.school_id}-{int(time.time())}-{assign.id}"

    payment = FeesPayment(
        school_id=data.school_id,
        student_id=data.student_id,
        fees_assign_id=assign.id,
        fees_master_id=assign.fees_master_id,
        amount=data.amount,
        payment_method="bank_transfer",
        payment_date=data.payment_date or datetime.utcnow(),
        transaction_id=data.transaction_id,
        receipt_number=receipt_number,
        bank_name=data.bank_name,
        note=data.note,
        collected_by=current_user.id,
        is_verified=False,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    resp = FeesPaymentResponse.from_orm(payment)
    resp.student_name = payment.student.full_name if payment.student else None
    return resp


@router.get("/offline-bank-payments/", response_model=List[FeesPaymentResponse])
def list_offline_bank_payments(
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesPayment).filter(
        FeesPayment.payment_method == "bank_transfer",
        FeesPayment.is_verified == False
    )
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesPayment.school_id == current_user.school_id)

    payments = query.order_by(FeesPayment.created_at.desc()).all()
    result = []
    for p in payments:
        resp = FeesPaymentResponse.from_orm(p)
        resp.student_name = p.student.full_name if p.student else None
        result.append(resp)
    return result


@router.put("/offline-bank-payments/{payment_id}/verify", response_model=FeesPaymentResponse)
def verify_offline_bank_payment(
    payment_id: int,
    data: OfflineBankPaymentVerify,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    payment = db.query(FeesPayment).filter(FeesPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.is_verified:
        raise HTTPException(status_code=400, detail="Payment already verified")

    payment.is_verified = data.is_verified
    payment.verified_by = current_user.id
    payment.verified_at = datetime.utcnow()
    if data.note:
        payment.note = data.note

    # Update the fees assignment balance
    if data.is_verified:
        assign = db.query(FeesAssign).filter(FeesAssign.id == payment.fees_assign_id).first()
        if assign:
            assign.paid_amount += payment.amount
            assign.balance -= payment.amount
            assign.status = "paid" if assign.balance <= 0 else "partial"

    db.commit()
    db.refresh(payment)

    resp = FeesPaymentResponse.from_orm(payment)
    resp.student_name = payment.student.full_name if payment.student else None
    return resp


# ===================== CARRY FORWARD =====================

@router.get("/carry-forward/preview", response_model=List[FeesCarryForwardPreview])
def preview_carry_forward(
    school_id: int,
    from_academic_year: str,
    from_term: Optional[str] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesAssign).join(FeesMaster).filter(
        FeesAssign.school_id == school_id,
        FeesAssign.balance > 0,
        FeesMaster.academic_year == from_academic_year,
    )
    if from_term:
        query = query.filter(FeesMaster.term == from_term)

    assigns = query.all()

    # Group by student
    student_map = {}
    for a in assigns:
        if a.student_id not in student_map:
            student_map[a.student_id] = {
                "student_id": a.student_id,
                "student_name": a.student.full_name if a.student else "Unknown",
                "total_balance": 0,
                "items_count": 0,
            }
        student_map[a.student_id]["total_balance"] += a.balance
        student_map[a.student_id]["items_count"] += 1

    return [FeesCarryForwardPreview(**v) for v in student_map.values()]


@router.post("/carry-forward/", status_code=status.HTTP_201_CREATED)
def carry_forward_fees(
    data: FeesCarryForwardRequest,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesAssign).join(FeesMaster).filter(
        FeesAssign.school_id == data.school_id,
        FeesAssign.balance > 0,
        FeesMaster.academic_year == data.from_academic_year,
    )
    if data.from_term:
        query = query.filter(FeesMaster.term == data.from_term)
    if data.student_ids:
        query = query.filter(FeesAssign.student_id.in_(data.student_ids))

    assigns = query.all()
    created_count = 0

    for a in assigns:
        # Create a new carry-forward assignment
        new_assign = FeesAssign(
            school_id=a.school_id,
            student_id=a.student_id,
            fees_master_id=a.fees_master_id,
            discount_id=a.discount_id,
            total_amount=a.balance,
            paid_amount=0,
            balance=a.balance,
            status="unpaid",
            due_date=None,
            is_carried_forward=True,
        )
        db.add(new_assign)
        created_count += 1

    db.commit()
    return {"message": f"Carried forward {created_count} fee items to {data.to_academic_year}"}


# ===================== REMINDERS =====================

@router.post("/reminders/", status_code=status.HTTP_201_CREATED)
def send_fees_reminders(
    data: FeesReminderCreate,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    created = 0
    for sid in data.student_ids:
        # Get all unpaid/partial assignments for this student
        assigns = db.query(FeesAssign).filter(
            FeesAssign.student_id == sid,
            FeesAssign.school_id == data.school_id,
            FeesAssign.status.in_(["unpaid", "partial"])
        ).all()

        for assign in assigns:
            reminder = FeesReminder(
                school_id=data.school_id,
                fees_assign_id=assign.id,
                student_id=sid,
                reminder_type=data.reminder_type.value,
                message=data.message,
                sent_by=current_user.id,
            )
            db.add(reminder)
            created += 1

    db.commit()
    return {"message": f"Sent {created} reminders to {len(data.student_ids)} students"}


@router.get("/reminders/", response_model=List[FeesReminderResponse])
def list_fees_reminders(
    school_id: Optional[int] = None,
    student_id: Optional[int] = None,
    current_user: User = Depends(require_school_admin),
    db: Session = Depends(get_db)
):
    query = db.query(FeesReminder)
    if current_user.role == "school_admin" and current_user.school_id:
        query = query.filter(FeesReminder.school_id == current_user.school_id)
    elif school_id:
        query = query.filter(FeesReminder.school_id == school_id)
    if student_id:
        query = query.filter(FeesReminder.student_id == student_id)
    return query.order_by(FeesReminder.sent_at.desc()).limit(100).all()
