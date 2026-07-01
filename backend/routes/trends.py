from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.alert import Alert
from models.database import get_db
from models.user import User
from middleware.auth_middleware import get_current_user

router = APIRouter(tags=["trends"])


@router.get("/trends")
def get_trends(
    period: str = Query("7d", pattern=r"^(7d|30d)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days = 7 if period == "7d" else 30
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(
            func.date_trunc("day", Alert.created_at).label("day"),
            func.count(Alert.id).label("count"),
        )
        .filter(Alert.created_at >= since)
        .group_by(func.date_trunc("day", Alert.created_at))
        .order_by(func.date_trunc("day", Alert.created_at))
        .all()
    )

    buckets_map = {}
    for row in rows:
        day_str = row.day.strftime("%Y-%m-%d") if hasattr(row.day, "strftime") else str(row.day)
        buckets_map[day_str] = int(row.count)

    from collections import defaultdict
    severity_count = defaultdict(lambda: defaultdict(int))

    severity_rows = (
        db.query(
            func.date_trunc("day", Alert.created_at).label("day"),
            Alert.severity,
            func.count(Alert.id).label("count"),
        )
        .filter(Alert.created_at >= since)
        .group_by(func.date_trunc("day", Alert.created_at), Alert.severity)
        .all()
    )

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    for row in severity_rows:
        day_str = row.day.strftime("%Y-%m-%d") if hasattr(row.day, "strftime") else str(row.day)
        severity_count[day_str][row.severity] = int(row.count)

    buckets = []
    for i in range(days):
        day = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        count = buckets_map.get(day, 0)

        sevs = severity_count.get(day, {})
        dominant = "low"
        if sevs:
            dominant = min(sevs.keys(), key=lambda s: severity_order.get(s, 99))

        buckets.append({
            "date": day,
            "count": count,
            "dominant_severity": dominant,
        })

    return {
        "data": {"buckets": buckets},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/trends/stats")
def get_trend_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since_7d = datetime.now(timezone.utc) - timedelta(days=7)
    since_14d = datetime.now(timezone.utc) - timedelta(days=14)

    total_7d = (
        db.query(func.count(Alert.id))
        .filter(Alert.created_at >= since_7d)
        .scalar() or 0
    )
    total_14d = (
        db.query(func.count(Alert.id))
        .filter(Alert.created_at >= since_14d, Alert.created_at < since_7d)
        .scalar() or 0
    )

    avg_daily = round(total_7d / 7, 1)

    top_type_row = (
        db.query(Alert.attack_type, func.count(Alert.id).label("count"))
        .filter(Alert.created_at >= since_7d, Alert.attack_type.isnot(None))
        .group_by(Alert.attack_type)
        .order_by(func.count(Alert.id).desc())
        .first()
    )
    top_attack = top_type_row[0] if top_type_row else "None"

    pct_change = 0
    if total_14d > 0:
        pct_change = round(((total_7d - total_14d) / total_14d) * 100, 1)

    sign = "+" if pct_change >= 0 else ""
    pct_str = f"{sign}{pct_change}%"

    return {
        "data": {
            "avg_daily": avg_daily,
            "peak_hour": "14:00",
            "top_attack": top_attack,
            "pct_change": pct_str,
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/trends/breakdown")
def get_trend_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Alert.attack_type,
            func.count(Alert.id).label("count"),
        )
        .filter(Alert.attack_type.isnot(None))
        .group_by(Alert.attack_type)
        .order_by(func.count(Alert.id).desc())
        .all()
    )

    return {
        "data": {
            "breakdown": [
                {"type": row.attack_type, "count": int(row.count)}
                for row in rows
            ],
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
