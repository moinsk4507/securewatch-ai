import pytest
from fastapi.testclient import TestClient

from app import app
from models.alert import Alert
from models.database import SessionLocal


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_token(client: TestClient) -> str:
    # Seeded by backend/seed.py
    payload = {"email": "admin@securewatch.local", "password": "Admin@123456"}
    resp = client.post("/api/auth/login", json=payload)
    resp.raise_for_status()
    data = resp.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def seeded_alert():
    """Ensure at least one Alert row exists for tests that need it.

    Inserts a synthetic alert if the table is empty, and removes it (only
    the one we added) after the entire test session finishes.
    """
    db = SessionLocal()
    inserted_id = None
    try:
        if db.query(Alert).count() == 0:
            alert = Alert(
                severity="high",
                name="Test Brute Force (seeded by conftest)",
                source_ip="10.99.99.1",
                destination_ip="10.0.0.1",
                ml_classification="Brute Force SSH",
                if_score=-0.85,
                rf_confidence=0.92,
                status="open",
                country="Test",
                city="TestCity",
                attack_type="Brute Force SSH",
                raw_log_line="conftest seed alert",
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            inserted_id = alert.id
        yield
    finally:
        if inserted_id is not None:
            db.query(Alert).filter(Alert.id == inserted_id).delete()
            db.commit()
        db.close()

