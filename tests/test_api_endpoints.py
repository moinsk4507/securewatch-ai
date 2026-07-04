def test_stats_with_auth(client, auth_headers):
    resp = client.get("/api/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") in ("success", "ok")
    assert "data" in data
    assert "threats_detected" in data["data"]


def test_stats_without_auth(client):
    resp = client.get("/api/stats")
    assert resp.status_code in (401, 403)


def test_alerts_list(client, auth_headers):
    resp = client.get("/api/alerts", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "data" in data
    assert isinstance(data["data"], list)


def test_alerts_filter_by_severity(client, auth_headers):
    resp = client.get(
        "/api/alerts",
        headers=auth_headers,
        params={"severity": "critical"},
    )
    assert resp.status_code == 200
    data = resp.json()
    for a in data.get("data", []):
        assert a.get("severity") == "critical"


def test_alert_status_update(client, auth_headers):
    # Create deterministic selection: take first alert from per_page=1
    list_resp = client.get("/api/alerts", headers=auth_headers, params={"per_page": 1})
    assert list_resp.status_code == 200
    alerts = list_resp.json().get("data", [])
    assert alerts, "Expected at least one seeded alert"

    alert_id = alerts[0]["id"]
    update_resp = client.post(
        f"/api/alerts/{alert_id}/status",
        headers=auth_headers,
        json={"status": "resolved"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated.get("status") == "success"
    assert updated["data"]["id"] == alert_id
    assert updated["data"]["status"] == "resolved"


def test_rules_list(client, auth_headers):
    resp = client.get("/api/rules", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "data" in data
    assert "rules" in data["data"]
    assert isinstance(data["data"]["rules"], list)


def test_rules_create(client, auth_headers):
    resp = client.post(
        "/api/rules",
        headers=auth_headers,
        json={
            "name": "Test Rule",
            "condition": "failed_auth_ratio > 0.9",
            "severity": "high",
            "action": "Alert + Log",
            "description": "desc",
            "enabled": True,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("status") == "success"
    assert "data" in data
    assert data["data"]["name"] == "Test Rule"


def test_rules_toggle(client, auth_headers):
    # Get rules, toggle the first one
    list_resp = client.get("/api/rules", headers=auth_headers)
    assert list_resp.status_code == 200
    rules = list_resp.json()["data"]["rules"]
    assert rules

    rule = rules[0]
    new_enabled = not bool(rule.get("enabled", True))

    patch_resp = client.patch(
        f"/api/rules/{rule['id']}",
        headers=auth_headers,
        json={"enabled": new_enabled},
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["data"]["enabled"] == new_enabled


def test_settings_get(client, auth_headers):
    resp = client.get("/api/settings", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "success"
    assert "data" in data
    assert isinstance(data["data"], dict)
    # ensure at least one default key exists
    assert "system_name" in data["data"]


def test_firewall_block_ip(client, auth_headers):
    resp = client.post(
        "/api/firewall/block",
        headers=auth_headers,
        json={"ip": "1.2.3.4", "reason": "test block"},
    )
    assert resp.status_code in (201, 409)
    # 201 => created; 409 => already blocked
    if resp.status_code == 201:
        data = resp.json()
        assert data["status"] == "success"
        assert data["data"]["ip_address"] == "1.2.3.4"
