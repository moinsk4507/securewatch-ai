from datetime import datetime, timedelta, timezone
import random

from models import Alert, Rule, Setting, User
from models.database import SessionLocal
from services.jwt_service import hash_password


DEFAULT_RULES = [
    ("AUTH-001", "SSH Brute Force Burst", "failed_auth_ratio > 0.7 AND login_count_per_minute > 20", "critical", "create_alert"),
    ("AUTH-002", "Slow Brute Force", "failed_auth_ratio > 0.4 AND login_count_per_minute BETWEEN 3 AND 10", "high", "create_alert"),
    ("NET-001", "Port Scan Recon", "unique_ports_per_min > 25 OR ports_scanned > 40", "high", "create_alert"),
    ("NET-002", "DDoS Request Surge", "request_rate_ratio > 8", "critical", "create_alert"),
    ("GEO-001", "Geographic Anomaly", "geo_distance_from_baseline > 3500", "medium", "create_alert"),
    ("PRIV-001", "Privilege Escalation", "sudo_fail_count >= 3", "critical", "create_alert"),
    ("DATA-001", "Large Transfer", "bytes_transferred > 500000000", "medium", "create_alert"),
    ("RISK-001", "High Risk Country", "country_risk_score >= 0.8", "high", "create_alert"),
]

DEFAULT_SETTINGS = [
    ("app.name", "SecureWatch AI", "string", "general", "Application display name"),
    ("notifications.email_enabled", "true", "boolean", "notifications", "Email alert notifications"),
    ("ml.contamination", "0.05", "float", "ml", "Isolation Forest contamination"),
    ("ml.alert_threshold", "-0.70", "float", "ml", "Anomaly alert threshold"),
    ("security.session_hours", "8", "integer", "security", "Default session duration"),
]

ATTACKS = ["Brute Force SSH", "Port Scan / Recon", "DDoS Pattern", "Slow Brute Force", "Geographic Anomaly", "Privilege Escalation"]
COUNTRIES = [("Russia", "Moscow"), ("China", "Beijing"), ("United States", "Ashburn"), ("Germany", "Frankfurt"), ("Brazil", "Sao Paulo")]


def seed_database():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@securewatch.local").first()
        if not admin:
            admin = User(email="admin@securewatch.local", password=hash_password("SecureWatch123!"), name="Admin User", role="admin")
            db.add(admin)
            db.flush()
        if db.query(Rule).count() == 0:
            db.add_all([Rule(id=rid, name=name, condition=condition, severity=severity, action=action, created_by=admin.id) for rid, name, condition, severity, action in DEFAULT_RULES])
        if db.query(Alert).count() == 0:
            now = datetime.now(timezone.utc)
            alerts = []
            for index in range(25):
                country, city = random.choice(COUNTRIES)
                attack = random.choice(ATTACKS)
                severity = random.choice(["critical", "high", "medium", "low"])
                alerts.append(
                    Alert(
                        severity=severity,
                        name=f"{attack} detected",
                        source_ip=f"185.220.{100 + index % 30}.{7 + index}",
                        ml_classification=attack,
                        if_score=round(random.uniform(-0.95, -0.42), 3),
                        rf_confidence=round(random.uniform(0.74, 0.98), 3),
                        status=random.choice(["open", "investigating", "resolved"]),
                        country=country,
                        city=city,
                        attack_type=attack,
                        raw_features={"login_count_per_minute": random.randint(1, 80)},
                        created_at=now - timedelta(hours=index),
                    )
                )
            db.add_all(alerts)
        for key, value, value_type, category, description in DEFAULT_SETTINGS:
            if not db.query(Setting).filter(Setting.key == key).first():
                db.add(Setting(key=key, value=value, value_type=value_type, category=category, description=description, updated_by=admin.id))
        db.commit()
    finally:
        db.close()
