from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.database import get_db
from models.rule import Rule
from models.user import User
from middleware.auth_middleware import get_current_user, require_admin


router = APIRouter(tags=["rules"])

DEFAULT_RULES_DATA = [
    {"id": "BF-001", "name": "SSH Brute Force", "condition": "failed_logins > 5 in 60s", "severity": "critical", "action": "Alert + Block", "description": None, "enabled": True, "hits_today": 247},
    {"id": "PS-002", "name": "Port Scan Detection", "condition": "ports_scanned > 100 in 3s", "severity": "critical", "action": "Alert + Log", "description": None, "enabled": True, "hits_today": 189},
    {"id": "DD-003", "name": "DDoS Pattern", "condition": "req_rate > 18x baseline", "severity": "high", "action": "Alert + Rate Limit", "description": None, "enabled": True, "hits_today": 94},
    {"id": "GE-004", "name": "Geo Anomaly", "condition": "Login country NOT IN whitelist", "severity": "high", "action": "Alert + MFA", "description": None, "enabled": True, "hits_today": 41},
    {"id": "ML-005", "name": "ML Anomaly Score", "condition": "if_score < -0.7", "severity": "critical", "action": "Alert + Quarantine", "description": None, "enabled": True, "hits_today": 312},
    {"id": "SB-006", "name": "Slow Brute Force", "condition": "failed_logins > 50 in 8h", "severity": "medium", "action": "Alert Only", "description": None, "enabled": True, "hits_today": 28},
    {"id": "TN-007", "name": "Tor Exit Node", "condition": "ip IN tor_exit_list", "severity": "high", "action": "Alert + Flag", "description": None, "enabled": True, "hits_today": 41},
    {"id": "PE-008", "name": "Privilege Escalation", "condition": "sudo_fail > 3 in 5min", "severity": "high", "action": "Alert + Block", "description": None, "enabled": False, "hits_today": 7},
]


def _seed_rules(db: Session) -> None:
    if db.query(Rule).count() == 0:
        for r in DEFAULT_RULES_DATA:
            db.add(Rule(**r))
        db.commit()


def _audit(db: Session, action: str, user: User, rule: Rule, details: Dict[str, Any] | None = None):
    db.add(
        AuditLog(
            user_id=user.id,
            user_email=user.email,
            user_role=user.role,
            action=action,
            resource="rule",
            resource_id=rule.id,
            details=details or {"rule_name": rule.name},
            success=True,
        )
    )
    db.commit()


class RuleCreateBody(BaseModel):
    name: str
    condition: str
    severity: str
    action: str
    description: str | None = None
    enabled: bool = True


class RuleUpdateBody(BaseModel):
    name: str | None = None
    condition: str | None = None
    severity: str | None = None
    action: str | None = None
    description: str | None = None
    enabled: bool | None = None


@router.get("/rules")
def get_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _seed_rules(db)
    rules = db.query(Rule).order_by(Rule.id).all()
    return {
        "data": {
            "rules": [r.to_dict() for r in rules],
            "total": len(rules),
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/rules", status_code=201)
def create_rule(
    body: RuleCreateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _seed_rules(db)

    last = db.query(Rule).order_by(Rule.id.desc()).first()
    next_num = 1
    if last:
        try:
            next_num = int(last.id.split("-")[-1]) + 1
        except (IndexError, ValueError):
            next_num = db.query(Rule).count() + 1

    rule_id = f"RULE-{next_num:03d}"

    rule = Rule(
        id=rule_id,
        name=body.name,
        condition=body.condition,
        severity=body.severity,
        action=body.action,
        description=body.description,
        enabled=body.enabled,
        created_by=current_user.id,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    _audit(db, "RULE_CREATE", current_user, rule)

    return {
        "data": rule.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.patch("/rules/{rule_id}")
def patch_rule(
    rule_id: str,
    body: RuleUpdateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _seed_rules(db)

    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    rule.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(rule)

    _audit(db, "RULE_UPDATE", current_user, rule, {"updated_fields": list(update_data.keys())})

    return {
        "data": rule.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.put("/rules/{rule_id}")
def put_rule(
    rule_id: str,
    body: RuleCreateBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _seed_rules(db)

    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.name = body.name
    rule.condition = body.condition
    rule.severity = body.severity
    rule.action = body.action
    rule.description = body.description
    rule.enabled = body.enabled
    rule.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(rule)

    _audit(db, "RULE_UPDATE", current_user, rule)

    return {
        "data": rule.to_dict(),
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/rules/{rule_id}")
def delete_rule(
    rule_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _seed_rules(db)

    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()

    _audit(db, "RULE_DELETE", current_user, rule)

    return {
        "data": {"message": f"Rule {rule_id} deleted"},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
