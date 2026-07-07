from __future__ import annotations

from datetime import datetime, timezone
from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from models.alert import Alert
from models.audit_log import AuditLog
from models.database import get_db
from models.user import User
from middleware.auth_middleware import get_current_user


router = APIRouter(tags=["alerts"])


class StatusBody(BaseModel):
    status: str


def _audit(db: Session, action: str, user: User, alert: Alert, success: bool):
    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            user_role=user.role,
            action=action,
            resource="alert",
            resource_id=str(alert.id),
            details={"alert_name": alert.name, "status": alert.status},
            success=success,
        )
    )
    db.commit()


@router.get("/alerts")
def get_alerts(
    severity: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)

    total = query.count()

    order_fn = desc if sort == "desc" else asc
    query = query.order_by(order_fn(Alert.created_at))

    offset = (page - 1) * per_page
    alerts = query.offset(offset).limit(per_page).all()

    total_pages = max(1, ceil(total / per_page))

    return {
        "data": [a.to_dict() for a in alerts],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.post("/alerts/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    body: StatusBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        uid = UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert = db.query(Alert).filter(Alert.id == uid).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    valid_statuses = {"open", "investigating", "resolved", "false_positive"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    alert.status = body.status
    alert.updated_at = datetime.now(timezone.utc)

    if body.status == "resolved":
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = current_user.id

    db.commit()
    db.refresh(alert)

    _audit(db, "ALERT_STATUS_UPDATE", current_user, alert, success=True)

    return {
        "data": alert.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/alerts/resolve-all")
def resolve_all_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    count = db.query(Alert).filter(Alert.status == "open").count()

    db.query(Alert).filter(Alert.status == "open").update(
        {
            "status": "resolved",
            "resolved_at": now,
            "resolved_by": current_user.id,
            "updated_at": now,
        },
        synchronize_session=False,
    )
    db.commit()

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="ALERTS_RESOLVE_ALL",
            resource="alert",
            details={"count": count},
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": f"Resolved {count} open alerts", "count": count},
        "message": "ok",
        "status": "success",
        "timestamp": now.isoformat(),
    }
