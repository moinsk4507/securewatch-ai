# SecureWatch AI — 5-Day Enterprise Implementation Plan

**Classification:** Engineering Execution Document
**Version:** 1.0
**Date:** April 2025
**Stack:** React.js + FastAPI + PostgreSQL + Docker + ELK + WebSockets + scikit-learn

---

## Executive Summary

This document is the authoritative engineering execution plan for building SecureWatch AI from zero to a deployable, demo-ready cybersecurity monitoring platform in 5 working days. Every hour of every day is accounted for. Every dependency is mapped. Every risk has a mitigation. Every module has a completion checklist.

**Non-negotiable rule:** Backend is always built before frontend consumes it. ML is integrated before the dashboard displays it. Docker runs from Day 1. No feature is marked complete without a passing test.

---

## Feature Dependency Graph

```
                    SECUREWATCH AI DEPENDENCY GRAPH
                    ================================

LAYER 0 — FOUNDATION (must exist before anything else)
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose  →  PostgreSQL  →  Elasticsearch            │
│       ↓                 ↓               ↓                   │
│  Network exists   Tables exist    Index exists              │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 1 — AUTHENTICATION (must exist before any protected API)
┌─────────────────────────────────────────────────────────────┐
│  User model  →  bcrypt hash  →  JWT service  →  /api/auth/* │
│       ↓               ↓              ↓              ↓       │
│  DB table      Password stored  Token issued   Login works  │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 2 — CORE API (must exist before ML and frontend)
┌─────────────────────────────────────────────────────────────┐
│  Alert model  →  Rule model  →  Stats route  →  Geo route   │
│       ↓              ↓              ↓              ↓        │
│  Seeded data   Seeded rules   Returns stats   Returns geo   │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 3 — ML PIPELINE (must exist before ML dashboard pages)
┌─────────────────────────────────────────────────────────────┐
│  Feature extraction  →  Train IF  →  Train RF  →  pipeline  │
│          ↓                  ↓            ↓           ↓      │
│  12 features ready   model.pkl    classifier.pkl  Scores    │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 4 — ELK PIPELINE (must exist before live logs)
┌─────────────────────────────────────────────────────────────┐
│  Logstash conf  →  Filebeat  →  ES indexes  →  WS stream    │
│        ↓               ↓            ↓              ↓        │
│  Grok patterns  Ships logs    Logs indexed    WS sends      │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 5 — REACT FRONTEND (consumes all of the above)
┌─────────────────────────────────────────────────────────────┐
│  Auth pages  →  Layout  →  Dashboard  →  All 12 pages       │
│      ↓             ↓           ↓             ↓              │
│  JWT stored   Nav works   Stats show   Full app works       │
└─────────────────────────────────────────────────────────────┘
                              ↓
LAYER 6 — INTEGRATION + DEPLOYMENT
┌─────────────────────────────────────────────────────────────┐
│  E2E test  →  docker-compose.full.yml  →  Deploy  →  Demo   │
└─────────────────────────────────────────────────────────────┘
```

---

## Day 0 — Pre-Start Checklist (Night Before)

Complete all of these before writing a single line of application code:

```
□ Git repository initialised with main and dev branches
□ Docker Desktop installed and running
□ Python 3.11 virtual environment created
□ Node.js 20 LTS installed
□ PostgreSQL 16 client tools installed (psql)
□ VS Code with Python and ESLint extensions installed
□ All .env files created from .env.example templates
□ docker-compose.yml (ELK only) confirmed pulling correct images
□ README.md written with setup instructions
□ Folder structure created exactly as per PRD Section 6
□ requirements.txt committed to repo
□ package.json committed to repo
□ Initial commit: "chore: project scaffold"
```

---

## Day 1 — Foundation + Backend Core

**Target:** PostgreSQL running, all models created, auth endpoints working, core API endpoints returning data, Postman collection testing all routes.

**Hours:** 8 working hours

---

### Hour 1 — Docker Foundation

```
Task: Start ELK stack and PostgreSQL in Docker

EXECUTE IN ORDER:

1. Create elk/docker-compose.yml
   Services: elasticsearch, kibana, logstash
   Healthchecks on all services

2. Create docker-compose.dev.yml
   Add postgres:16-alpine service
   Environment: POSTGRES_DB=securewatch
              POSTGRES_USER=securewatch
              POSTGRES_PASSWORD=devpassword123

3. Start containers:
   docker-compose -f docker-compose.dev.yml up -d

4. Verify (must all pass before proceeding):
   curl http://localhost:9200              → ES JSON response
   psql -h localhost -U securewatch -c "\l"  → lists databases
   http://localhost:5601                  → Kibana loads

COMMIT: "infra: docker compose dev environment with ES and PostgreSQL"

SUCCESS GATE: All three services healthy. Zero errors in docker logs.
```

### Hour 2 — Database Models and Migrations

```
Task: All SQLAlchemy models created, Alembic configured, tables exist

EXECUTE IN ORDER:

1. Install backend dependencies:
   cd backend
   pip install -r requirements.txt

2. Create models/ directory with all 8 models:
   models/database.py     — engine, SessionLocal, Base, get_db
   models/user.py         — User model (all fields per schema doc)
   models/alert.py        — Alert model
   models/rule.py         — Rule + RuleHit models
   models/ml_result.py    — MLResult model
   models/audit_log.py    — AuditLog model
   models/blocked_ip.py   — BlockedIP model
   models/settings.py     — Setting model
   models/__init__.py     — imports all models

3. Configure Alembic:
   alembic init alembic
   Edit alembic/env.py to import Base and use DATABASE_URL

4. Create initial migration:
   alembic revision --autogenerate -m "initial_schema"
   alembic upgrade head

5. Verify tables exist:
   psql -h localhost -U securewatch -c "\dt"
   Must show: users, alerts, rules, rule_hits, ml_results,
              audit_logs, blocked_ips, settings

6. Create seed script: backend/seed.py
   Seeds: 1 admin user, 8 default rules, 9 demo alerts
   Run: python seed.py

COMMIT: "feat: database models and initial migration with seed data"

SUCCESS GATE: psql \dt shows all 8 tables. SELECT COUNT(*) FROM rules = 8.
              SELECT COUNT(*) FROM users = 1. No migration errors.
```

### Hour 3 — Config, Middleware, Auth Service

```
Task: config.py, JWT service, bcrypt, auth middleware all working

EXECUTE IN ORDER:

1. Create backend/config.py
   Load all env vars with defaults
   Validate critical vars raise RuntimeError if missing

2. Create services/jwt_service.py
   create_access_token() — returns (token, expires_in)
   decode_token()        — raises 401 on failure
   hash_password()       — bcrypt hash
   verify_password()     — bcrypt verify

3. Create middleware/auth_middleware.py
   get_current_user() FastAPI dependency
   require_admin() FastAPI dependency
   require_permission(permission) factory dependency

4. Create schemas/ directory:
   schemas/base.py      — BaseResponse, ErrorResponse, PaginatedResult
   schemas/auth.py      — LoginRequest, RegisterRequest, TokenResponse
   schemas/user.py      — UserProfile, UserStats, ActivityItem, Permission
   schemas/errors.py    — AppError, ERROR_CODES

5. Unit test JWT service (inline test):
   token, exp = create_access_token("test-id","test@test.com","admin","Test")
   payload    = decode_token(token)
   assert payload["id"] == "test-id"
   assert payload["role"] == "admin"
   Print: JWT service working

COMMIT: "feat: config, JWT service, bcrypt, auth middleware"

SUCCESS GATE: JWT encode/decode cycle passes. bcrypt hash/verify passes.
              No import errors in any file.
```

### Hour 4 — Authentication Routes

```
Task: /api/auth/* endpoints all working and tested in Postman/curl

EXECUTE IN ORDER:

1. Create routes/auth.py
   POST /api/auth/login
     - Query user by email
     - verify_password()
     - Update last_login
     - create_access_token()
     - Write AuditLog(LOGIN_SUCCESS or LOGIN_FAILED)
     - Return TokenResponse

   POST /api/auth/register
     - Check email unique
     - validate_password_strength()
     - hash_password()
     - Create User
     - Auto-login: create_access_token()
     - Return TokenResponse

   GET /api/auth/check-email
     - Query by email
     - Return {exists: bool}

   GET /api/auth/me
     - Depends(get_current_user)
     - Return user.to_dict()

2. Create app.py
   FastAPI app with lifespan
   CORS middleware (allow localhost:3000)
   Register auth router at /api/auth
   Global exception handlers

3. Start backend:
   uvicorn app:app --reload --port 8000

4. Test every auth endpoint with curl:

   # Register
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test@123456","firstName":"Test","lastName":"User","role":"admin"}'

   # Login
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@securewatch.local","password":"Admin@123456"}'

   # Save token from login response
   TOKEN="<token from login>"

   # Me
   curl http://localhost:8000/api/auth/me \
     -H "Authorization: Bearer $TOKEN"

   All three must return 200. Token must decode. User must match.

COMMIT: "feat: auth routes login register check-email me"

SUCCESS GATE: Login returns 200 with valid JWT.
              /api/auth/me returns correct user object.
              Wrong password returns 401.
```

### Hour 5 — Core API Routes (Stats, Alerts, Geo)

```
Task: Dashboard data endpoints returning correct shapes

EXECUTE IN ORDER:

1. Create schemas for each route:
   schemas/stats.py    — DashboardStats, GeoAttack, TopIP
   schemas/alert.py    — AlertResponse, AlertStatusUpdate, AlertListResponse

2. Create routes/stats.py
   GET /api/stats
     - Count alerts from DB (last 24h)
     - Return DashboardStats with live + mock data mix

3. Create routes/alerts.py
   GET /api/alerts
     - Query Alert table
     - Filter by severity, status query params
     - Pagination support
     - Return AlertListResponse

   POST /api/alerts/{id}/status
     - Find alert by id
     - Update status
     - Write AuditLog
     - Return updated alert

   POST /api/alerts/resolve-all
     - Update all open alerts to resolved
     - Write AuditLog
     - Return message

4. Create routes/geo.py
   GET /api/geo       — returns GEO_DATA constant + DB query
   GET /api/geo/stats — returns counts
   GET /api/top-ips   — returns TOP_IPS constant + DB query

5. Register all routers in app.py

6. Test each endpoint with JWT:
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/stats
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/alerts
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/geo

   All must return 200 with correct JSON shapes.

COMMIT: "feat: stats alerts geo routes with JWT auth"

SUCCESS GATE: All three routes return 200.
              Missing JWT returns 401.
              Wrong role returns 403 on admin-only routes.
```

### Hour 6 — Rules, User, Settings, Firewall Routes

```
Task: All remaining API endpoints working

EXECUTE IN ORDER:

1. Create routes/rules.py
   GET    /api/rules       — list all, seeded from DB
   POST   /api/rules       — create with auto-generated ID
   PATCH  /api/rules/{id}  — toggle enabled or partial update
   PUT    /api/rules/{id}  — full update
   DELETE /api/rules/{id}  — require admin

2. Create routes/user.py
   GET    /api/user/me              — from JWT identity
   PUT    /api/user/me              — update name
   POST   /api/user/change-password — bcrypt verify then update
   GET    /api/user/stats           — mock + DB stats
   GET    /api/user/activity        — last 6 audit log entries
   GET    /api/user/permissions     — from ROLE_PERMISSIONS dict

3. Create routes/settings.py
   GET  /api/settings              — merge defaults + DB rows
   POST /api/settings/general      — upsert Setting rows
   POST /api/settings/notifications
   POST /api/settings/ml
   POST /api/settings/security
   GET  /api/settings/test-connections — ping ES
   DELETE /api/settings/flush-logs  — confirm=FLUSH check
   POST   /api/settings/reset-ml    — confirm=RESET check
   DELETE /api/settings/delete-users — confirm=DELETE check

4. Create routes/firewall.py
   POST   /api/firewall/block       — create BlockedIP
   GET    /api/firewall/blocked     — list active blocked IPs
   DELETE /api/firewall/unblock/{ip}

5. Register all in app.py

6. Full route smoke test:
   Test rules CRUD, settings save, firewall block
   All must return correct HTTP status codes

COMMIT: "feat: rules user settings firewall routes complete"

SUCCESS GATE: 32 of 48 API routes returning correct responses.
              All 8 default rules loadable from GET /api/rules.
```

### Hour 7 — ML Routes + WebSocket

```
Task: ML data endpoints and WebSocket live log stream working

EXECUTE IN ORDER:

1. Create routes/ml.py
   GET  /api/ml/metrics        — returns mock + real metrics
   GET  /api/ml/classification — confidence array
   GET  /api/ml/scores         — scatter point generation
   GET  /api/ml/anomalies      — anomaly list from DB
   GET  /api/ml/config         — model config dict
   POST /api/ml/retrain        — return job response
   POST /api/ml/rescan         — trigger rescan

2. Create routes/logs.py (SSE)
   GET /api/logs        — last 12 log entries
   GET /api/logs/stream — SSE text/event-stream endpoint
     Yields JSON log entry every 2.5s
     Loop through LOG_MESSAGES array cyclically
     CORS header: Access-Control-Allow-Origin: *

3. Create WebSocket endpoint /ws/logs
   in routes/logs.py using FastAPI WebSocket
   Auth via token query param
   ConnectionManager class for tracking connections
   Send log frame every 2.5s
   Handle ping/pong
   Handle disconnect cleanly

4. Create routes/trends.py
   GET /api/trends           — 7d or 30d bucket data
   GET /api/trends/stats     — avg, peak hour, top attack
   GET /api/trends/breakdown — attack type counts

5. Register all. Test:
   curl http://localhost:8000/api/ml/metrics
   curl http://localhost:8000/api/logs
   # WebSocket test with wscat or browser console

COMMIT: "feat: ML routes SSE log stream WebSocket endpoint"

SUCCESS GATE: SSE stream returns log events when browser opens stream URL.
              WebSocket connects with valid token, disconnects with invalid.
              /api/ml/metrics returns all 8 required fields.
```

### Hour 8 — Backend Testing + API Health Check

```
Task: All backend tests pass, Postman collection complete

EXECUTE IN ORDER:

1. Create tests/test_auth.py
   test_login_success()
   test_login_wrong_password()
   test_login_missing_fields()
   test_register_success()
   test_register_duplicate_email()
   test_register_weak_password()
   test_me_with_valid_token()
   test_me_with_no_token()
   test_me_with_expired_token()

2. Create tests/test_api_endpoints.py
   test_stats_with_auth()
   test_stats_without_auth()
   test_alerts_list()
   test_alerts_filter_by_severity()
   test_alert_status_update()
   test_rules_list()
   test_rules_create()
   test_rules_toggle()
   test_settings_get()
   test_firewall_block_ip()

3. Run all tests:
   pytest tests/ -v
   Must: ALL PASS

4. Create /api/health route:
   GET /api/health — no auth, returns:
   {
     "status": "ok",
     "version": "3.0.0",
     "database": "connected",
     "elasticsearch": "connected",
     "timestamp": "..."
   }

5. Document any failing test — fix before proceeding to Day 2

COMMIT: "test: auth and API endpoint tests all passing"
COMMIT: "feat: health check endpoint"

SUCCESS GATE: pytest shows 0 failed tests.
              GET /api/health returns 200 with all services connected.
              Backend Postman collection: all 48 routes tested.

DAY 1 DONE CHECKLIST:
□ Docker running: PostgreSQL + Elasticsearch + Kibana
□ All 8 database tables created and seeded
□ JWT login/register working
□ All 48 API endpoints returning correct responses
□ WebSocket endpoint connected and streaming
□ SSE log stream working
□ All auth tests passing
□ All API tests passing
□ /api/health returns 200
□ Git: 6 commits on dev branch
```

---

## Day 2 — ML Pipeline + ELK Stack

**Target:** Isolation Forest and RF Classifier trained on real synthetic data. Logstash parsing logs. Filebeat configured. ML pipeline scoring events and writing alerts to DB.

---

### Hour 1-2 — Training Data Generation + Feature Extraction

```
Task: 50,000 normal samples and 600 attack samples generated.
      feature_extraction.py extracting all 12 features correctly.

EXECUTE IN ORDER:

1. Create ml/generate_training_data.py
   Generate normal_logs.csv:
     50,000 rows
     12 columns matching feature names exactly
     Values sampled from NORMAL_RANGES dict (per schema doc)
     Save to data/normal_logs.csv

   Generate labelled_attacks.csv:
     100 examples each of 6 attack types = 600 rows
     Features from ATTACK_RANGES dict per class
     Add column: label (0-5 integer class index)
     Save to data/labelled_attacks.csv

   Run: python ml/generate_training_data.py
   Verify: wc -l data/normal_logs.csv  → 50001 (header + 50000 rows)
           wc -l data/labelled_attacks.csv → 601

2. Create ml/feature_extraction.py
   extract_features(log_event: dict) → np.ndarray shape (1, 12)

   Features extracted in EXACT this order:
     [0]  login_count_per_minute
     [1]  ports_scanned
     [2]  request_rate_ratio
     [3]  geo_distance_from_baseline
     [4]  time_of_day_score
     [5]  failed_auth_ratio
     [6]  sudo_fail_count
     [7]  unique_ports_per_min
     [8]  bytes_transferred
     [9]  connection_duration
     [10] user_agent_entropy
     [11] country_risk_score

   FEATURE_NAMES = [list of 12 strings]  ← important for SHAP later

   For missing fields: default to 0.0
   All values: clipped to [0, 1e6] range before returning

3. Unit test extraction:
   event = {"login_count_per_minute": 5.0, "failed_auth_ratio": 0.8, ...}
   features = extract_features(event)
   assert features.shape == (1, 12)
   assert features[0][0] == 5.0
   assert features[0][5] == 0.8

COMMIT: "feat: training data generation and feature extraction"

SUCCESS GATE: CSV files exist with correct row counts.
              extract_features() returns correct shape.
              No NaN values in output.
```

### Hour 3 — Isolation Forest Training

```
Task: Isolation Forest trained, saved to model.pkl, scoring correctly

EXECUTE IN ORDER:

1. Create ml/train_isolation_forest.py

   TRAINING PROCEDURE:
   a. Load data/normal_logs.csv with pandas
   b. Extract feature columns (12 columns exactly)
   c. Check for NaN: assert df.isna().sum().sum() == 0
   d. Train/test split: 80/20, random_state=42

   e. Train:
      from sklearn.ensemble import IsolationForest
      model = IsolationForest(
          n_estimators=100,
          contamination=0.05,
          random_state=42,
          max_samples='auto',
          n_jobs=-1,
      )
      model.fit(X_train)

   f. Evaluate on test set:
      scores = model.decision_function(X_test)
      predictions = model.predict(X_test)
      anomaly_rate = (predictions == -1).sum() / len(predictions)
      print(f"Anomaly rate on normal data: {anomaly_rate:.3f}")
      print(f"Expected: ~0.05")
      assert 0.02 <= anomaly_rate <= 0.10  ← fail if model is broken

   g. Save: joblib.dump(model, "ml/model.pkl")
   h. Print: "Isolation Forest trained. Saved to ml/model.pkl"
   i. Print: f"Score range: {scores.min():.3f} to {scores.max():.3f}"

2. Run: python ml/train_isolation_forest.py
   Expected output:
     Anomaly rate on normal data: 0.05x
     Score range: -0.xxx to +0.xxx
     Isolation Forest trained. Saved to ml/model.pkl

3. Verify model.pkl exists:
   python -c "import joblib; m=joblib.load('ml/model.pkl'); print(m)"

COMMIT: "feat: isolation forest trained and saved"

SUCCESS GATE: model.pkl exists and loads without error.
              Anomaly rate between 0.02 and 0.10.
              model.decision_function(some_normal_features) returns value > -0.7.
              model.decision_function(attack_features) returns value < -0.7.
```

### Hour 4 — RF Classifier Training

```
Task: Random Forest classifier trained on 6 attack types, saved to classifier.pkl

EXECUTE IN ORDER:

1. Create ml/train_rf_classifier.py

   CLASS_NAMES = [
       "Brute Force SSH",      # 0
       "Port Scan / Recon",    # 1
       "DDoS Pattern",         # 2
       "Slow Brute Force",     # 3
       "Geographic Anomaly",   # 4
       "Privilege Escalation", # 5
   ]

   TRAINING PROCEDURE:
   a. Load data/labelled_attacks.csv
   b. X = feature columns (12), y = label column
   c. Verify all 6 classes present:
      assert len(df['label'].unique()) == 6

   d. Train/test split: 80/20, stratified, random_state=42

   e. Train:
      from sklearn.ensemble import RandomForestClassifier
      classifier = RandomForestClassifier(
          n_estimators=100,
          max_depth=10,
          random_state=42,
          class_weight='balanced',
          n_jobs=-1,
      )
      classifier.fit(X_train, y_train)

   f. Evaluate:
      from sklearn.metrics import classification_report, accuracy_score
      y_pred = classifier.predict(X_test)
      print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))
      print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
      assert accuracy_score(y_test, y_pred) >= 0.70  ← fail if too low

   g. Save classifier and class names:
      joblib.dump({
          "model":       classifier,
          "class_names": CLASS_NAMES,
      }, "ml/classifier.pkl")

2. Run: python ml/train_rf_classifier.py
   Expected: Classification report with all 6 classes
             Accuracy >= 0.70

COMMIT: "feat: RF classifier trained on 6 attack types"

SUCCESS GATE: classifier.pkl exists.
              All 6 class names in output.
              Accuracy >= 0.70.
              Single attack event classifies to correct type.
```

### Hour 5 — ML Predict Service + Pipeline

```
Task: predict.py scoring events end-to-end. pipeline.py polling and writing alerts.

EXECUTE IN ORDER:

1. Create ml/predict.py

   _model      = None
   _classifier = None
   _class_names = None

   def load_models():
       global _model, _classifier, _class_names
       _model = joblib.load("ml/model.pkl")
       data   = joblib.load("ml/classifier.pkl")
       _classifier  = data["model"]
       _class_names = data["class_names"]

   def score_event(log_event: dict) -> dict | None:
       if _model is None: load_models()

       start    = time.time()
       features = extract_features(log_event)

       # IF scoring
       if_score = float(_model.decision_function(features)[0])
       is_anomaly = if_score < -0.70

       if not is_anomaly:
           return None  # Normal event, skip

       # RF classification
       class_idx    = int(_classifier.predict(features)[0])
       proba        = _classifier.predict_proba(features)[0]
       confidence   = float(proba[class_idx] * 100)
       attack_type  = _class_names[class_idx]

       pipeline_ms = int((time.time() - start) * 1000)

       return {
           "if_score":    if_score,
           "is_anomaly":  True,
           "rf_class":    attack_type,
           "rf_class_idx": class_idx,
           "rf_confidence": confidence,
           "features":    {FEATURE_NAMES[i]: float(features[0][i]) for i in range(12)},
           "pipeline_ms": pipeline_ms,
       }

2. Create ml/pipeline.py

   def create_alert_from_result(result: dict, log_event: dict, db_session):
       """Write ML result + Alert to PostgreSQL"""
       # Determine severity from if_score and confidence
       if   result["if_score"] < -0.85: severity = "critical"
       elif result["if_score"] < -0.75: severity = "high"
       elif result["if_score"] < -0.70: severity = "medium"
       else:                            severity = "low"

       alert = Alert(
           id=uuid.uuid4(),
           severity=severity,
           name=f"{result['rf_class']} Detected",
           source_ip=log_event.get("src_ip"),
           ml_classification=f"{result['rf_class']} ({result['rf_confidence']:.0f}%)",
           if_score=result["if_score"],
           rf_confidence=result["rf_confidence"],
           status="open",
           attack_type=result["rf_class"],
           raw_features=result["features"],
       )
       db_session.add(alert)
       db_session.commit()
       return alert

   def run_pipeline():
       """Main loop: poll ES for new events, score, write alerts"""
       load_models()
       print("ML Pipeline started. Polling Elasticsearch every 5 seconds...")
       while True:
           try:
               events = fetch_unscored_events_from_es()
               for event in events:
                   result = score_event(event)
                   if result:
                       db = next(get_db())
                       alert = create_alert_from_result(result, event, db)
                       print(f"ALERT: {alert.name} | IF:{result['if_score']:.3f}")
                       mark_event_scored_in_es(event["_id"])
           except Exception as e:
               print(f"Pipeline error: {e}")
           time.sleep(5)

3. Test predict.py with a mock attack event:
   from ml.predict import score_event
   result = score_event({
       "login_count_per_minute": 250,
       "failed_auth_ratio": 0.98,
       "country_risk_score": 0.9,
       # ... other fields at 0
   })
   assert result is not None
   assert result["rf_class"] in ["Brute Force SSH", "Port Scan / Recon", ...]
   print(f"Classified as: {result['rf_class']} ({result['rf_confidence']:.0f}%)")

COMMIT: "feat: predict service and ML pipeline with DB alert writing"

SUCCESS GATE: score_event(attack_event) returns non-None result.
              score_event(normal_event) returns None.
              Alert written to PostgreSQL after pipeline processes attack.
              Pipeline runs without crashing.
```

### Hour 6 — ELK Stack Configuration

```
Task: Logstash parsing SSH and Apache logs. Filebeat configured.
      Logs appearing in Elasticsearch securewatch-logs-* index.

EXECUTE IN ORDER:

1. Create elk/logstash.conf (complete config per TRD Section 10)
   Input: beats port 5044
   Filter: Grok for SSH auth failure, SSH success, sudo fail, Apache
   Filter: GeoIP on src_ip field
   Filter: date normalization
   Filter: mutate add source_app = "securewatch", ml_scored = false
   Output: elasticsearch hosts localhost:9200
           index "securewatch-logs-%{+YYYY.MM.dd}"
   Output: stdout codec rubydebug (for debugging)

2. Restart logstash with new config:
   docker-compose restart logstash
   Watch logs: docker logs securewatch-logstash -f
   Must show: "Pipelines running" with no errors

3. Create elk/filebeat.yml:
   filebeat.inputs:
     type: log
     paths:
       - /var/log/auth.log
       - /var/log/syslog
       - /var/log/apache2/access.log
   output.logstash:
     hosts: ["logstash:5044"]

4. Inject test log to verify pipeline:
   # Create a test log file
   echo "Apr 14 04:22:03 server sshd[1234]: Failed password for root from 192.168.1.44 port 22 ssh2" \
     > /tmp/test_auth.log

   # Ship via curl to simulate filebeat
   curl -X POST "http://localhost:9200/securewatch-logs-test/_doc" \
     -H "Content-Type: application/json" \
     -d '{"message":"Apr 14 04:22:03 server sshd[1234]: Failed password for root from 192.168.1.44 port 22 ssh2","@timestamp":"2025-04-14T04:22:03Z","source_app":"securewatch","ml_scored":false}'

5. Verify in Elasticsearch:
   curl "http://localhost:9200/securewatch-logs-*/_count"
   Must return: {"count": >0, ...}

   curl "http://localhost:9200/securewatch-logs-*/_search?size=1&pretty"
   Must show: document with src_ip, timestamp, message fields

COMMIT: "feat: logstash grok config and ELK pipeline verified"

SUCCESS GATE: Documents appear in securewatch-logs-* index.
              Grok parse failure rate = 0% on test documents.
              GeoIP resolving correctly.
```

### Hour 7-8 — ML Route Integration + Tests

```
Task: Backend /api/ml/* routes returning real data from trained models.
      ML pipeline test complete end-to-end.

EXECUTE IN ORDER:

1. Update routes/ml.py to use real model data:
   GET /api/ml/metrics:
     Load model.pkl and report actual n_estimators, contamination
     Check last modified time of model.pkl for "last_trained"

   GET /api/ml/anomalies:
     Query ML_results and Alert tables in PostgreSQL
     Return real scored events

2. Wire pipeline.py to run as background thread during development:
   In app.py lifespan, start pipeline in a Thread (daemon=True)
   This lets alerts accumulate while testing frontend

3. Create tests/test_ml_pipeline.py:
   test_feature_extraction_shape()
   test_feature_extraction_normal_event()
   test_score_normal_event_returns_none()
   test_score_attack_event_returns_result()
   test_rf_classification_returns_valid_class()
   test_pipeline_ms_under_500ms()

4. Run tests: pytest tests/test_ml_pipeline.py -v
   All must pass.

5. End-to-end ML test:
   a. Inject a fake brute force event into ES
   b. Run pipeline.py manually for one cycle
   c. Check: Alert appears in PostgreSQL
   d. Check: GET /api/alerts returns new alert

COMMIT: "test: ML pipeline tests all passing"
COMMIT: "feat: ML routes using real model data"

SUCCESS GATE: All ML tests pass.
              End-to-end: inject attack → pipeline scores → alert in DB → API returns it.
              Pipeline runs in under 500ms per event.

DAY 2 DONE CHECKLIST:
□ 50,000 normal training samples generated
□ Isolation Forest trained, model.pkl saved
□ RF Classifier trained, classifier.pkl saved, accuracy >= 70%
□ feature_extraction.py returning correct 12-feature arrays
□ predict.py correctly scoring events and classifying attack types
□ pipeline.py writing alerts to PostgreSQL
□ Logstash parsing SSH and Apache logs
□ Logs appearing in Elasticsearch securewatch-logs-* index
□ /api/ml/* routes returning data from real models
□ All ML tests passing
□ Git: 6 commits on dev branch
```

---

## Day 3 — React Frontend (Auth + Layout + Dashboard + Core Pages)

**Target:** React app running, login and signup working end-to-end with real JWT, all layout components built, Dashboard loading real data, Live Logs streaming, Alerts table working.

---

### Hour 1 — React + Vite Setup

```
Task: React app running at localhost:3000, fonts loaded, CSS variables active

EXECUTE IN ORDER:

1. Scaffold Vite + React project:
   cd frontend
   npm create vite@latest . -- --template react
   npm install

2. Install all dependencies:
   npm install react-router-dom@6 axios recharts react-hot-toast

3. Create vite.config.js with:
   - Path aliases: @, @components, @pages, @services, @context, @hooks
   - Dev proxy: /api → http://localhost:8000
               /ws  → ws://localhost:8000

4. Update index.html:
   - Add Google Fonts link: Syne and JetBrains Mono
   - Set title: SecureWatch AI

5. Create src/index.css:
   - All CSS variables from Design Brief Section 1.1
   - CSS reset
   - Shared utility classes: .card, .badge variants, .btn variants
   - .form-input, .form-label, .form-group
   - .data-table, .page, .page-header, .stat-card
   - .sr-only for accessibility

6. Create src/index.jsx:
   import { BrowserRouter } from 'react-router-dom'
   import { AuthProvider } from './context/AuthContext'
   import { Toaster } from 'react-hot-toast'
   ReactDOM.createRoot(root).render(
     <BrowserRouter>
       <AuthProvider>
         <App/>
         <Toaster position="bottom-right" toastOptions={...}/>
       </AuthProvider>
     </BrowserRouter>
   )

7. Start dev server:
   npm run dev
   Open http://localhost:3000 → blank dark page. No errors in console.

COMMIT: "feat: react vite scaffold with CSS variables and font imports"

SUCCESS GATE: localhost:3000 loads with dark background.
              CSS variables resolving (check with browser inspector).
              Google Fonts loaded (Syne and JetBrains Mono).
              Zero console errors.
```

### Hour 2 — Services Layer + Auth Context

```
Task: Axios configured, all API service files created, AuthContext working

EXECUTE IN ORDER:

1. Create src/services/api.js:
   axios instance with baseURL from VITE_API_URL
   Request interceptor: attach Bearer token
   Response interceptor: on 401 → clear token → redirect /login
   export tokenStorage (get, set, clear)

2. Create all 9 service files:
   src/services/authAPI.js    — login, register, checkEmail, me
   src/services/statsAPI.js   — get
   src/services/alertsAPI.js  — getAll, updateStatus, resolveAll
   src/services/geoAPI.js     — getAttacks, getStats, getTopIPs
   src/services/mlAPI.js      — getMetrics, getClassification, getScores, getAnomalies, getConfig, retrain
   src/services/rulesAPI.js   — getAll, create, patch, update, remove
   src/services/userAPI.js    — getProfile, getStats, getActivity, getPermissions, updateProfile, changePassword
   src/services/settingsAPI.js — get, saveGeneral, saveNotifications, saveML, saveSecurity, testConnections, flushLogs, resetML, deleteUsers
   src/services/logsAPI.js    — get, stream (EventSource factory)

3. Create src/context/AuthContext.jsx:
   useState: user, loading
   useEffect: tokenStorage.get() → authAPI.me() → setUser or clear
   login(email, password, remember): calls authAPI.login, tokenStorage.set, setUser
   logout(): tokenStorage.clear, setUser(null)
   export AuthProvider, useAuth

4. Test AuthContext in isolation:
   Temporarily add: console.log('AuthContext user:', user) to App.jsx
   Expected on load: "AuthContext user: null" (no token yet)
   Login via API: expect "AuthContext user: {id, email, role, ...}"

COMMIT: "feat: axios services layer and AuthContext"

SUCCESS GATE: authAPI.login() returns token and user.
              AuthContext user is null on first load.
              After login, user object is set.
              Axios interceptor adds Bearer token to requests.
```

### Hour 3 — UI Components + Logo + Icons

```
Task: All reusable UI components built. Logo renders. All 22 icons available.

EXECUTE IN ORDER:

1. Create src/components/ui/Icon.jsx:
   All 22 SVG icon definitions as described in Design Brief Section 18
   Each icon: fill=none, stroke=currentColor, strokeLinecap="square"
   export default Icon({ name, size=16, color='currentColor', style={} })

2. Create src/components/ui/Logo.jsx:
   Sharp geometric SVG mark per Design Brief Section 19
   export default Logo({ size=28 })

3. Create src/components/ui/Badge.jsx:
   Props: severity (critical|high|medium|low|info)
   Maps to CSS classes: badge badge--{severity}

4. Create src/components/ui/StatCard.jsx:
   Props: label, value, color, meta
   Renders with 2px top accent line

5. Create src/components/ui/Toggle.jsx:
   Props: checked, onChange, disabled
   Renders custom CSS toggle switch

6. Create src/components/ui/Button.jsx:
   Props: variant (primary|secondary|danger|action), size, icon, loading, onClick, children, disabled, fullWidth

7. Create src/components/ui/Modal.jsx:
   Props: open, title, message, danger, onConfirm, onCancel, confirmLabel, confirmInput, expectedInput
   Handles typed confirmation (for Danger Zone)

8. Visual test: create a temporary TestPage.jsx showing:
   - All 22 icons
   - All badge variants
   - All button variants
   - Logo mark
   - Stat cards in all 4 colours
   Verify visual output in browser

COMMIT: "feat: all UI components Icon Logo Badge StatCard Toggle Button Modal"

SUCCESS GATE: All 22 icons render without errors.
              Logo mark matches specification exactly.
              All badge colours match Design Brief.
              Modal opens and closes with typed confirmation working.
```

### Hour 4 — Layout: Topbar + Sidebar + AppLayout

```
Task: Complete app shell with navigation working

EXECUTE IN ORDER:

1. Create src/components/layout/Topbar.jsx:
   Logo + wordmark (using Logo component and Icon)
   Live green dot with CSS pulse animation
   Search bar (UI only, no backend wired yet)
   3 Critical button → navigate('/alerts')
   Avatar with dropdown: My Account, Sign Out
   Sign Out calls logout() from useAuth()

2. Create src/components/layout/Sidebar.jsx:
   NAV array with all 11 routes, icons, labels, badges
   Collapsed state (useState), toggle button with ic-chevron-left/right
   useLocation() to highlight active route
   Active item: cyan border + cyan text + cyan icon
   ML status footer with 73% bar
   Badges: 847 green for live-logs, 12 red for alerts, 5 red for anomalies

3. Create src/components/layout/AppLayout.jsx:
   topbar + main area with sidebar + page content
   Uses CSS grid: 50px topbar, sidebar, content flex

4. Test navigation:
   Click each nav item → route changes
   Active highlight follows current route
   Collapse toggle → sidebar width animates
   Sign Out → redirects to /login

COMMIT: "feat: Topbar Sidebar AppLayout navigation working"

SUCCESS GATE: Sidebar collapses/expands with 0.25s animation.
              Active route highlighted with cyan.
              Sign Out clears token and redirects to /login.
              Topbar shows user avatar from AuthContext.
```

### Hour 5 — Login + Signup Pages

```
Task: Login and Signup pages working end-to-end with real backend

EXECUTE IN ORDER:

1. Create src/components/pages/Login.jsx:
   All UI per PRD 4.1 spec exactly:
   - SVG logo mark + wordmark centred
   - "Operator Login" heading
   - Email input, Password input + ic-eye toggle
   - Remember me checkbox
   - "Authenticate" primary button
   - SSO divider + LDAP button
   - Link to /signup
   - Footer: TLS 1.3 text

   handleLogin():
     setLoading(true)
     await authAPI.login(email, password)
     tokenStorage.set(token, remember)
     setUser(user)
     navigate('/')

   Error state: show red error banner if login fails

2. Create src/components/pages/Signup.jsx:
   All UI per PRD 4.2 spec:
   - Role selector with ic-analyst and ic-admin icons
   - First/Last name grid
   - Email with debounced duplicate check
   - Password + strength meter + ic-eye
   - Confirm password
   - Terms checkbox
   - "Create Account" button

   checkPasswordStrength(): updates meter bar colour
   handleSignup(): calls authAPI.register(), then authAPI.login()

3. Create src/App.jsx:
   PublicRoute and PrivateRoute components
   All route definitions
   Lazy imports for all 12 page components

4. Full login test:
   Open http://localhost:3000
   Should redirect to /login (no token)
   Enter: admin@securewatch.local / Admin@123456
   Click Authenticate
   Should navigate to /dashboard
   Reload page — should stay on /dashboard (token persists)
   Click Sign Out — should return to /login

COMMIT: "feat: Login Signup pages working with real JWT auth"

SUCCESS GATE: Login with correct credentials → navigate to dashboard
              Login with wrong password → error banner shown
              Refresh page stays logged in
              Sign out → back to login
              Signup creates account and auto-logs in
              Password strength meter changes colour as user types
```

### Hour 6 — Dashboard Page

```
Task: Dashboard loading real data from API, auto-refreshing every 2 seconds

EXECUTE IN ORDER:

1. Create src/hooks/useAutoRefresh.js:
   Takes callback and interval
   Calls callback immediately on mount
   Sets interval, cleans up on unmount

2. Create src/components/pages/Dashboard.jsx:
   State: stats, alerts, topIPs, loading, error

   useEffect on mount:
     fetchDashboardStats()
     fetchLiveAlerts(6)
     fetchTopIPs(4)

   useAutoRefresh(fetchDashboardStats, 2000)
   useAutoRefresh(fetchLiveAlerts.bind(null, 6), 2000)

   Render 4 StatCards using stats data
   Render alert feed with AlertRow sub-component
   Render geo map with pulsing dots (CSS only, no map library)
   Render top IPs table
   Render recharts BarChart timeline (45 bars, demo data)
   "View All →" button navigates to /alerts

3. AlertRow sub-component:
   Uses Badge for severity
   Renders time, name, IP, ML classification

4. recharts BarChart (Alert Timeline):
   ResponsiveContainer width=100% height=70
   BarChart data={45 generated points}
   Bar with Cell per entry coloured by severity

COMMIT: "feat: Dashboard page with real API data and auto-refresh"

SUCCESS GATE: Dashboard loads without errors.
              Stat cards show real numbers from /api/stats.
              Alert feed shows 6 most recent alerts from /api/alerts.
              Numbers update every 2 seconds.
              recharts BarChart renders without console errors.
```

### Hour 7 — Live Logs + Alerts Pages

```
Task: SSE log stream working in browser. Alerts table with all filter and action functions.

EXECUTE IN ORDER:

1. Create src/components/pages/LiveLogs.jsx:
   State: logs (array max 200), paused, activeLevels, keyword, loading

   useEffect:
     const es = new EventSource('/api/logs/stream')
     es.onmessage = (event) => {
       const log = JSON.parse(event.data)
       if (!paused) {
         setLogs(prev => [...prev.slice(-199), log])
       }
     }
     es.onerror = () => es.close()
     return () => es.close()

   Auto-scroll: useRef on log container, scrollTop = scrollHeight

   Filter buttons: INFO/WARN/ALERT/CRIT toggle each independently
   Keyword search: filters displayed rows
   Pause/Resume button

   Log row rendering: timestamp (mono) | level badge | message
   ALERT rows: orange left border + orange bg
   CRIT rows: red left border + red bg

2. Create src/components/pages/Alerts.jsx:
   Severity filter pills: All, Critical, High, Medium, Low
   Status filter pills: Open, Investigating, Resolved
   Data table with all columns per spec
   Action buttons: Investigate, View, Block IP, Watch, Resolve

   investigateAlert(id): PATCH /api/alerts/:id/status
   resolveAlert(id): PATCH /api/alerts/:id/status
   blockIP(ip): Modal → POST /api/firewall/block
   markAllResolved(): Modal → POST /api/alerts/resolve-all

   Status dots per status value
   Optimistic UI on status updates

COMMIT: "feat: LiveLogs SSE stream and Alerts table with actions"

SUCCESS GATE: Live log stream auto-appends entries every 2.5 seconds.
              Pause stops stream. Resume restarts.
              Level filter toggles show/hide correct rows.
              Alert status update changes dot colour immediately.
              Block IP modal opens, confirms, sends POST request.
```

### Hour 8 — Geo Map + ML Engine Pages

```
Task: Geo Map and ML Engine pages complete with real data

EXECUTE IN ORDER:

1. Create src/components/pages/GeoMap.jsx:
   4 stat cards: Countries, Active IPs, Tor Exits, Botnets
   World map container: dark background + CSS grid overlay
   Pulsing geo dots: positioned via coordsToPercent()
   Each dot coloured by severity
   Colour legend below map
   Country table: flag emoji, name, count, proportional bar, badge

   coordsToPercent(lat, lng):
     x = ((lng + 180) / 360) * 100
     y = ((90 - lat) / 180) * 100
     return { left: x, top: y }

   Data from geoAPI.getAttacks()

2. Create src/components/pages/MLEngine.jsx:
   4 metric cards with 2px top accent
   Classification confidence bars (5 bars with gradients)
   recharts ScatterChart for anomaly scores
   Model config panel (3-column grid)
   Retrain button → mlAPI.retrain() → toast

   ScatterChart:
     Normal dots: cyan, opacity 0.45
     Anomaly dots: red, with CSS filter drop-shadow
     ResponsiveContainer height 200

   Data from mlAPI.getMetrics(), getClassification(), getScores(), getConfig()

COMMIT: "feat: GeoMap and MLEngine pages with real data"

SUCCESS GATE: Geo dots render at approximately correct map positions.
              Map pulsing animations active on all dots.
              ML scatter plot shows blue and red dots.
              Retrain button shows toast on click.
              All confidence bars render with correct gradients.

DAY 3 DONE CHECKLIST:
□ React app running at localhost:3000
□ Vite proxy routing /api to backend
□ All 9 service files created and working
□ AuthContext login/logout working
□ All 22 SVG icons rendering correctly
□ Topbar with search, alerts button, avatar dropdown
□ Sidebar collapsing with animation, active nav highlighted
□ Login page: end-to-end auth with real JWT
□ Signup page: creates account and auto-logs in
□ Dashboard: real data, auto-refresh every 2 seconds
□ Live Logs: SSE stream, pause/resume, level filters
□ Alerts: table, filters, investigate/resolve/block actions
□ Geo Map: world map with pulsing dots
□ ML Engine: metrics, confidence bars, scatter chart
□ Git: 8 commits on dev branch
```

---

## Day 4 — Remaining Pages + WebSocket + Integration

**Target:** All 12 pages complete. WebSocket connected. All pages wired to real APIs. Full end-to-end flow working.

---

### Hour 1 — Anomalies + Trends Pages

```
Task: Anomalies hero card and table. Trends bar charts with period toggle.

1. Create src/components/pages/Anomalies.jsx:
   GET /api/ml/anomalies on mount
   getWorstAnomaly(): find lowest if_score
   Hero card: big red IF score, IP, type, time
   Mini scatter plot (reuse scatter component)
   Anomaly table: IP, score (colour-coded), badge, time, action buttons
   getScoreColour(score): < -0.8 red, -0.8 to -0.6 orange, else yellow

2. Create src/components/pages/Trends.jsx:
   State: period ('7d' or '30d'), trendData, trendStats, breakdown
   Fetch all three on mount and period change
   recharts BarChart: 7 bars Mon-Sun
   Three stat cards (right column)
   Attack type breakdown: horizontal bars with percentage widths
   Period toggle buttons update state and re-fetch

COMMIT: "feat: Anomalies and Trends pages"

SUCCESS GATE: Anomalies hero card shows worst IF score.
              Score colours correct per threshold.
              Trends period toggle re-fetches data.
              recharts BarChart renders 7 bars.
```

### Hour 2 — Rules Page

```
Task: Full rules management with create/edit/toggle/delete

1. Create src/components/pages/Rules.jsx:
   State: rules, showCreateModal, editingRule, loading
   Fetch rules on mount

   Table columns exactly per PRD 4.10:
   ID (mono muted) | Name (bold) | Condition (code pill) |
   Severity badge | Action | Hits Today (mono) | Toggle | Edit

   toggleRule(ruleId, enabled):
     Optimistic update: flip toggle immediately
     PATCH /api/rules/:id { enabled }
     On error: revert toggle

   openCreateModal():
     Set editingRule = null
     Open Modal with empty form fields

   openEditModal(rule):
     Set editingRule = rule
     Open Modal with pre-filled form fields

   handleSaveRule():
     If editing: PUT /api/rules/:id
     If creating: POST /api/rules
     Close modal, refresh list, toast success

   handleDeleteRule(ruleId):
     Open confirmation Modal
     On confirm: DELETE /api/rules/:id
     Remove from list, toast success

   Rule create/edit Modal:
     Name input (required)
     Condition input (required)
     Severity select: critical/high/medium/low
     Action select: Alert Only, Alert + Block, Alert + Rate Limit, etc.
     Save and Cancel buttons

COMMIT: "feat: Rules page with CRUD and toggle"

SUCCESS GATE: Toggle rule on/off updates DB and UI.
              Create rule adds to table after API success.
              Edit rule pre-fills modal with existing data.
              Delete rule removes from table after confirmation.
```

### Hour 3 — Settings Page

```
Task: All 6 settings tabs working with real API persistence

1. Create src/components/pages/Settings.jsx:
   State: activeTab, settings (from API), loading
   Fetch GET /api/settings on mount → populate all form fields

   Left nav: 6 items with icons
   Active tab: useState, switchSettingsTab()

   GENERAL tab:
     System Name input
     Timezone select
     Log Retention select
     Auto-refresh select
     Save Changes → POST /api/settings/general → toast

   NOTIFICATIONS tab:
     Email toggle + email input
     Slack toggle + URL input
     Min severity select
     Save → POST /api/settings/notifications

   ML CONFIG tab:
     Contamination number input
     n_estimators number input
     Auto-retrain toggle
     Alert threshold number input
     Save + Retrain → POST /api/settings/ml

   INTEGRATIONS tab:
     ES URL, Kibana URL, Logstash Port inputs
     Filebeat status indicator
     Test + Save → GET /api/settings/test-connections → show status

   SECURITY tab:
     2FA toggle, Session timeout, IP whitelist, SSO toggle
     Save → POST /api/settings/security

   DANGER ZONE tab:
     Red-bordered section
     Each action opens Modal with typed confirmation:
       Flush Logs: type "FLUSH"
       Reset ML: type "RESET"
       Delete Users: type "DELETE"
     Modal confirm button only enables when exact text typed

COMMIT: "feat: Settings page all 6 tabs with API persistence"

SUCCESS GATE: Changing system name and saving persists to DB (verify via GET /api/settings).
              Test connections shows green "connected" status.
              Danger zone modals only enable confirm button when exact text typed.
              All three danger zone actions call correct API endpoints.
```

### Hour 4 — Admin / My Account Page

```
Task: User profile page complete with all sections

1. Create src/components/pages/Admin.jsx:
   Fetch userAPI.getProfile(), getStats(), getActivity(), getPermissions() in parallel

   Profile header card:
     Avatar (initials, gradient background)
     Name (uppercase bold), role (cyan uppercase), email (mono)
     Active and role badges
     Last login timestamp
     Edit Profile → modal with name input
     Change Password → modal with 3 password inputs

   4 stat cards: Alerts Reviewed, Rules Created, Uptime, Days Active

   Recent Activity list:
     Icon container (30px square) with SVG icon in severity colour
     Action text
     getRelativeTime(timestamp): "2 minutes ago" / "1 hour ago" / "Yesterday"

   Permissions grid:
     Permission name left
     ic-check (green) or ic-x (red) right
     Admin: all ic-check

   Sign Out button: calls logout(), navigate('/login')

COMMIT: "feat: Admin My Account page with profile activity permissions"

SUCCESS GATE: Profile shows real user data from JWT and API.
              Activity shows last 6 audit log entries.
              Edit Profile saves new name.
              Change Password validates current password, updates if correct.
              Sign Out clears token and redirects.
```

### Hour 5 — WebSocket Integration

```
Task: Replace SSE with WebSocket for live logs. WebSocket hook with reconnect working.

EXECUTE IN ORDER:

1. Create src/hooks/useWebSocket.js:
   Per TRD Section 8 — complete implementation
   Connect with token query param
   onmessage: parse JSON, call onMessage callback
   Exponential backoff reconnect: 1s, 2s, 5s, 10s, 30s
   Status state: 'connecting' | 'connected' | 'disconnected'
   Close code 1000: no reconnect
   Close code 4001: no reconnect, redirect to login
   Cleanup on unmount: close(1000)

2. Update LiveLogs.jsx to use useWebSocket:
   const { status } = useWebSocket('/ws/logs', {
     onMessage: (data) => {
       if (!paused) setLogs(prev => [...prev.slice(-199), data])
     }
   })

   Show WebSocket status indicator in header:
     connected → green dot
     connecting → yellow dot
     disconnected → red dot

3. Update Sidebar.jsx ML status:
   Show WebSocket connection state in the ML status footer

4. Test reconnect:
   Open Live Logs page
   Kill backend (Ctrl+C uvicorn)
   Watch: dot turns yellow then red
   Restart backend
   Watch: dot turns yellow then green
   Logs resume streaming

COMMIT: "feat: WebSocket hook with exponential backoff reconnect"

SUCCESS GATE: Logs stream via WebSocket (verify in browser Network tab → WS frames).
              Disconnect → reconnect cycle works without page reload.
              Status indicator changes colour correctly.
              Token invalid → closes with 4001 → redirects to login.
```

### Hour 6 — Custom Hooks + Error Handling

```
Task: useToast hook, error handling consistent across all pages, offline banner

EXECUTE IN ORDER:

1. Create src/hooks/useToast.js:
   Wrapper around react-hot-toast with styled options
   success(message), error(message), info(message), loading(message)

2. Audit all 12 page components:
   Every API call must have:
   - try/catch
   - catch: toast.error(getErrorMessage(err))
   - loading state during fetch
   - error state for empty/failed loads

3. Create src/components/ui/LoadingScreen.jsx:
   Full-viewport dark screen
   Logo mark centred
   Linear progress bar below (CSS animation)
   Used in PrivateRoute while loading=true

4. Create src/components/ui/EmptyState.jsx:
   Used when API returns empty array
   Shows icon + message
   e.g.: "No alerts found" on Alerts page

5. Add offline detection to App.jsx:
   window.addEventListener('online', handleOnline)
   window.addEventListener('offline', handleOffline)
   Show ConnectionBanner component when offline

6. Verify all pages handle:
   □ Loading state: skeleton or spinner shows
   □ Error state: toast or inline error shows
   □ Empty state: empty state component shows
   □ Success state: data renders correctly

COMMIT: "feat: consistent error handling loading states empty states"

SUCCESS GATE: Turning off backend → error toasts appear on all pages.
              Turning backend back on → auto-retry succeeds.
              Loading skeleton shows on initial page load.
              Empty state shows when no data returned.
```

### Hour 7 — Signup Flow + RBAC Route Protection

```
Task: Full signup flow complete. All routes protected by role and permission.

EXECUTE IN ORDER:

1. Complete App.jsx PrivateRoute and PublicRoute:
   PrivateRoute: check loading → check user → check role → check permission → render
   PublicRoute: if user exists → navigate('/')

2. Apply protection to all routes:
   /settings → requiredRole="admin"
   /live-logs → permission="view_live_logs"
   /alerts → permission="manage_alerts"
   /rules → permission="create_rules"
   /anomalies, /trends → any authenticated user
   All others → any authenticated user

3. Test RBAC:
   Create a viewer account via signup (role: viewer)
   Login as viewer
   Try navigating to /settings → should redirect to /
   Try navigating to /live-logs → should redirect to /
   Navigate to / → should work
   Navigate to /geo-map → should work

4. Verify admin account:
   Login as admin → all routes accessible
   /settings shows all 6 tabs

5. Add loading screen between route transitions:
   <Suspense fallback={<LoadingScreen/>}>
     <Routes>...</Routes>
   </Suspense>

COMMIT: "feat: complete RBAC route protection and role testing"

SUCCESS GATE: Viewer cannot access /settings or /live-logs.
              Admin can access all routes.
              Analyst can access all except /settings.
              Invalid route redirects to /.
```

### Hour 8 — Integration Testing + Bug Fixes

```
Task: Full end-to-end flow tested. All known bugs fixed.

EXECUTE IN ORDER:

1. Complete end-to-end test sequence:
   a. Open http://localhost:3000 (no token) → should show /login
   b. Login with admin credentials → navigates to dashboard
   c. Dashboard: stat cards show numbers, alert feed loads, map has dots
   d. Navigate to /live-logs → log stream starts
   e. Navigate to /alerts → table shows alerts, filter works
   f. Investigate alert → status dot changes to yellow
   g. Navigate to /geo-map → world map renders
   h. Navigate to /ml-engine → metrics show, scatter renders
   i. Navigate to /anomalies → hero card shows worst score
   j. Navigate to /trends → bar chart renders
   k. Navigate to /rules → 8 rules loaded, toggle works
   l. Navigate to /settings (admin) → all 6 tabs accessible
   m. Navigate to /admin → profile, stats, activity, permissions
   n. Sign Out → redirects to /login

2. Known bug areas to check:
   □ recharts ResponsiveContainer needs explicit parent height
   □ WebSocket token might expire on long sessions
   □ SSE CORS headers needed on /api/logs/stream
   □ Geo dot positions might overflow map container

3. Fix all bugs found during testing

4. Performance check:
   Open browser DevTools → Performance tab
   Record 5 seconds of dashboard auto-refresh
   Check: no memory leaks (heap size stable)
   Check: no duplicate intervals (unmount/mount cycle)

COMMIT: "fix: integration test bug fixes"
COMMIT: "test: full end-to-end integration test passing"

SUCCESS GATE: Complete navigation through all 12 pages without errors.
              No console errors on any page.
              Memory usage stable over 30-second observation.
              WebSocket reconnects after 1-second backend restart.

DAY 4 DONE CHECKLIST:
□ All 12 React pages complete and rendering correctly
□ All pages wired to real backend APIs
□ WebSocket hook with exponential backoff reconnect
□ RBAC route protection working for all 3 roles
□ Signup end-to-end working
□ Settings page with all 6 tabs persisting to DB
□ Danger zone typed confirmation working
□ All loading states and error states handled
□ No console errors on any page
□ Performance: no memory leaks
□ Git: 8 commits on dev branch
```

---

## Day 5 — Docker Deployment + Testing + Polish

**Target:** Full stack running via docker-compose.full.yml. All tests passing. Demo-ready with realistic data. README complete.

---

### Hour 1-2 — Full Docker Stack

```
Task: docker-compose.full.yml starting all services including backend and frontend

EXECUTE IN ORDER:

1. Create backend/Dockerfile:
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 8000
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

2. Create ml/Dockerfile:
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["python", "pipeline.py"]

3. Create frontend/Dockerfile:
   Multi-stage build:
   Stage 1 (builder):
     FROM node:20-alpine AS builder
     WORKDIR /app
     COPY package*.json .
     RUN npm ci
     COPY . .
     RUN npm run build

   Stage 2 (server):
     FROM nginx:alpine
     COPY --from=builder /app/dist /usr/share/nginx/html
     COPY nginx.conf /etc/nginx/conf.d/default.conf
     EXPOSE 80

4. Create frontend/nginx.conf:
   server {
     listen 80;
     root /usr/share/nginx/html;
     index index.html;
     # SPA routing: all 404s serve index.html
     location / {
       try_files $uri $uri/ /index.html;
     }
     # API proxy to backend
     location /api {
       proxy_pass http://backend:8000;
       proxy_set_header Host $host;
     }
     location /ws {
       proxy_pass http://backend:8000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }

5. Create docker-compose.full.yml:
   Services: postgres, elasticsearch, kibana, logstash,
             backend, ml-pipeline, frontend
   All healthchecks defined
   All depends_on with condition: service_healthy
   Volumes: pg_data, es_data
   Environment: from .env.docker file

6. Create .env.docker:
   All production-like environment variables
   DATABASE_URL pointing to postgres service name
   ELASTICSEARCH_URL pointing to elasticsearch service name

7. Build and start full stack:
   docker-compose -f docker-compose.full.yml up --build

8. Wait for all services healthy:
   docker-compose -f docker-compose.full.yml ps
   All services must show "healthy" status

9. Test via Docker:
   curl http://localhost:3000         → React app loads
   curl http://localhost:8000/api/health → {status: "ok"}
   curl http://localhost:9200          → Elasticsearch

COMMIT: "feat: complete docker-compose.full.yml all services"

SUCCESS GATE: docker-compose up --build completes without errors.
              All 7 services show healthy.
              http://localhost:3000 loads login page.
              Login with admin credentials works.
              Dashboard shows data.
```

### Hour 3 — Demo Data + Polish

```
Task: Realistic demo data loaded. UI polished and production-looking.

EXECUTE IN ORDER:

1. Enhance backend/seed.py with rich demo data:
   - 25 alerts: mix of all 4 severities and all 3 statuses
   - Realistic timestamps spanning last 24 hours
   - Varied source IPs, countries, attack types
   - IF scores that demonstrate the spectrum
   - Assign some alerts to admin user

2. Seed ML results:
   - 50 ML result records
   - 5 anomaly records with full feature vectors
   - All 6 attack types represented

3. Run seed in Docker:
   docker exec securewatch-api python seed.py

4. UI Polish checklist:
   □ Logo renders at correct size in all contexts
   □ All page titles have correct SVG icon
   □ All tables have correct column widths
   □ Recharts tooltips styled correctly (dark theme)
   □ All filter pills have active state
   □ Modal backdrop blur or dark overlay
   □ Toast notifications positioned bottom-right
   □ No horizontal scroll on any page
   □ All timestamps showing relative time correctly
   □ Severity colours consistent throughout

5. Create 14-screenshot demo set:
   Screenshot every page loaded with full data
   Save to docs/screenshots/

COMMIT: "feat: rich demo data and UI polish pass"

SUCCESS GATE: Dashboard shows 25 alerts across all severities.
              All 12 pages screenshot-ready.
              No visual glitches on 1440x900 viewport.
```

### Hour 4 — Complete Test Suite

```
Task: All tests passing. Test coverage adequate for demo.

EXECUTE IN ORDER:

1. Run all backend tests:
   pytest tests/ -v --tb=short

   tests/test_auth.py          — 9 tests
   tests/test_api_endpoints.py — 10 tests
   tests/test_ml_pipeline.py   — 6 tests

   ALL MUST PASS.

2. Fix any failing tests before proceeding.

3. Create tests/test_integration.py:
   test_full_login_to_alert_flow():
     a. POST /api/auth/login → get token
     b. GET /api/stats → verify shape
     c. GET /api/alerts → verify array
     d. POST /api/alerts/first_id/status { status: investigating }
     e. GET /api/alerts → verify status changed
     f. GET /api/rules → verify 8 rules
     g. PATCH /api/rules/BF-001 { enabled: false }
     h. GET /api/rules → verify BF-001 disabled

   test_ml_pipeline_end_to_end():
     a. Create mock log event with brute force features
     b. score_event(event) → assert is_anomaly=True
     c. create_alert_from_result() → assert Alert in DB
     d. GET /api/alerts → assert new alert present

   Run: pytest tests/test_integration.py -v
   Both tests must pass.

4. Run tests inside Docker:
   docker exec securewatch-api pytest tests/ -v
   All must pass inside container environment.

COMMIT: "test: integration tests and full test suite passing"

SUCCESS GATE: pytest tests/ shows 0 failures, 0 errors.
              All tests pass inside Docker container.
              test_full_login_to_alert_flow passes completely.
```

### Hour 5 — Security Hardening + Production Config

```
Task: Critical security settings confirmed before any demo.

EXECUTE IN ORDER:

1. Verify in .env.docker:
   □ JWT_SECRET_KEY is minimum 32 characters, not "change-me"
   □ DB_PASSWORD is not "devpassword123"
   □ CORS_ORIGINS is set to specific origin, not "*"

2. Verify in FastAPI app.py:
   □ Rate limiting on /api/auth/login (10/minute)
   □ Rate limiting on /api/auth/register (5/minute)
   □ Request body size limit: 1MB max
   □ HTTPS headers if behind proxy

3. Verify PostgreSQL:
   □ No superuser access from application
   □ Application connects as limited-permission user

4. Verify Elasticsearch:
   □ No direct public access on port 9200
   □ Only backend container can reach ES

5. Verify Docker network:
   □ Frontend only exposes port 3000/80
   □ Backend exposes 8000
   □ PostgreSQL does NOT expose port externally in production compose
   □ Elasticsearch does NOT expose 9200 externally in production compose

6. Set environment-specific .env files:
   .env              — local development
   .env.docker       — docker compose
   .env.production   — cloud deployment (never committed)

COMMIT: "security: production environment hardening"

SUCCESS GATE: JWT secret is not default value.
              CORS not wildcard in production config.
              Database port not exposed publicly in production compose.
```

### Hour 6 — README + Documentation

```
Task: README.md complete with all setup instructions

EXECUTE IN ORDER:

1. Complete README.md sections:

   # SecureWatch AI

   ## Quick Start (3 commands)
   git clone [repo]
   cd securewatch-ai
   docker-compose -f docker-compose.full.yml up --build
   Open http://localhost:3000

   ## Default Login
   Email: admin@securewatch.local
   Password: Admin@123456

   ## Architecture Overview
   [Copy simplified diagram from PRD]

   ## Manual Setup (without Docker)
   Backend: pip install + uvicorn
   Frontend: npm install + npm run dev
   ELK: docker-compose up in elk/

   ## Environment Variables
   [Table of all env vars with descriptions and defaults]

   ## API Reference
   [Link to or embed key routes]

   ## ML Models
   Training: python ml/train_isolation_forest.py
   Training: python ml/train_rf_classifier.py

   ## Running Tests
   pytest tests/ -v

   ## Ports
   [Table of all service ports]

2. Update all inline code comments:
   Every Python function: one-line docstring
   Every React component: prop description comment at top

COMMIT: "docs: complete README with setup instructions"
```

### Hour 7 — Final System Test

```
Task: Complete demo run-through. Every click verified.

EXECUTE IN ORDER:

Execute this exact demo flow with the Docker stack running:

START FRESH:
  docker-compose -f docker-compose.full.yml down -v
  docker-compose -f docker-compose.full.yml up -d --build
  Wait for all services healthy

DEMO FLOW (verify each step):
  1. Open http://localhost:3000 → login page loads ✓
  2. Enter: admin@securewatch.local / Admin@123456 → navigate to dashboard ✓
  3. Dashboard: 4 stat cards show numbers ✓
  4. Dashboard: alert feed shows 6 alerts ✓
  5. Dashboard: geo map has pulsing dots ✓
  6. Dashboard: numbers refresh every 2 seconds ✓
  7. Click "View All" → navigate to /alerts ✓
  8. Alerts page: table with 25 alerts ✓
  9. Filter "Critical" → table shows only critical ✓
  10. Click "Investigate" on first alert → status dot turns yellow ✓
  11. Click "Block IP" → modal opens, confirm → toast success ✓
  12. Navigate to /live-logs → log stream starts ✓
  13. Pause stream → logs freeze ✓
  14. Resume → logs continue ✓
  15. Filter "CRIT" → only CRIT rows visible ✓
  16. Navigate to /geo-map → world map with dots ✓
  17. Navigate to /ml-engine → metrics cards load ✓
  18. Click "Retrain Model" → toast appears ✓
  19. Navigate to /anomalies → hero card shows -0.92 ✓
  20. Navigate to /trends → bar chart renders ✓
  21. Click "30 Days" → chart updates ✓
  22. Navigate to /rules → 8 rules in table ✓
  23. Toggle first rule off → toggle flips ✓
  24. Click "+ New Rule" → modal opens ✓
  25. Fill form, save → new rule appears in table ✓
  26. Navigate to /settings (admin) → all 6 tabs ✓
  27. Change system name, save → toast success ✓
  28. Click "Test + Save" → connections show green ✓
  29. Navigate to /admin → profile, stats, activity ✓
  30. Click "Sign Out" → redirects to login ✓

Record any failures → fix immediately

COMMIT: "test: final demo run-through all 30 steps passing"
```

### Hour 8 — Git Cleanup + Final Checks

```
Task: Clean git history, tag release, final production checklist

EXECUTE IN ORDER:

1. Create production readiness checklist (see below)
   Complete every item

2. Merge dev branch to main:
   git checkout main
   git merge dev --no-ff -m "release: SecureWatch AI v3.0.0"

3. Tag release:
   git tag -a v3.0.0 -m "SecureWatch AI v3.0.0 — Demo Ready"
   git push origin main --tags

4. Final git log review:
   git log --oneline
   Should show 30+ meaningful commits

COMMIT: "chore: release v3.0.0 demo ready"
```

---

## Module Completion Checklist

```
BACKEND MODULES
───────────────
□ models/database.py      — engine, Base, get_db
□ models/user.py          — User model with all fields
□ models/alert.py         — Alert model with all fields
□ models/rule.py          — Rule + RuleHit models
□ models/ml_result.py     — MLResult model
□ models/audit_log.py     — AuditLog model
□ models/blocked_ip.py    — BlockedIP model
□ models/settings.py      — Setting model
□ config.py               — all env vars loaded
□ services/jwt_service.py — create, decode, hash, verify
□ middleware/auth.py       — get_current_user, require_admin, require_permission
□ routes/auth.py           — login, register, check-email, me
□ routes/stats.py          — /api/stats
□ routes/alerts.py         — CRUD + resolve-all
□ routes/geo.py            — /api/geo, /api/geo/stats, /api/top-ips
□ routes/ml.py             — metrics, classification, scores, anomalies, config, retrain
□ routes/rules.py          — CRUD rules
□ routes/user.py           — profile, stats, activity, permissions, change-password
□ routes/settings.py       — all 9 settings routes
□ routes/logs.py           — SSE stream, WebSocket, /api/logs
□ routes/firewall.py       — block, blocked list, unblock
□ routes/trends.py         — trends, stats, breakdown
□ app.py                   — all routers registered, CORS, exception handlers
□ seed.py                  — admin user, 8 rules, 25 alerts, ML results

ML MODULES
──────────
□ ml/generate_training_data.py  — 50k normal + 600 attack samples
□ ml/feature_extraction.py      — extract_features() → ndarray(1,12)
□ ml/train_isolation_forest.py  — train, evaluate, save model.pkl
□ ml/train_rf_classifier.py     — train, evaluate, save classifier.pkl
□ ml/predict.py                 — load_models, score_event
□ ml/pipeline.py                — run_pipeline, create_alert_from_result
□ ml/retrain_cron.py            — daily retrain job

ELK MODULES
───────────
□ elk/docker-compose.yml       — ES, Kibana, Logstash services
□ elk/logstash.conf            — Grok patterns for SSH, Apache, sudo
□ elk/filebeat.yml             — input paths, logstash output

REACT MODULES
─────────────
□ src/index.css                — CSS variables, reset, utilities
□ src/index.jsx                — BrowserRouter, AuthProvider, Toaster
□ src/App.jsx                  — all routes, PrivateRoute, PublicRoute, Suspense
□ src/context/AuthContext.jsx  — login, logout, user, loading
□ src/hooks/useAutoRefresh.js  — setInterval with cleanup
□ src/hooks/useWebSocket.js    — connect, reconnect, status
□ src/services/api.js          — axios instance, interceptors, tokenStorage
□ src/services/authAPI.js      — login, register, checkEmail, me
□ src/services/alertsAPI.js    — getAll, updateStatus, resolveAll
□ src/services/geoAPI.js       — getAttacks, getStats, getTopIPs
□ src/services/mlAPI.js        — all 7 ML endpoints
□ src/services/rulesAPI.js     — CRUD
□ src/services/userAPI.js      — profile, stats, activity, permissions, update, changePassword
□ src/services/settingsAPI.js  — all 10 settings endpoints
□ src/services/logsAPI.js      — get, stream
□ src/components/ui/Icon.jsx   — all 22 SVG icons
□ src/components/ui/Logo.jsx   — sharp geometric mark
□ src/components/ui/Badge.jsx  — severity badges
□ src/components/ui/StatCard.jsx — stat card with accent line
□ src/components/ui/Toggle.jsx — custom toggle switch
□ src/components/ui/Button.jsx — all 4 variants
□ src/components/ui/Modal.jsx  — confirmation modal with typed input
□ src/components/layout/Topbar.jsx   — complete
□ src/components/layout/Sidebar.jsx  — complete with collapse
□ src/components/layout/AppLayout.jsx — shell
□ src/components/pages/Login.jsx     — complete
□ src/components/pages/Signup.jsx    — complete
□ src/components/pages/Dashboard.jsx — complete
□ src/components/pages/LiveLogs.jsx  — complete
□ src/components/pages/Alerts.jsx    — complete
□ src/components/pages/GeoMap.jsx    — complete
□ src/components/pages/MLEngine.jsx  — complete
□ src/components/pages/Anomalies.jsx — complete
□ src/components/pages/Trends.jsx    — complete
□ src/components/pages/Rules.jsx     — complete
□ src/components/pages/Settings.jsx  — complete
□ src/components/pages/Admin.jsx     — complete

DOCKER MODULES
──────────────
□ backend/Dockerfile
□ ml/Dockerfile
□ frontend/Dockerfile
□ frontend/nginx.conf
□ docker-compose.dev.yml
□ docker-compose.full.yml
□ .env
□ .env.docker

TESTS
─────
□ tests/test_auth.py            — 9 tests
□ tests/test_api_endpoints.py   — 10 tests
□ tests/test_ml_pipeline.py     — 6 tests
□ tests/test_integration.py     — 2 integration tests

TOTAL FILES: 65+
```

---

## Production Readiness Checklist

```
SECURITY
□ JWT secret key is not "change-me" or any default value
□ bcrypt cost factor is 12 (not less)
□ CORS origins locked to specific frontend domain
□ Rate limiting on auth endpoints
□ SQL injection impossible (SQLAlchemy ORM only)
□ No secrets in any committed file
□ .env files in .gitignore
□ PostgreSQL not exposed publicly in production compose
□ Elasticsearch not exposed publicly in production compose

BACKEND
□ All 48 API routes returning correct HTTP status codes
□ All routes requiring JWT return 401 without token
□ All admin routes return 403 for non-admin users
□ Global exception handlers return JSON (not HTML 500 pages)
□ /api/health returns 200 with all services connected
□ Audit log written for all sensitive actions
□ All Pydantic models validate incoming data
□ Danger zone endpoints require exact typed confirmation

FRONTEND
□ No console errors on any of the 12 pages
□ All 22 SVG icons rendering correctly
□ Zero border-radius on any element (except toggle thumb)
□ CSS variables used everywhere (no hardcoded colours)
□ All pages handle loading state
□ All pages handle empty state
□ All pages handle error state
□ WebSocket reconnects after disconnect
□ Token persists across browser refresh
□ Sign out clears all tokens
□ Viewer role cannot access admin/analyst routes

ML
□ model.pkl loads without error
□ classifier.pkl loads without error
□ Feature extraction returns shape (1, 12) for any input
□ Normal event scores > -0.7 (not flagged)
□ Brute force event scores < -0.7 (correctly flagged)
□ RF classifier returns one of 6 valid class names
□ Pipeline runs without crashing
□ Alert written to DB within 15 seconds of event

DOCKER
□ docker-compose.full.yml builds without errors
□ All 7 services start in correct dependency order
□ All healthchecks pass
□ Frontend accessible at http://localhost:3000
□ Backend accessible at http://localhost:8000
□ Elasticsearch accessible at http://localhost:9200

TESTS
□ pytest tests/ shows 0 failures
□ Tests pass inside Docker container
□ Integration test covers login → alert → resolve flow

DEMO
□ 25 demo alerts loaded with varied severities
□ All 12 pages navigable without errors
□ 30-step demo flow completes without any error
□ Reload any page → stays on that page (no auth loop)
□ README has 3-command quick start
□ Default credentials documented
```

---

## Risk Mitigation Table

| Risk                                  | Probability | Impact | Mitigation                                                |
| ------------------------------------- | ----------- | ------ | --------------------------------------------------------- |
| ELK Stack OOM on laptop               | High        | High   | Set ES_JAVA_OPTS=-Xms512m -Xmx512m for dev                |
| Docker build fails on M1/M2 Mac       | Medium      | High   | Add platform: linux/amd64 to compose services             |
| ML accuracy below 70%                 | Low         | Medium | Increase training data to 100k rows, adjust class weights |
| JWT library version conflict          | Low         | High   | Pin exact versions in requirements.txt                    |
| Vite proxy not routing WS correctly   | Medium      | Medium | Test WS connection early Day 3 Hour 5                     |
| Recharts not rendering in Docker      | Low         | Medium | Use ResponsiveContainer with explicit height wrapper      |
| PostgreSQL connection pool exhausted  | Low         | High   | Set pool_size=5 for dev, add pool_pre_ping=True           |
| SSE CORS error in browser             | Medium      | Medium | Add Access-Control-Allow-Origin header to SSE route       |
| react-hot-toast borderRadius override | Low         | Low    | Add borderRadius: 0 to toastOptions style                 |
| Alembic migration conflict            | Low         | Medium | Use --autogenerate only, never edit migration files       |

---

## Debugging Strategy

### Backend Debugging

```
1. Start with /api/health — if this fails, Docker networking is broken
2. Check docker logs for each service: docker logs <container> -f
3. JWT issues: add print(payload) inside decode_token() temporarily
4. Database issues: run alembic history and alembic current
5. SQLAlchemy errors: set echo=True on engine temporarily
6. ES connection: curl http://localhost:9200/_cluster/health
7. All routes: run pytest tests/ -v -x (stop on first failure)
```

### Frontend Debugging

```
1. Network tab in DevTools: check every API call for 4xx/5xx
2. Console tab: any red error is a bug, fix immediately
3. React DevTools: inspect component state
4. Check AuthContext: if user is null when it should not be,
   check tokenStorage.get() and the /api/auth/me call
5. WebSocket: Network tab → WS filter → check frames arriving
6. CSS issues: use browser inspector, check which CSS variable is wrong
7. recharts blank: usually missing explicit height on parent div
```

### Git Commit Strategy

```
COMMIT TYPES:
infra:    Docker, docker-compose, nginx changes
feat:     New feature or endpoint
fix:      Bug fix
test:     Adding or fixing tests
docs:     README, comments, documentation
refactor: Code restructure, no behaviour change
chore:    Dependency updates, scaffolding

COMMIT FREQUENCY:
Every hour minimum. Every feature complete. Before every test run.

BRANCH STRATEGY:
main   — only merged from dev when all tests pass
dev    — all daily development

NEVER COMMIT:
- .env files
- model.pkl or classifier.pkl (add to .gitignore)
- node_modules/
- __pycache__/
- *.db files

TARGET: 35-40 meaningful commits across 5 days
```

---

## 5-Day Summary

| Day   | Primary Output                                                   | Success Gate                                             |
| ----- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Day 1 | Full FastAPI backend, all 48 routes, auth, JWT, seeded DB        | pytest 25 tests pass, /api/health returns 200            |
| Day 2 | ML pipeline trained, ELK stack parsing logs, alerts in DB        | End-to-end: inject log → ML scores → alert in DB         |
| Day 3 | React app, 8 pages complete, login/dashboard/logs/alerts working | Login works, dashboard auto-refreshes, SSE streams       |
| Day 4 | All 12 pages complete, WebSocket with reconnect, RBAC            | All 12 pages navigate without errors, WS reconnects      |
| Day 5 | Full Docker stack, tests passing, demo data, README              | docker-compose up → 30-step demo completes without error |
