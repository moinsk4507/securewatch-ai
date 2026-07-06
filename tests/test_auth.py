import uuid
import pytest


def test_login_success(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@securewatch.local", "password": "Admin@123456"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert "expires_in" in data
    assert "user" in data and isinstance(data["user"], dict)


def test_login_wrong_password(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@securewatch.local", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401


def test_login_missing_fields(client):
    resp = client.post("/api/auth/login", json={"email": "admin@securewatch.local"})
    assert resp.status_code == 422

    resp2 = client.post("/api/auth/login", json={"password": "Admin@123456"})
    assert resp2.status_code == 422 


def test_register_success(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": f"newuser_{uuid.uuid4().hex[:6]}@securewatch.local",
            "password": "NewUser@123456",
            "firstName": "New",
            "lastName": "User",
            "role": "analyst",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert "user" in data and isinstance(data["user"], dict)


def test_register_duplicate_email(client):
    dup_email = f"dupuser_{uuid.uuid4().hex[:6]}@securewatch.local"

    # First register
    resp1 = client.post(
        "/api/auth/register",
        json={
            "email": dup_email,
            "password": "DupUser@123456",
            "firstName": "Dup",
            "lastName": "User",
            "role": "analyst",
        },
    )
    assert resp1.status_code == 201

    # Second register with SAME email should conflict
    resp2 = client.post(
        "/api/auth/register",
        json={
            "email": dup_email,
            "password": "DupUser@123456",
            "firstName": "Dup",
            "lastName": "User",
            "role": "analyst",
        },
    )
    assert resp2.status_code == 409


def test_register_weak_password(client):
    # Too short + lacks complexity
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "weakpw_test_auth_1@securewatch.local",
            "password": "weakpw",
            "firstName": "Weak",
            "lastName": "Pw",
            "role": "analyst",
        },
    )
    assert resp.status_code == 400


def test_me_with_valid_token(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "email" in data and data["email"] == "admin@securewatch.local"


def test_me_with_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code in (401, 403)


def test_me_with_invalid_token(client):
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token"})
    assert resp.status_code in (401, 403)
