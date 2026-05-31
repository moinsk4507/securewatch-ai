markdown# ARCHITECTURE.md — SecureWatch AI System Design

## System Overview
Browser (React)
│
├── HTTPS REST → FastAPI :8000
│                   │
│                   ├── PostgreSQL :5432 (users, alerts, rules, settings)
│                   ├── Elasticsearch :9200 (logs, ML results)
│                   └── ML Models (model.pkl, classifier.pkl)
│
└── WebSocket WSS → FastAPI /ws/logs (live log stream)
Log Sources → Filebeat → Logstash :5044 → Elasticsearch
│
ML Pipeline
│
Alert → PostgreSQL → API → Dashboard

## Frontend Architecture
src/
├── App.jsx              Routes + PrivateRoute + PublicRoute
├── index.jsx            ReactDOM + BrowserRouter + AuthProvider
├── index.css            CSS variables + reset + utilities
├── context/
│   └── AuthContext.jsx  Global auth state (user, login, logout)
├── hooks/
│   ├── useAutoRefresh   setInterval wrapper
│   └── useWebSocket     WS connection + exponential backoff reconnect
├── services/            One file per API domain (axios calls)
└── components/
├── ui/              Icon, Logo, Badge, StatCard, Toggle, Button, Modal
├── layout/          Topbar, Sidebar, AppLayout
└── pages/           12 page components (one per route)

## Backend Architecture
app.py                   FastAPI entry + CORS + lifespan + exception handlers
config.py                Environment variables
├── routes/              One Blueprint per domain
│   ├── auth.py          /api/auth/*
│   ├── alerts.py        /api/alerts/*
│   ├── stats.py         /api/stats
│   ├── geo.py           /api/geo, /api/top-ips
│   ├── ml.py            /api/ml/*
│   ├── rules.py         /api/rules/*
│   ├── user.py          /api/user/*
│   ├── settings.py      /api/settings/*
│   ├── logs.py          /api/logs/stream (SSE) + /ws/logs (WebSocket)
│   └── firewall.py      /api/firewall/*
├── middleware/
│   └── auth_middleware  get_current_user, require_admin, require_permission
├── models/              SQLAlchemy ORM models (8 tables)
└── services/
├── jwt_service      create_access_token, decode_token, hash_password
└── ml_service       load_models, score_event

## Database Schema (8 tables)
users         id, email, password, name, role, created_at, last_login, is_active
alerts        id, severity, name, source_ip, ml_classification, if_score, status, country, attack_type
rules         id, name, condition, severity, action, enabled, hits_today
rule_hits     id, rule_id(FK), alert_id(FK), triggered_at
ml_results    id, event_id, if_score, is_anomaly, rf_class, rf_confidence, features(JSONB)
audit_logs    id, user_id(FK), action, resource, ip_address, success, timestamp
blocked_ips   id, ip_address, reason, blocked_by(FK), is_active
settings      key, value, value_type, category, updated_at

## ML Pipeline
Log Event (dict)
↓
feature_extraction.py → numpy array (1, 12)
↓
IsolationForest.decision_function() → score (float)
↓
score < -0.70? → YES → RandomForestClassifier.predict() → class (0-5)
↓
Alert created in PostgreSQL + Elasticsearch
↓
FastAPI /api/alerts → Dashboard (< 15 seconds total)

## 12 ML Features (exact order)
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

## 6 Attack Classes
0 = Brute Force SSH
1 = Port Scan / Recon
2 = DDoS Pattern
3 = Slow Brute Force
4 = Geographic Anomaly
5 = Privilege Escalation

## Authentication Flow
POST /api/auth/login
↓
bcrypt.checkpw(password, stored_hash)
↓
create_access_token(id, email, role, name)
↓
JWT payload: {id, email, role, name, exp, iat, jti}
↓
Client: tokenStorage.set(token, remember)
↓
Every request: Authorization: Bearer <token>
↓
FastAPI Depends(get_current_user) → decode_token() → User object
↓
401 → axios interceptor → tokenStorage.clear() → /login

## RBAC
admin   → all 13 permissions
analyst → view_dashboard, view_live_logs, manage_alerts, create_rules, view_raw_logs, export_data, block_ips
viewer  → view_dashboard only

## WebSocket Reconnect
Connect → onopen → status: connected
Error  → onclose (not 1000/4001) → wait 1s → reconnect
Retry  → 1s, 2s, 5s, 10s, 30s (exponential)
4001   → auth failure → clear token → /login
1000   → clean close → no reconnect

## Ports
3000  Frontend (React dev / nginx)
8000  Backend (FastAPI)
5432  PostgreSQL
9200  Elasticsearch
5601  Kibana
5044  Logstash Beats input

