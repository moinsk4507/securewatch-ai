from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func

from middleware.auth_middleware import get_current_user
from models.alert import Alert
from models.database import get_db
from models.user import User

router = APIRouter(tags=["geo"])

logger = logging.getLogger(__name__)

# NOTE: Kept for reference only. GeoMap responses are now derived from real Alert rows.
GEO_DATA = [
    {"country": "Russia", "ip": "185.220.101.7", "lat": 55.75, "lng": 37.62, "attack_type": "Brute Force", "severity": "critical", "hits": 89},
    {"country": "China", "ip": "103.22.18.44", "lat": 39.91, "lng": 116.39, "attack_type": "Port Scan", "severity": "high", "hits": 67},
    {"country": "Iran", "ip": "46.182.21.100", "lat": 35.69, "lng": 51.42, "attack_type": "DDoS", "severity": "high", "hits": 34},
    {"country": "North Korea", "ip": "175.45.176.1", "lat": 39.03, "lng": 125.75, "attack_type": "APT", "severity": "medium", "hits": 28},
    {"country": "Nigeria", "ip": "196.207.7.16", "lat": 6.36, "lng": 3.38, "attack_type": "Phishing", "severity": "low", "hits": 19},
    {"country": "Brazil", "ip": "200.244.178.1", "lat": -23.55, "lng": -46.63, "attack_type": "Anomaly", "severity": "low", "hits": 12},
]

TOP_IPS = [
    {"ip": "192.168.1.44", "count": 247, "attack_type": "Brute Force", "risk_score": 95},
    {"ip": "10.0.0.182", "count": 189, "attack_type": "Port Scan", "risk_score": 75},
    {"ip": "203.88.12.5", "count": 94, "attack_type": "DDoS", "risk_score": 38},
    {"ip": "185.220.101.7", "count": 41, "attack_type": "Tor Node", "risk_score": 16},
]

# Country => (approx lat, lng)
COUNTRY_LAT_LNG: dict[str, tuple[float, float]] = {
    "Russia": (55.75, 37.62),
    "China": (39.91, 116.39),
    "Iran": (35.69, 51.42),
    "North Korea": (39.03, 125.75),
    "Nigeria": (6.36, 3.38),
    "Brazil": (-23.55, -46.63),
    # Added for variety beyond the original fixed 6:
    "USA": (37.09, -95.71),
    "United States": (37.09, -95.71),
    "Germany": (51.16, 10.45),
}


def _most_common_from_counter(counter: dict[str, int]) -> str | None:
    if not counter:
        return None
    return max(counter.items(), key=lambda kv: kv[1])[0]


@router.get("/geo")
def get_geo(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    # Only mappable countries (known lat/lng) will appear in attacks[].
    # Alerts with null/missing country are excluded from geo aggregation.
    country_counts = (
        db.query(Alert.country, func.count(Alert.id))
        .filter(Alert.country.isnot(None))
        .group_by(Alert.country)
        .all()
    )

    if not country_counts:
        return {
            "data": {"attacks": [], "total_countries": 0},
            "message": "ok",
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # Build counts + track which countries exist with real alerts.
    counts_by_country: dict[str, int] = {c: int(cnt) for (c, cnt) in country_counts if c}

    # Most common attack_type per country.
    attack_type_rows = (
        db.query(Alert.country, Alert.attack_type, func.count(Alert.id))
        .filter(Alert.country.isnot(None), Alert.attack_type.isnot(None))
        .group_by(Alert.country, Alert.attack_type)
        .all()
    )
    attack_type_counter: dict[str, dict[str, int]] = {}
    for c, at, cnt in attack_type_rows:
        if not c or not at:
            continue
        attack_type_counter.setdefault(c, {})
        attack_type_counter[c][at] = int(cnt)

    # Most common severity per country.
    severity_rows = (
        db.query(Alert.country, Alert.severity, func.count(Alert.id))
        .filter(Alert.country.isnot(None), Alert.severity.isnot(None))
        .group_by(Alert.country, Alert.severity)
        .all()
    )
    severity_counter: dict[str, dict[str, int]] = {}
    for c, sev, cnt in severity_rows:
        if not c or not sev:
            continue
        severity_counter.setdefault(c, {})
        severity_counter[c][sev] = int(cnt)

    attacks = []
    for country, hits in counts_by_country.items():
        coords = COUNTRY_LAT_LNG.get(country)
        if not coords:
            logger.warning("Skipping unknown country in geo map: %s", country)
            continue

        common_attack_type = _most_common_from_counter(attack_type_counter.get(country, {})) or "Unknown"
        common_severity = _most_common_from_counter(severity_counter.get(country, {})) or "low"
        lat, lng = coords

        attacks.append(
            {
                "country": country,
                # front-end expects lat/lng; we don't have per-country ip now.
                "lat": lat,
                "lng": lng,
                "attack_type": common_attack_type,
                "severity": common_severity,
                "hits": hits,
            }
        )

    # total_countries counts distinct Alert.country values with real alerts (even if not mappable).
    total_countries = len(counts_by_country)
    return {
        "data": {"attacks": attacks, "total_countries": total_countries},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/geo/stats")
def get_geo_stats(
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    # Distinct countries/ips should be based on real rows.
    countries_q = (
        db.query(func.count(func.distinct(Alert.country)))
        .filter(Alert.country.isnot(None))
        .scalar()
    )
    active_ips_q = (
        db.query(func.count(func.distinct(Alert.source_ip)))
        .filter(Alert.source_ip.isnot(None))
        .scalar()
    )

    attack_type_lower = func.lower(func.coalesce(Alert.attack_type, ""))
    tor_exits_q = (
        db.query(func.count(Alert.id))
        .filter(
            Alert.attack_type.isnot(None),
            (attack_type_lower.like("%tor%") | attack_type_lower.like("%proxy%")),
        )
        .scalar()
    )
    botnets_q = (
        db.query(func.count(Alert.id))
        .filter(Alert.attack_type == "DDoS Pattern")
        .scalar()
    )

    return {
        "data": {
            "countries": int(countries_q or 0),
            "active_ips": int(active_ips_q or 0),
            "tor_exits": int(tor_exits_q or 0),
            "botnets": int(botnets_q or 0),
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/top-ips")
def get_top_ips(
    limit: int = Query(4, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db),
):
    ip_counts_rows = (
        db.query(Alert.source_ip, func.count(Alert.id))
        .filter(Alert.source_ip.isnot(None))
        .group_by(Alert.source_ip)
        .order_by(func.count(Alert.id).desc())
        .limit(limit)
        .all()
    )

    if not ip_counts_rows:
        return {
            "data": {"ips": []},
            "message": "ok",
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    ip_counts: dict[str, int] = {ip: int(cnt) for (ip, cnt) in ip_counts_rows if ip}

    # Most common attack_type per source_ip (among existing alerts for that ip).
    ip_list = list(ip_counts.keys())
    attack_type_rows = (
        db.query(Alert.source_ip, Alert.attack_type, func.count(Alert.id))
        .filter(Alert.source_ip.isnot(None), Alert.source_ip.in_(ip_list))
        .group_by(Alert.source_ip, Alert.attack_type)
        .all()
    )
    attack_type_counter: dict[str, dict[str, int]] = {}
    for ip, at, cnt in attack_type_rows:
        if not ip or not at:
            continue
        attack_type_counter.setdefault(ip, {})
        attack_type_counter[ip][at] = int(cnt)

    # Risk heuristic:
    # - scale with alert count, cap at 100 for a UI-friendly bounded score.
    # - chosen to be simple + monotonic with count.
    def risk_score(count: int) -> int:
        return min(count * 2, 100)

    ips = []
    for ip, count in ip_counts.items():
        common_attack_type = _most_common_from_counter(attack_type_counter.get(ip, {})) or "Unknown"
        ips.append(
            {
                "ip": ip,
                "count": count,
                "attack_type": common_attack_type,
                "risk_score": risk_score(count),
            }
        )

    # Ensure stable ordering by count desc (db query already does, but keep deterministic).
    ips.sort(key=lambda x: x["count"], reverse=True)

    return {
        "data": {"ips": ips},
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
