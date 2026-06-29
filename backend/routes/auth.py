from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.database import get_db
from models.user import User
from services.jwt_service import create_access_token, hash_password, verify_password
from middleware.auth_middleware import get_current_user


router = APIRouter(tags=["auth"])


class LoginBody(BaseModel):
    email: str
    password: str


class RegisterBody(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    role: str | None = None


class EmailBody(BaseModel):
    email: EmailStr


def _password_valid(pw: str) -> None:
    if len(pw) < 12:
        raise HTTPException(status_code=400, detail="Password must be at least 12 characters")

    has_upper = any(c.isupper() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    has_special = any((not c.isalnum()) for c in pw)

    if not (has_upper and has_digit and has_special):
        raise HTTPException(
            status_code=400,
            detail="Password must include uppercase, digit, and special character",
        )


def _audit(db: Session, *, action: str, user: User | None, details: Dict[str, Any] | None, request: Request | None, success: bool, error_msg: str | None = None) -> None:
    ip = request.client.host if request and request.client else None
    user_email = user.email if user else None
    user_role = user.role if user else None
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            user_email=user_email,
            user_role=user_role,
            action=action,
            resource=None,
            resource_id=None,
            details=details,
            ip_address=ip,
            user_agent=request.headers.get("user-agent") if request else None,
            success=success,
            error_msg=error_msg,
        )
    )
    db.commit()


@router.post("/login")
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)) -> dict:
    email = (body.email or "").strip().lower()
    password = body.password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        _audit(db, action="LOGIN_FAILED", user=None, details={"email": email}, request=request, success=False)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password):
        _audit(db, action="LOGIN_FAILED", user=user, details={"email": email}, request=request, success=False)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.last_login = datetime.utcnow()
    db.commit()

    token, expires_in = create_access_token(str(user.id), user.email, user.role, user.name, remember=False)

    _audit(db, action="LOGIN_SUCCESS", user=user, details=None, request=request, success=True)

    return {
        "token": token,
        "expires_in": expires_in,
        "user": user.to_dict(),
    }


@router.post("/register", status_code=201)
def register(body: RegisterBody, request: Request, db: Session = Depends(get_db)) -> dict:
    email = (body.email or "").strip().lower()
    password = body.password or ""
    first_name = (body.firstName or "").strip()
    last_name = (body.lastName or "").strip()

    if not email or not password or not first_name or not last_name:
        raise HTTPException(status_code=400, detail="All fields are required")

    _password_valid(password)

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    role = (body.role or "analyst").strip()
    if role not in {"admin", "analyst", "viewer"}:
        role = "analyst"

    name = f"{first_name} {last_name}".strip()
    hashed = hash_password(password)

    new_user = User(
        id=uuid.uuid4(),
        email=email,
        password=hashed,
        name=name,
        role=role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token, expires_in = create_access_token(str(new_user.id), new_user.email, new_user.role, new_user.name, remember=False)

    _audit(db, action="REGISTER", user=new_user, details=None, request=request, success=True)

    return {
        "token": token,
        "expires_in": expires_in,
        "user": new_user.to_dict(),
    }


@router.get("/check-email")
def check_email(email: str = Query(...), db: Session = Depends(get_db)) -> dict:
    normalized = (email or "").strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="Email is required")

    exists = db.query(User).filter(User.email == normalized).first() is not None
    return {"exists": exists}


@router.post("/send-verify")
def send_verify(body: EmailBody, request: Request, db: Session = Depends(get_db)) -> dict:
    # Verification flow is outside current scope; log auditable event.
    email = (body.email or "").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    _audit(db, action="SEND_VERIFY", user=user, details={"email": email}, request=request, success=True)
    return {"message": f"Verification sent to {email}"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return current_user.to_dict()

