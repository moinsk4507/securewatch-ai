from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.database import get_db
from models.user import User
from middleware.auth_middleware import get_current_user
from services.jwt_service import hash_password, verify_password

router = APIRouter(tags=["user"])

ROLE_PERMISSIONS = {
    "admin": [
        "view_dashboard", "view_live_logs", "manage_alerts", "create_rules",
        "delete_rules", "manage_users", "view_raw_logs", "export_data",
        "retrain_model", "access_settings", "delete_system_data", "block_ips",
        "view_audit_logs",
    ],
    "analyst": [
        "view_dashboard", "view_live_logs", "manage_alerts", "create_rules",
        "view_raw_logs", "export_data", "block_ips",
    ],
    "viewer": ["view_dashboard"],
}


class UpdateNameBody(BaseModel):
    name: str


class ChangePasswordBody(BaseModel):
    current: str
    newPass: str


@router.get("/user/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "data": current_user.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.put("/user/me")
def update_me(
    body: UpdateNameBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = body.name
    db.commit()
    db.refresh(current_user)
    return {
        "data": current_user.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/user/change-password")
def change_password(
    body: ChangePasswordBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    if not verify_password(body.current, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(body.newPass) < 12:
        raise HTTPException(status_code=400, detail="New password must be at least 12 characters")

    current_user.password = hash_password(body.newPass)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="PASSWORD_CHANGED",
            resource="user",
            ip_address=request.client.host if request and request.client else None,
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": "Password changed successfully"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/user/stats")
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts_reviewed = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action.in_(["ALERT_STATUS_UPDATE", "ALERTS_RESOLVE_ALL"]),
    ).count()

    rules_created = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action == "RULE_CREATE",
    ).count()

    days_active = (datetime.now(timezone.utc) - current_user.created_at).days if current_user.created_at else 0

    return {
        "data": {
            "alerts_reviewed": alerts_reviewed,
            "rules_created": rules_created,
            "days_active": days_active,
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/user/activity")
def get_user_activity(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(6)
        .all()
    )

    action_icons = {
        "LOGIN_SUCCESS": ("log-in", "green"),
        "LOGIN_FAILED": ("log-in", "red"),
        "PASSWORD_CHANGED": ("lock", "cyan"),
        "RULE_CREATE": ("ruler", "purple"),
        "RULE_UPDATE": ("ruler", "blue"),
        "RULE_DELETE": ("ruler", "red"),
        "ALERT_STATUS_UPDATE": ("bell", "orange"),
        "ALERTS_RESOLVE_ALL": ("check", "green"),
        "IP_BLOCKED": ("shield", "red"),
        "IP_UNBLOCKED": ("shield", "green"),
        "SETTINGS_GENERAL": ("settings", "cyan"),
        "SETTINGS_NOTIFICATIONS": ("bell", "cyan"),
        "SETTINGS_ML": ("cpu", "purple"),
        "SETTINGS_SECURITY": ("lock", "orange"),
    }

    activity = []
    for log in logs:
        icon, color = action_icons.get(log.action, ("activity", "text2"))
        activity.append({
            "action": log.action.replace("_", " ").title(),
            "time": log.timestamp.isoformat() if log.timestamp else None,
            "icon": icon,
            "color": color,
        })

    return {
        "data": activity,
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/user/permissions")
def get_user_permissions(current_user: User = Depends(get_current_user)):
    perms = ROLE_PERMISSIONS.get(current_user.role, [])
    return {
        "data": {"permissions": [{"name": p, "allowed": True} for p in perms]},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
