from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from middleware.auth_middleware import get_current_user
from models.user import User


router = APIRouter(tags=["geo"])


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


@router.get("/geo")
def get_geo(
    current_user: User = Depends(get_current_user),
):
    return {
        "data": {
            "attacks": GEO_DATA,
            "total_countries": 18,
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/geo/stats")
def get_geo_stats(
    current_user: User = Depends(get_current_user),
):
    return {
        "data": {
            "countries": 18,
            "active_ips": 247,
            "tor_exits": 4,
            "botnets": 3,
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/top-ips")
def get_top_ips(
    limit: int = Query(4, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return {
        "data": {
            "ips": TOP_IPS[:limit],
        },
        "message": "ok",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
