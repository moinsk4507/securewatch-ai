"""
One-time cleanup script. Run manually once before the live demo
to clear old seeded alerts and start with a clean dashboard.

Usage:
    python clear_demo_alerts.py
or
    python backend/clear_demo_alerts.py
"""

from models.database import SessionLocal
from models.alert import Alert


def main() -> None:
    db = SessionLocal()
    try:
        count = db.query(Alert).delete()
        db.commit()
        print(f"Cleared {count} old alerts. Dashboard will now show only live-generated alerts.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
