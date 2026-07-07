PS C:\securewatch-ai> backend\venv\Scripts\python ml\generate_training_data.py

> > Generated training data:

- data/normal_logs.csv (50000 rows)
- data/labelled_attacks.csv (600 rows)
  PS C:\securewatch-ai> backend\venv\Scripts\python ml\train_isolation_forest.py
  > > C:\securewatch-ai\ml\train_isolation_forest.py:5: DeprecationWarning:
  > > Pyarrow will become a required dependency of pandas in the next major release of pandas (pandas 3.0),
  > > (to allow more performant data types, such as the Arrow string type, and better interoperability with other libraries)
  > > but was not found to be installed on your system.
  > > If this would cause problems for you,
  > > please provide us feedback at https://github.com/pandas-dev/pandas/issues/54466
  import pandas as pd
  IsolationForest training complete
- anomaly_rate: 0.0500
- saved: ml/model.pkl
  PS C:\securewatch-ai> backend\venv\Scripts\python ml\train_rf_classifier.py

  > > C:\securewatch-ai\ml\train_rf_classifier.py:5: DeprecationWarning:
  > > Pyarrow will become a required dependency of pandas in the next major release of pandas (pandas 3.0),
  > > (to allow more performant data types, such as the Arrow string type, and better interoperability with other libraries)
  > > but was not found to be installed on your system.
  > > If this would cause problems for you,
  > > please provide us feedback at https://github.com/pandas-dev/pandas/issues/54466

  import pandas as pd
  RandomForest training complete

- accuracy: 1.0000
- classification_report:
  precision recall f1-score support

       Brute Force SSH       1.00      1.00      1.00        21

  Port Scan / Recon 1.00 1.00 1.00 17
  DDoS Pattern 1.00 1.00 1.00 23
  Slow Brute Force 1.00 1.00 1.00 18
  Geographic Anomaly 1.00 1.00 1.00 24
  Privilege Escalation 1.00 1.00 1.00 17

              accuracy                           1.00       120
             macro avg       1.00      1.00      1.00       120
          weighted avg       1.00      1.00      1.00       120

- saved: ml/classifier.pkl
  PS C:\securewatch-ai> cd C:\securewatch-ai
  > > backend\venv\Scripts\python
  > > Python 3.11.7 (tags/v3.11.7:fa7a6f2, Dec 4 2023, 19:24:49) [MSC v.1937 64 bit (AMD64)] on win32
  > > Type "help", "copyright", "credits" or "license" for more information.
  > > Ctrl click to launch VS Code Native REPL
  > >
  > > > from ml.feature_extraction import extract_features
  > > > from ml.predict import load_models, score_event
  > > >
  > > > load_models()
  > > >
  > > > event = {
  > > > ... "login_count_per_minute": 250.0,
  > > > ... "failed_auth_ratio": 0.9,
  > > > ... "ports_scanned": 5.0,
  > > > ... "unique_ports_per_min": 2.0,
  > > > ... "connection_duration": 10.0,
  > > > ... "bytes_transferred": 1.2e7,
  > > > ... "user_agent_entropy": 0.5,
  > > > ... "country_risk_score": 0.8,
  > > > ... }
  > > >
  > > > result = score_event(event)
  > > > print(result)
  > > > None
  > > > exit()
  > > > PS C:\securewatch-ai> backend\venv\Scripts\pytest tests\ -v
  > > > ===================================================================== test session starts =====================================================================
  > > > platform win32 -- Python 3.11.7, pytest-8.1.0, pluggy-1.6.0 -- C:\securewatch-ai\backend\venv\Scripts\python.exe
  > > > cachedir: .pytest_cache
  > > > rootdir: C:\securewatch-ai
  > > > configfile: pytest.ini
  > > > plugins: anyio-4.13.0
  > > > collected 27 items

tests/test_api_endpoints.py::test_stats_with_auth PASSED [ 3%]
tests/test_api_endpoints.py::test_stats_without_auth PASSED [ 7%]
tests/test_api_endpoints.py::test_alerts_list PASSED [ 11%]
tests/test_api_endpoints.py::test_alerts_filter_by_severity PASSED [ 14%]
tests/test_api_endpoints.py::test_alert_status_update FAILED [ 18%]
tests/test_api_endpoints.py::test_rules_list PASSED [ 22%]
tests/test_api_endpoints.py::test_rules_create PASSED [ 25%]
tests/test_api_endpoints.py::test_rules_toggle FAILED [ 29%]
tests/test_api_endpoints.py::test_settings_get PASSED [ 33%]
tests/test_api_endpoints.py::test_firewall_block_ip PASSED [ 37%]
tests/test_auth.py::test_login_success PASSED [ 40%]
tests/test_auth.py::test_login_wrong_password PASSED [ 44%]
tests/test_auth.py::test_login_missing_fields FAILED [ 48%]
tests/test_auth.py::test_register_success FAILED [ 51%]
tests/test_auth.py::test_register_duplicate_email FAILED [ 55%]
tests/test_auth.py::test_register_weak_password PASSED [ 59%]
tests/test_auth.py::test_me_with_valid_token PASSED [ 62%]
tests/test_auth.py::test_me_with_no_token PASSED [ 66%]
tests/test_auth.py::test_me_with_invalid_token PASSED [ 70%]
tests/test_integration.py::test_full_login_to_alert_flow FAILED [ 74%]
tests/test_integration.py::test_ml_end_to_end PASSED [ 77%]
tests/test_ml_pipeline.py::test_feature_extraction_shape PASSED [ 81%]
tests/test_ml_pipeline.py::test_feature_extraction_defaults PASSED [ 85%]
tests/test_ml_pipeline.py::test_score_normal_event_returns_none PASSED [ 88%]
tests/test_ml_pipeline.py::test_score_attack_event_returns_result FAILED [ 92%]
tests/test_ml_pipeline.py::test_rf_classification_returns_valid_class FAILED [ 96%]
tests/test_ml_pipeline.py::test_pipeline_ms_under_500ms FAILED [100%]

========================================================================== FAILURES ===========================================================================
********************************\_\_******************************** test_alert_status_update ********************************\_\_\_********************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>
auth_headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBlYTU4OTllLWU4MGYtNGE4NC04ZWYwLTA5ZTlkOTE1ODJ...zgyOTg3NTE4LCJqdGkiOiJmYjU2NTBjZi03MWU5LTRjMWEtYjU5Ni03ZDQ3NjUxYTAxNTMifQ.-FKCPhOz92Q83TWf0iADyKWDc7mFpHR-c_3Eup6DSpk'}

    def test_alert_status_update(client, auth_headers):
        # Create deterministic selection: take first alert from per_page=1
        list_resp = client.get("/api/alerts", headers=auth_headers, params={"per_page": 1})
        assert list_resp.status_code == 200
        alerts = list_resp.json().get("data", [])
        assert alerts, "Expected at least one seeded alert"

        alert_id = alerts[0]["id"]
        update_resp = client.post(
            f"/api/alerts{alert_id}/status",
            headers=auth_headers,
            json={"status": "resolved"},
        )

>       assert update_resp.status_code == 200
>
> E assert 404 == 200
> E + where 404 = <Response [404 Not Found]>.status_code

tests\test_api_endpoints.py:48: AssertionError
**********************************\_\_********************************** test_rules_toggle **********************************\_\_**********************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>
auth_headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBlYTU4OTllLWU4MGYtNGE4NC04ZWYwLTA5ZTlkOTE1ODJ...zgyOTg3NTE4LCJqdGkiOiJmYjU2NTBjZi03MWU5LTRjMWEtYjU5Ni03ZDQ3NjUxYTAxNTMifQ.-FKCPhOz92Q83TWf0iADyKWDc7mFpHR-c_3Eup6DSpk'}

    def test_rules_toggle(client, auth_headers):
        # Get rules, toggle the first one
        list_resp = client.get("/api/rules", headers=auth_headers)
        assert list_resp.status_code == 200
        rules = list_resp.json()["data"]["rules"]
        assert rules

        rule = rules[0]
        new_enabled = not bool(rule.get("enabled", True))

        patch_resp = client.patch(
            f"/api/rules{rule['id']}",
            headers=auth_headers,
            json={"enabled": new_enabled},
        )

>       assert patch_resp.status_code == 200
>
> E assert 404 == 200
> E + where 404 = <Response [404 Not Found]>.status_code

tests\test_api_endpoints.py:99: AssertionError
********************************\_\_******************************** test_login_missing_fields ********************************\_\_********************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>

    def test_login_missing_fields(client):
        resp = client.post("/api/auth/login", json={"email": "admin@securewatch.local"})
        assert resp.status_code == 422

        resp2 = client.post("/api/auth/login", json={"password": "Admin@123456"})

>       assert resp2.status_code == 400
>
> E assert 422 == 400
> E + where 422 = <Response [422 Unprocessable Entity]>.status_code

tests\test_auth.py:30: AssertionError
********************************\_\_\_\_******************************** test_register_success ********************************\_\_\_\_********************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>

    def test_register_success(client):
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "newuser_test_auth_1@securewatch.local",
                "password": "NewUser@123456",
                "firstName": "New",
                "lastName": "User",
                "role": "analyst",
            },
        )

>       assert resp.status_code == 201
>
> E assert 409 == 201
> E + where 409 = <Response [409 Conflict]>.status_code

tests\test_auth.py:44: AssertionError
******************************\_\_\_\_****************************** test_register_duplicate_email ******************************\_\_\_\_******************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>

    def test_register_duplicate_email(client):
        # First register
        resp1 = client.post(
            "/api/auth/register",
            json={
                "email": "dupuser_test_auth_1@securewatch.local",
                "password": "DupUser@123456",
                "firstName": "Dup",
                "lastName": "User",
                "role": "analyst",
            },
        )

>       assert resp1.status_code == 201
>
> E assert 409 == 201
> E + where 409 = <Response [409 Conflict]>.status_code

tests\test_auth.py:62: AssertionError
******************************\_\_\_\_****************************** test_full_login_to_alert_flow ******************************\_\_\_\_******************************

client = <starlette.testclient.TestClient object at 0x000001ACA76B9610>
auth_headers = {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBlYTU4OTllLWU4MGYtNGE4NC04ZWYwLTA5ZTlkOTE1ODJ...zgyOTg3NTE4LCJqdGkiOiJmYjU2NTBjZi03MWU5LTRjMWEtYjU5Ni03ZDQ3NjUxYTAxNTMifQ.-FKCPhOz92Q83TWf0iADyKWDc7mFpHR-c_3Eup6DSpk'}

    def test_full_login_to_alert_flow(client, auth_headers):
        # Login -> already covered by admin token; here verify can list alerts and update status
        list_resp = client.get("/api/alerts", headers=auth_headers, params={"per_page": 1})
        assert list_resp.status_code == 200
        alerts = list_resp.json().get("data", [])
        assert alerts, "Expected seeded alerts to exist"

        alert_id = alerts[0]["id"]
        assert alerts[0]["status"] in {"open", "investigating", "resolved", "false_positive"}

        upd_resp = client.post(
            f"/api/alerts/alerts/{alert_id}/status",
            headers=auth_headers,
            json={"status": "resolved"},
        )

>       assert upd_resp.status_code == 200
>
> E assert 404 == 200
> E + where 404 = <Response [404 Not Found]>.status_code

tests\test_integration.py:16: AssertionError
****************************\_\_\_**************************** test_score_attack_event_returns_result ****************************\_\_\_\_****************************

    def test_score_attack_event_returns_result():
        # Construct an "attack-ish" event that should score anomalous enough
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

>       assert resp is not None
>
> E assert None is not None

tests\test_ml_pipeline.py:46: AssertionError
****************************\_**************************** test_rf_classification_returns_valid_class ****************************\_\_****************************

    def test_rf_classification_returns_valid_class():
        log_event = {name: 0.0 for name in FEATURE_NAMES}
        # Make it likely anomalous
        log_event.update(
            {
                "login_count_per_minute": 300.0,
                "failed_auth_ratio": 0.95,
                "ports_scanned": 8.0,
                "unique_ports_per_min": 3.0,
                "connection_duration": 15.0,
                "bytes_transferred": 1.5e7,
                "user_agent_entropy": 0.6,
                "country_risk_score": 0.9,
            }
        )

        resp = score_event(log_event)
        # If the model returns None, we can't assert class fields.
        # But score_event is expected to return a result for attack-like input.

>       assert resp is not None
>
> E assert None is not None

tests\test_ml_pipeline.py:78: AssertionError
******************************\_\_\_\_****************************** test_pipeline_ms_under_500ms ********************************\_********************************

    def test_pipeline_ms_under_500ms():
        log_event = {name: 0.0 for name in FEATURE_NAMES}
        log_event.update(
            {
                "login_count_per_minute": 180.0,
                "failed_auth_ratio": 0.85,
                "ports_scanned": 4.0,
                "unique_ports_per_min": 1.0,
                "connection_duration": 8.0,
                "bytes_transferred": 9e6,
                "user_agent_entropy": 0.4,
                "country_risk_score": 0.7,
            }
        )

        resp = score_event(log_event)

>       assert resp is not None
>
> E assert None is not None

tests\test_ml_pipeline.py:100: AssertionError
=================================================================== short test summary info ===================================================================
FAILED tests/test_api_endpoints.py::test_alert_status_update - assert 404 == 200
FAILED tests/test_api_endpoints.py::test_rules_toggle - assert 404 == 200
FAILED tests/test_auth.py::test_login_missing_fields - assert 422 == 400
FAILED tests/test_auth.py::test_register_success - assert 409 == 201
FAILED tests/test_auth.py::test_register_duplicate_email - assert 409 == 201
FAILED tests/test_integration.py::test_full_login_to_alert_flow - assert 404 == 200
FAILED tests/test_ml_pipeline.py::test_score_attack_event_returns_result - assert None is not None
FAILED tests/test_ml_pipeline.py::test_rf_classification_returns_valid_class - assert None is not None
FAILED tests/test_ml_pipeline.py::test_pipeline_ms_under_500ms - assert None is not None
================================================================ 9 failed, 18 passed in 5.71s =================================================================
PS C:\securewatch-ai>
