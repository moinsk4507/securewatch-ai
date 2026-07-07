from __future__ import annotations

from typing import Callable, Dict

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from models.database import get_db
from models.user import User
from services.jwt_service import decode_token


ROLE_PERMISSIONS: Dict[str, set[str]] = {
    # 13 permissions total for admin (must include all 13 distinct permissions)
    "admin": {
        "view_dashboard",
        "view_live_logs",
        "manage_alerts",
        "create_rules",
        "view_raw_logs",
        "export_data",
        "block_ips",
        "manage_users",
        "manage_settings",
        "view_audit_logs",
        "resolve_alerts",
        "update_rules",
        "delete_rules",
    },
    "analyst": {
        "view_dashboard",
        "view_live_logs",
        "manage_alerts",
        "create_rules",
        "view_raw_logs",
        "export_data",
        "block_ips",
    },
    "viewer": {
        "view_dashboard",
    },
}

security = HTTPBearer(auto_error=True)


def get_current_user(
    credentials=Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    # User.id is UUID in DB; cast to UUID for reliable querying
    try:
        from uuid import UUID

        user_uuid = UUID(str(user_id))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user: User | None = db.query(User).filter(User.id == user_uuid).first()
    except Exception:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    if not user or user.is_active is not True:
        raise HTTPException(status_code=401, detail="Inactive or not found")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_permission(permission: str) -> Callable[[User], User]:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        allowed = ROLE_PERMISSIONS.get(current_user.role, set())
        if permission not in allowed:
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user

    return dependency

