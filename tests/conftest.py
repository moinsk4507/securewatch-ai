import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app import app


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
