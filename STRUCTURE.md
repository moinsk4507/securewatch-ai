markdown# STRUCTURE.md — SecureWatch AI Codebase Structure

## Root
securewatch-ai/
├── backend/              FastAPI application
├── ml/                   ML training and pipeline
├── frontend/             React.js application
├── elk/                  ELK Stack Docker config
├── data/                 Training data CSV files
├── tests/                Backend test files
├── docker-compose.dev.yml    Dev: PostgreSQL + ELK
├── docker-compose.full.yml   Full stack deployment
├── .gitignore
└── README.md

## Backend
backend/
├── app.py                FastAPI app, CORS, routers, exception handlers
├── config.py             Load all env vars with defaults
├── seed.py               Seed admin user + 8 rules + 25 alerts
├── requirements.txt
├── .env
├── Dockerfile
├── models/
│   ├── init.py
│   ├── database.py       engine, SessionLocal, Base, get_db()
│   ├── user.py           User table
│   ├── alert.py          Alert table
│   ├── rule.py           Rule + RuleHit tables
│   ├── ml_result.py      MLResult table
│   ├── audit_log.py      AuditLog table
│   ├── blocked_ip.py     BlockedIP table
│   └── settings.py       Settings key-value table
├── middleware/
│   ├── init.py
│   └── auth_middleware.py   get_current_user, require_admin, require_permission
├── routes/
│   ├── auth.py           login, register, check-email, me
│   ├── stats.py          /api/stats
│   ├── alerts.py         alert CRUD + resolve-all
│   ├── geo.py            /api/geo + /api/top-ips
│   ├── ml.py             metrics, classification, scores, anomalies, retrain
│   ├── rules.py          rules CRUD
│   ├── user.py           profile, stats, activity, permissions, change-password
│   ├── settings.py       all settings + danger zone
│   ├── logs.py           SSE stream + WebSocket
│   ├── firewall.py       block/unblock IPs
│   └── trends.py         trends data
└── services/
├── jwt_service.py    create_access_token, decode_token, hash_password, verify_password
└── ml_service.py     load_models, score_event (wraps ml/predict.py)

## ML
ml/
├── generate_training_data.py    Creates normal_logs.csv (50k rows) + labelled_attacks.csv (600 rows)
├── feature_extraction.py        extract_features(dict) → ndarray(1,12)
├── train_isolation_forest.py    Train IF, evaluate, save model.pkl
├── train_rf_classifier.py       Train RF, evaluate, save classifier.pkl
├── predict.py                   load_models(), score_event(dict) → dict|None
├── pipeline.py                  Poll ES every 5s, score events, write alerts
├── retrain_cron.py              Daily retrain job
├── model.pkl                    Trained IF model (generated, not committed)
├── classifier.pkl               Trained RF model (generated, not committed)
└── requirements.txt

## Frontend
frontend/
├── index.html            Vite entry + Google Fonts (Syne + JetBrains Mono)
├── vite.config.js        Aliases + proxy /api → :8000, /ws → ws://:8000
├── package.json
├── .env                  VITE_API_URL, VITE_WS_URL
├── Dockerfile            Multi-stage: node build → nginx serve
├── nginx.conf            SPA routing + /api proxy + /ws WebSocket proxy
└── src/
├── index.jsx         ReactDOM.createRoot + BrowserRouter + AuthProvider + Toaster
├── App.jsx           All 12 routes + PrivateRoute + PublicRoute + Suspense
├── index.css         ALL CSS variables + reset + shared classes
├── context/
│   └── AuthContext.jsx
├── hooks/
│   ├── useAutoRefresh.js
│   └── useWebSocket.js
├── services/
│   ├── api.js             axios instance + interceptors + tokenStorage
│   ├── authAPI.js
│   ├── alertsAPI.js
│   ├── statsAPI.js
│   ├── geoAPI.js
│   ├── mlAPI.js
│   ├── rulesAPI.js
│   ├── userAPI.js
│   ├── settingsAPI.js
│   └── logsAPI.js
└── components/
├── ui/
│   ├── Icon.jsx       22 SVG icons, stroke-based, square linecap
│   ├── Logo.jsx       Sharp geometric SVG mark
│   ├── Badge.jsx      Severity badge (critical/high/medium/low/info)
│   ├── StatCard.jsx   Stat card with 2px top accent line
│   ├── Toggle.jsx     Custom toggle switch
│   ├── Button.jsx     primary/secondary/danger/action variants
│   └── Modal.jsx      Confirmation modal + typed input support
├── layout/
│   ├── AppLayout.jsx  Topbar + Sidebar + content wrapper
│   ├── Topbar.jsx     Logo, live dot, search, alerts btn, avatar
│   └── Sidebar.jsx    Nav items, collapse, ML status footer
└── pages/
├── Login.jsx
├── Signup.jsx
├── Dashboard.jsx
├── LiveLogs.jsx
├── Alerts.jsx
├── GeoMap.jsx
├── MLEngine.jsx
├── Anomalies.jsx
├── Trends.jsx
├── Rules.jsx
├── Settings.jsx
└── Admin.jsx

## ELK
elk/
├── docker-compose.yml    elasticsearch + kibana + logstash
├── logstash.conf         Grok patterns for SSH, Apache, sudo logs
└── filebeat.yml          Input paths + logstash output

## Data
data/
├── normal_logs.csv       50,000 normal log feature rows (generated)
└── labelled_attacks.csv  600 labelled attack rows, 6 classes (generated)

## Tests
tests/
├── test_auth.py              9 auth tests
├── test_api_endpoints.py     10 API tests
├── test_ml_pipeline.py       6 ML tests
└── test_integration.py       2 end-to-end tests

## Environment Variables
backend/.env:
DATABASE_URL=postgresql://securewatch:password@localhost:5432/securewatch
ELASTICSEARCH_URL=http://localhost:9200
JWT_SECRET_KEY=minimum-32-character-secret-key
JWT_EXPIRY_HOURS=8
CORS_ORIGINS=http://localhost:3000
ML_MODEL_PATH=../ml/model.pkl
ML_CLASSIFIER_PATH=../ml/classifier.pkl
frontend/.env:
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

## Data Flow
User logs in → JWT token → stored in localStorage/sessionStorage
Every API call → axios adds Bearer token → FastAPI validates
Dashboard loads → fetchStats + fetchAlerts + fetchGeoData → renders
Live Logs opens → EventSource('/api/logs/stream') → appends rows
Alert fires → ML pipeline → PostgreSQL → /api/alerts → dashboard