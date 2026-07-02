from __future__ import annotations

"""Seed SecureWatch AI PostgreSQL with a default admin user, rules, and alerts.

Idempotent:
- Admin user: inserted only if missing.
- Rules: inserted only if rules table is empty.
- Alerts: inserted only if alerts table is empty.

Run:
    python backend/seed.py
or
    python seed.py (if invoked from backend/)
"""

from datetime import datetime, timedelta, timezone
import random

import numpy as np

from models import Alert, Rule, Setting, User
from models.database import SessionLocal
from services.jwt_service import hash_password


FEATURE_NAMES = [
    "login_count_per_minute",
    "ports_scanned",
    "request_rate_ratio",
    "geo_distance_from_baseline",
    "time_of_day_score",
    "failed_auth_ratio",
    "sudo_fail_count",
    "unique_ports_per_min",
    "bytes_transferred",
    "connection_duration",
    "user_agent_entropy",
    "country_risk_score",
]


DEFAULT_RULES = [
    ("BF-001", "Brute Force SSH", "failed_auth_ratio > 0.70 AND login_count_per_minute > 20", "critical", "create_alert"),
    ("PS-002", "Port Scan / Recon", "unique_ports_per_min > 25 OR ports_scanned > 40", "high", "create_alert"),
    ("DD-003", "DDoS Pattern", "request_rate_ratio > 8", "critical", "create_alert"),
    ("GE-004", "Geographic Anomaly", "geo_distance_from_baseline > 3500", "medium", "create_alert"),
    ("ML-005", "ML Isolation Forest Anomaly", "if_score < -0.70", "high", "create_alert"),
    ("SB-006", "Slow Brute Force", "failed_auth_ratio > 0.40 AND login_count_per_minute BETWEEN 3 AND 10", "high", "create_alert"),
    ("TN-007", "Privilege Escalation", "sudo_fail_count >= 3", "critical", "create_alert"),
    ("PE-008", "High Risk Country", "country_risk_score >= 0.80", "high", "create_alert"),
]


DEFAULT_ATTACKS = [
    ("Brute Force SSH", "Brute Force SSH"),
    ("Port Scan / Recon", "Port Scan / Recon"),
    ("DDoS Pattern", "DDoS Pattern"),
    ("Slow Brute Force", "Slow Brute Force"),
    ("Geographic Anomaly", "Geographic Anomaly"),
    ("Privilege Escalation", "Privilege Escalation"),
]


# Alerts seed mix per task
ALERT_CLASSES = [
    "Brute Force SSH",
    "Port Scan / Recon",
    "DDoS Pattern",
    "Slow Brute Force",
    "Geographic Anomaly",
    "Privilege Escalation",
    "High Risk Country",
]


def _random_ip(index: int) -> str:
    # Stable but varied in last octets.
    return f"185.220.{100 + (index % 30)}.{7 + index}"


def _random_country(index: int) -> tuple[str, str]:
    countries = [
        ("Russia", "Moscow"),
        ("China", "Beijing"),
        ("United States", "Ashburn"),
        ("Germany", "Frankfurt"),
        ("Brazil", "Sao Paulo"),
        ("India", "Mumbai"),
        ("Japan", "Tokyo"),
    ]
    return countries[index % len(countries)]


def _feature_vector_for_attack(ml_classification: str, idx: int) -> dict:
    # Realistic ranges for feature values; later ML pipeline generation is independent.
    # Clip only to keep JSON values reasonable.
    rng = random.Random(1000 + idx)

    # Defaults for "normal-ish" base
    fv = {
        "login_count_per_minute": 0.0,
        "ports_scanned": 0.0,
        "request_rate_ratio": 0.0,
        "geo_distance_from_baseline": 0.0,
        "time_of_day_score": rng.uniform(0, 1),
        "failed_auth_ratio": 0.0,
        "sudo_fail_count": 0.0,
        "unique_ports_per_min": 0.0,
        "bytes_transferred": 0.0,
        "connection_duration": 0.0,
        "user_agent_entropy": 0.0,
        "country_risk_score": rng.uniform(0.05, 0.6),
    }

    if ml_classification == "Brute Force SSH":
        fv.update(
            login_count_per_minute=rng.uniform(180, 320),
            failed_auth_ratio=rng.uniform(0.85, 1.0),
            ports_scanned=rng.uniform(0, 10),
            unique_ports_per_min=rng.uniform(0, 3),
            connection_duration=rng.uniform(5, 25),
            bytes_transferred=rng.uniform(5e6, 2e7),
            user_agent_entropy=rng.uniform(0.2, 0.8),
            country_risk_score=min(1.0, fv["country_risk_score"] + rng.uniform(0.2, 0.45)),
        )
    elif ml_classification == "Port Scan / Recon":
        fv.update(
            ports_scanned=rng.uniform(120, 450),
            unique_ports_per_min=rng.uniform(20, 120),
            request_rate_ratio=rng.uniform(1.0, 3.0),
            login_count_per_minute=rng.uniform(0, 30),
            failed_auth_ratio=rng.uniform(0.05, 0.25),
            connection_duration=rng.uniform(0.5, 8),
            bytes_transferred=rng.uniform(2e6, 1.2e7),
            user_agent_entropy=rng.uniform(0.2, 0.9),
            geo_distance_from_baseline=rng.uniform(300, 2200),
        )
    elif ml_classification == "DDoS Pattern":
        fv.update(
            request_rate_ratio=rng.uniform(9.0, 18.0),
            ports_scanned=rng.uniform(0, 30),
            unique_ports_per_min=rng.uniform(0, 5),
            login_count_per_minute=rng.uniform(0, 40),
            failed_auth_ratio=rng.uniform(0.05, 0.3),
            connection_duration=rng.uniform(0.2, 2.5),
            bytes_transferred=rng.uniform(4e8, 9e8),
            user_agent_entropy=rng.uniform(0.05, 0.4),
            geo_distance_from_baseline=rng.uniform(0, 800),
        )
    elif ml_classification == "Slow Brute Force":
        fv.update(
            login_count_per_minute=rng.uniform(3, 12),
            failed_auth_ratio=rng.uniform(0.45, 0.75),
            ports_scanned=rng.uniform(0, 8),
            unique_ports_per_min=rng.uniform(0, 4),
            connection_duration=rng.uniform(10, 45),
            bytes_transferred=rng.uniform(5e6, 2.5e7),
            user_agent_entropy=rng.uniform(0.2, 0.9),
            country_risk_score=min(1.0, fv["country_risk_score"] + rng.uniform(0.15, 0.35)),
        )
    elif ml_classification == "Geographic Anomaly":
        fv.update(
            geo_distance_from_baseline=rng.uniform(4000, 12000),
            request_rate_ratio=rng.uniform(0.8, 3.0),
            login_count_per_minute=rng.uniform(0, 60),
            failed_auth_ratio=rng.uniform(0.05, 0.5),
            ports_scanned=rng.uniform(0, 60),
            unique_ports_per_min=rng.uniform(0, 20),
            bytes_transferred=rng.uniform(1e6, 7e7),
            connection_duration=rng.uniform(1, 20),
            user_agent_entropy=rng.uniform(0.2, 0.95),
            country_risk_score=min(1.0, fv["country_risk_score"] + rng.uniform(0.2, 0.45)),
        )
    elif ml_classification == "Privilege Escalation":
        fv.update(
            sudo_fail_count=rng.uniform(3, 12),
            login_count_per_minute=rng.uniform(10, 80),
            failed_auth_ratio=rng.uniform(0.55, 0.95),
            ports_scanned=rng.uniform(0, 30),
            unique_ports_per_min=rng.uniform(0, 10),
            connection_duration=rng.uniform(2, 40),
            bytes_transferred=rng.uniform(2e6, 6e7),
            user_agent_entropy=rng.uniform(0.3, 0.95),
            country_risk_score=min(1.0, fv["country_risk_score"] + rng.uniform(0.15, 0.4)),
        )
    else:
        # Fallback
        fv.update(login_count_per_minute=rng.uniform(50, 180), failed_auth_ratio=rng.uniform(0.3, 0.8))

    # Add index-based jitter
    fv["user_agent_entropy"] = float(np.clip(fv["user_agent_entropy"] + rng.uniform(-0.05, 0.05), 0, 1))
    fv["time_of_day_score"] = float(np.clip(fv["time_of_day_score"] + rng.uniform(-0.1, 0.1), 0, 1))

    return {k: float(v) for k, v in fv.items()}


def seed_database() -> None:
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@securewatch.local").first()
        if not admin:
            admin = User(
                email="admin@securewatch.local",
                password=hash_password("Admin@123456"),
                name="Admin User",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.flush()

        # Seed 8 rules if table empty
        rules_count = db.query(Rule).count()
        if rules_count == 0:
            for rid, name, condition, severity, action in DEFAULT_RULES:
                enabled = rid != "PE-008"  # enabled False for last rule
                db.add(
                    Rule(
                        id=rid,
                        name=name,
                        condition=condition,
                        severity=severity,
                        action=action,
                        enabled=enabled,
                        hits_today={
                            "BF-001": 247,
                            "PS-002": 189,
                            "DD-003": 94,
                            "GE-004": 41,
                            "ML-005": 312,
                            "SB-006": 28,
                            "TN-007": 41,
                            "PE-008": 7,
                        }[rid],
                        hits_total=({
                            "BF-001": 2470,
                            "PS-002": 1890,
                            "DD-003": 940,
                            "GE-004": 410,
                            "ML-005": 3120,
                            "SB-006": 280,
                            "TN-007": 410,
                            "PE-008": 70,
                        }[rid]),
                        created_by=admin.id,
                    )
                )
            print("Rules seeded: 8")
        else:
            print(f"Rules seed skipped (existing rules: {rules_count})")

        # Seed 25 alerts if table empty
        alerts_count = db.query(Alert).count()
        if alerts_count == 0:
            now = datetime.now(timezone.utc)

            # Mix: critical=8 high=8 medium=5 low=4
            severity_mix = (
                ["critical"] * 8
                + ["high"] * 8
                + ["medium"] * 5
                + ["low"] * 4
            )
            random.shuffle(severity_mix)

            # Status mix: open=12 investigating=7 resolved=6
            status_mix = (
                ["open"] * 12
                + ["investigating"] * 7
                + ["resolved"] * 6
            )
            random.shuffle(status_mix)

            ml_classes_cycle = [
                "Brute Force SSH",
                "Port Scan / Recon",
                "DDoS Pattern",
                "Slow Brute Force",
                "Geographic Anomaly",
                "Privilege Escalation",
            ]

            for i in range(25):
                severity = severity_mix[i]
                status = status_mix[i]

                ml_classification = random.choice(ml_classes_cycle)
                country, city = _random_country(i)

                # Timestamps spread over last 24 hours
                created_at = now - timedelta(hours=random.uniform(0, 24), minutes=random.uniform(0, 59))

                # Score ranges that look plausible for the pipeline threshold -0.70
                if severity in ("critical", "high"):
                    if_score = float(round(random.uniform(-0.95, -0.76), 3))
                elif severity == "medium":
                    if_score = float(round(random.uniform(-0.75, -0.45), 3))
                else:
                    if_score = float(round(random.uniform(-0.44, 0.2), 3))

                rf_confidence = float(round(random.uniform(0.6, 0.99), 3))

                raw_features = _feature_vector_for_attack(ml_classification, i)

                db.add(
                    Alert(
                        severity=severity,
                        name=f"{ml_classification} ({severity})",
                        source_ip=_random_ip(i),
                        destination_ip=f"10.0.{i % 16}.{20 + i % 50}",
                        ml_classification=ml_classification,
                        if_score=if_score,
                        rf_confidence=rf_confidence,
                        status=status,
                        country=country,
                        city=city,
                        attack_type=ml_classification,
                        raw_features=raw_features,
                        raw_log_line=f"ML anomaly: class={ml_classification}; if_score={if_score}; ip={_random_ip(i)}",
                        created_at=created_at,
                    )
                )
            print("Alerts seeded: 25")
        else:
            print(f"Alerts seed skipped (existing alerts: {alerts_count})")

        # Seed essential settings (optional; keep existing behavior minimally)
        default_settings = [
            ("app.name", "SecureWatch AI", "string", "general", "Application display name"),
            ("notifications.email_enabled", "true", "boolean", "notifications", "Email alert notifications"),
            ("ml.contamination", "0.05", "float", "ml", "Isolation Forest contamination"),
            ("ml.alert_threshold", "-0.70", "float", "ml", "Anomaly alert threshold"),
            ("security.session_hours", "8", "integer", "security", "Default session duration"),
        ]
        for key, value, value_type, category, description in default_settings:
            if not db.query(Setting).filter(Setting.key == key).first():
                db.add(
                    Setting(
                        key=key,
                        value=value,
                        value_type=value_type,
                        category=category,
                        description=description,
                        updated_by=admin.id,
                    )
                )

        db.commit()

        # Print success for each item seeded (idempotent behavior prints both seeded or skipped)
        print("Seed success:")
        print("- admin user: present")
        if rules_count == 0:
            for rid, *_ in DEFAULT_RULES:
                print(f"- rule seeded: {rid}")
        else:
            print("- rules already exist")
        if alerts_count == 0:
            print("- 25 alerts seeded")
        else:
            print("- alerts already exist")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

