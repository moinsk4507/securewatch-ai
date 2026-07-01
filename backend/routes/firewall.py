from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.blocked_ip import BlockedIP
from models.database import get_db
from models.user import User
from middleware.auth_middleware import get_current_user, require_admin

router = APIRouter(tags=["firewall"])

IP_PATTERN = re.compile(r"^(\d{1,3}\.){3}\d{1,3}$")


class BlockIPBody(BaseModel):
    ip: str
    reason: str | None = None


@router.get("/firewall/blocked")
def get_blocked_ips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ips = (
        db.query(BlockedIP)
        .filter(BlockedIP.is_active == True)
        .order_by(BlockedIP.created_at.desc())
        .all()
    )
    return {
        "data": {
            "blocked_ips": [ip.to_dict() for ip in ips],
            "total": len(ips),
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/firewall/block", status_code=201)
def block_ip(
    body: BlockIPBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None,
):
    ip = body.ip.strip()

    if not IP_PATTERN.match(ip):
        raise HTTPException(status_code=400, detail="Invalid IP address format")

    octets = [int(o) for o in ip.split(".")]
    if any(o > 255 for o in octets):
        raise HTTPException(status_code=400, detail="Invalid IP address format")

    existing = db.query(BlockedIP).filter(
        BlockedIP.ip_address == ip,
    ).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=409, detail="IP is already blocked")
        existing.is_active = True
        existing.reason = body.reason
        existing.blocked_by = current_user.id
        existing.created_at = datetime.now(timezone.utc)
        blocked = existing
    else:
        blocked = BlockedIP(
            ip_address=ip,
            reason=body.reason,
            blocked_by=current_user.id,
        )
        db.add(blocked)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="IP_BLOCKED",
            resource="firewall",
            resource_id=ip,
            details={"reason": body.reason},
            ip_address=request.client.host if request and request.client else None,
            success=True,
        )
    )
    db.commit()
    db.refresh(blocked)

    return {
        "data": blocked.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/firewall/unblock/{ip}")
def unblock_ip(
    ip: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    blocked = (
        db.query(BlockedIP)
        .filter(BlockedIP.ip_address == ip, BlockedIP.is_active == True)
        .first()
    )
    if not blocked:
        raise HTTPException(status_code=404, detail="Blocked IP not found")

    blocked.is_active = False

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            user_role=current_user.role,
            action="IP_UNBLOCKED",
            resource="firewall",
            resource_id=ip,
            success=True,
        )
    )
    db.commit()

    return {
        "data": {"message": f"IP {ip} unblocked"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
