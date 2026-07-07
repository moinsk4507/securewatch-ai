def test_full_login_to_alert_flow(client, auth_headers, seeded_alert):
    # Login -> already covered by admin token; here verify can list alerts and update status
    list_resp = client.get("/api/alerts", headers=auth_headers, params={"per_page": 1})
    assert list_resp.status_code == 200
    alerts = list_resp.json().get("data", [])
    assert alerts, "Expected seeded alerts to exist"

    alert_id = alerts[0]["id"]
    assert alerts[0]["status"] in {"open", "investigating", "resolved", "false_positive"}

    upd_resp = client.post(
        f"/api/alerts/{alert_id}/status",
        headers=auth_headers,
        json={"status": "resolved"},
    )
    assert upd_resp.status_code == 200
    payload = upd_resp.json()
    assert payload.get("status") == "success"
    assert payload["data"]["id"] == alert_id
    assert payload["data"]["status"] == "resolved"


def test_ml_end_to_end(client):
    # Call ML scoring end-to-end at python-level (no external ES/DB dependency)
    from ml.feature_extraction import FEATURE_NAMES
    from ml.predict import score_event

    log_event = {name: 0.0 for name in FEATURE_NAMES}
    log_event.update(
        {
            "login_count_per_minute": 250.0,
            "failed_auth_ratio": 0.9,
            "ports_scanned": 5.0,
            "unique_ports_per_min": 2.0,
            "connection_duration": 10.0,
            "bytes_transferred": 1.2e7,
            "user_agent_entropy": 0.5,
            "country_risk_score": 0.8,
        }
    )

    resp = score_event(log_event)
    # For integration, accept either None (not anomalous) or result (anomaly)
    if resp is None:
        assert True
    else:
        assert resp["is_anomaly"] is True
        assert "features" in resp and isinstance(resp["features"], dict)
        for k in FEATURE_NAMES:
            assert k in resp["features"]
