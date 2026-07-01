from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.database import get_db
from models.settings import Setting
from models.user import User
from middleware.auth_middleware import get_current_user, require_admin

router = APIRouter(tags=["settings"])

SETTINGS_DEFAULTS = {
    "system_name": "SecureWatch AI",
    "timezone": "UTC",
    "log_retention": "90 days",
    "refresh_interval": "2s",
    "email_alerts": "true",
    "alert_email": "admin@securewatch.local",
    "slack_enabled": "false",
    "slack_url": "",
    "min_severity": "medium",
    "contamination": "0.1",
    "n_estimators": "100",
    "auto_retrain": "true",
    "alert_threshold": "-0.7",
    "es_url": "http://localhost:9200",
    "kibana_url": "http://localhost:5601",
    "logstash_port": "5044",
    "two_fa": "false",
    "session_timeout": "8h",
}

CATEGORY_KEYS = {
    "general": ["system_name", "timezone", "log_retention", "refresh_interval"],
    "notifications": ["email_alerts", "alert_email", "slack_enabled", "slack_url", "min_severity"],
    "ml": ["contamination", "n_estimators", "auto_retrain", "alert_threshold"],
    "security": ["two_fa", "session_timeout"],
}


class GeneralSettingsBody(BaseModel):
    system_name: str | None = None
    timezone: str | None = None
    log_retention: str | None = None
    refresh_interval: str | None = None


class NotificationSettingsBody(BaseModel):
    email_alerts: bool | None = None
    alert_email: str | None = None
    slack_enabled: bool | None = None
    slack_url: str | None = None
    min_severity: str | None = None


class MLSettingsBody(BaseModel):
    contamination: float | None = None
    n_estimators: int | None = None
    auto_retrain: bool | None = None
    alert_threshold: float | None = None


class SecuritySettingsBody(BaseModel):
    two_fa: bool | None = None
    session_timeout: str | None = None


class ConfirmBody(BaseModel):
    confirm: str


def _merge_settings(db: Session) -> dict:
    result = dict(SETTINGS_DEFAULTS)
    rows = db.query(Setting).all()
    for row in rows:
        result[row.key] = row.value
    return result


def _upsert(db: Session, key: str, value: str, category: str, user: User):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if setting:
        setting.value = value
        setting.updated_by = user.id
        setting.updated_at = datetime.now(timezone.utc)
    else:
        db.add(
            Setting(
                key=key,
                value=value,
                value_type="string",
                category=category,
                updated_by=user.id,
            )
        )
    db.commit()


def _update_category(db: Session, data: dict, category: str, user: User):
    keys = CATEGORY_KEYS.get(category, [])
    for key in keys:
        if key in data and data[key] is not None:
            val = data[key]
            if isinstance(val, bool):
                val = str(val).lower()
            elif not isinstance(val, str):
                val = str(val)
            _upsert(db, key, val, category, user)


@router.get("/settings")
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "data": _merge_settings(db),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/settings/general")
def update_general(
    body: GeneralSettingsBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _update_category(db, body.model_dump(exclude_unset=True), "general", current_user)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="SETTINGS_GENERAL",
            resource="settings",
            success=True,
        )
    )
    db.commit()

    return {
        "data": _merge_settings(db),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/settings/notifications")
def update_notifications(
    body: NotificationSettingsBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _update_category(db, body.model_dump(exclude_unset=True), "notifications", current_user)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="SETTINGS_NOTIFICATIONS",
            resource="settings",
            success=True,
        )
    )
    db.commit()

    return {
        "data": _merge_settings(db),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/settings/ml")
def update_ml(
    body: MLSettingsBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _update_category(db, body.model_dump(exclude_unset=True), "ml", current_user)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="SETTINGS_ML",
            resource="settings",
            success=True,
        )
    )
    db.commit()

    return {
        "data": _merge_settings(db),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/settings/security")
def update_security(
    body: SecuritySettingsBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _update_category(db, body.model_dump(exclude_unset=True), "security", current_user)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="SETTINGS_SECURITY",
            resource="settings",
            success=True,
        )
    )
    db.commit()

    return {
        "data": _merge_settings(db),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/settings/test-connections")
def test_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = _merge_settings(db)

    import urllib.request
    import urllib.error

    es_status = "unknown"
    kibana_status = "unknown"
    logstash_status = "unknown"
    filebeat_status = "unknown"

    try:
        req = urllib.request.Request(settings.get("es_url", "http://localhost:9200"), method="HEAD")
        urllib.request.urlopen(req, timeout=3)
        es_status = "connected"
    except Exception:
        es_status = "disconnected"

    try:
        req = urllib.request.Request(settings.get("kibana_url", "http://localhost:5601"), method="HEAD")
        urllib.request.urlopen(req, timeout=3)
        kibana_status = "connected"
    except Exception:
        kibana_status = "disconnected"

    return {
        "data": {
            "elasticsearch": es_status,
            "kibana": kibana_status,
            "logstash": logstash_status,
            "filebeat": filebeat_status,
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/settings/flush-logs")
def flush_logs(
    body: ConfirmBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if body.confirm != "FLUSH":
        raise HTTPException(status_code=400, detail="Confirm must be exactly FLUSH")

    from models.alert import Alert
    from models.ml_result import MLResult
    from models.rule import RuleHit

    db.query(RuleHit).delete()
    db.query(MLResult).delete()
    db.query(Alert).delete()

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="LOGS_FLUSHED",
            resource="system",
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": "All log data flushed successfully"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/settings/reset-ml")
def reset_ml(
    body: ConfirmBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if body.confirm != "RESET":
        raise HTTPException(status_code=400, detail="Confirm must be exactly RESET")

    from models.ml_result import MLResult

    db.query(MLResult).delete()

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="ML_MODEL_RESET",
            resource="ml",
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": "ML model reset successfully"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/settings/delete-users")
def delete_users(
    body: ConfirmBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if body.confirm != "DELETE":
        raise HTTPException(status_code=400, detail="Confirm must be exactly DELETE")

    from models.user import User as UserModel

    deleted = db.query(UserModel).filter(
        UserModel.id != current_user.id,
        UserModel.role != 'admin',
    ).delete()

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="USERS_DELETED",
            resource="system",
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": f"{deleted} non-admin user(s) deleted successfully"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
