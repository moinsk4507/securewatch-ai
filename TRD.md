# SecureWatch AI — Technical Requirements Document v1.0

**Classification:** Internal Engineering Document
**Version:** 1.0
**Date:** April 2025
**Author:** Engineering Architecture Team
**Status:** Approved for Implementation

---

## Document Control

| Version | Date | Change |
|---|---|---|
| 1.0 | April 2025 | Initial TRD — React.js frontend migration from Vanilla JS |

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React.js 18 + Vite  │  Browser  │  WebSocket Client            │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTPS / WSS
┌────────────────────────────────▼────────────────────────────────┐
│                        API GATEWAY LAYER                         │
│  FastAPI  │  JWT Middleware  │  RBAC  │  CORS  │  Rate Limiting  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                       │
┌─────────▼────────┐  ┌──────────▼────────┐  ┌──────────▼────────┐
│  PostgreSQL DB    │  │  ML Pipeline      │  │  ELK Stack         │
│  SQLAlchemy ORM   │  │  IF + RF Models   │  │  ES + Logstash     │
│  Alembic Migr.    │  │  scikit-learn     │  │  Kibana + Filebeat │
└──────────────────┘  └───────────────────┘  └────────────────────┘
          │                      │                       │
┌─────────▼──────────────────────▼───────────────────────▼────────┐
│                       DOCKER LAYER                                │
│  docker-compose.full.yml — All services containerised            │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

- **Separation of concerns** — Frontend, Backend, ML, and ELK are independently deployable
- **Contract-first API** — All API contracts defined in PRD are immutable
- **Stateless backend** — All state lives in PostgreSQL, Redis (future), or JWT claims
- **Real-time first** — WebSocket for live logs, polling for dashboard stats
- **Fail-safe ML** — Rule-based detection runs in parallel as fallback if ML service is down

### 1.3 Communication Protocols

| Communication | Protocol | Format |
|---|---|---|
| React to FastAPI | HTTPS REST | JSON |
| React live logs | WebSocket WSS | JSON frames |
| FastAPI to PostgreSQL | TCP via SQLAlchemy | SQL |
| FastAPI to Elasticsearch | HTTP REST | JSON |
| Filebeat to Logstash | Beats protocol TCP 5044 | Binary |
| Logstash to Elasticsearch | HTTP REST | JSON |
| ML service to Elasticsearch | HTTP REST | JSON |

---

## 2. Frontend React Architecture

### 2.1 Technology Decisions

| Technology | Version | Justification |
|---|---|---|
| React.js | 18.2.0 | Component model, hooks, concurrent features |
| Vite | 5.x | Sub-second HMR, ES modules, fast production build |
| React Router DOM | 6.x | Declarative client-side routing |
| Axios | 1.6.x | Interceptors for JWT, error normalisation |
| Recharts | 2.12.x | Composable charts, no canvas dependencies |
| react-hot-toast | 2.4.x | Non-blocking feedback toasts |
| Framer Motion | 11.x | Optional — page transitions and micro-animations |

**Strictly excluded:** Next.js, Tailwind CSS, Material UI, Chakra UI, Bootstrap, Firebase, Supabase, MongoDB

### 2.2 Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/components/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          http:   ['axios'],
        },
      },
    },
  },
});
```

### 2.3 Frontend Folder Structure

```
frontend/
├── index.html                        # Vite HTML entry point
├── vite.config.js                    # Vite + alias config
├── package.json                      # Dependencies
├── .env                              # VITE_API_URL, VITE_WS_URL
├── .env.production                   # Production overrides
│
└── src/
    ├── index.jsx                     # ReactDOM createRoot, BrowserRouter
    ├── App.jsx                       # Route definitions, PrivateRoute, layout
    ├── index.css                     # CSS variables, reset, shared utilities
    │
    ├── context/
    │   └── AuthContext.jsx           # Auth state, login(), logout(), user object
    │
    ├── hooks/
    │   ├── useAutoRefresh.js         # setInterval wrapper with cleanup
    │   ├── useWebSocket.js           # WebSocket connection with reconnect
    │   └── useToast.js               # react-hot-toast wrapper
    │
    ├── services/
    │   ├── api.js                    # axios instance, interceptors, base config
    │   ├── authAPI.js                # login, register, check-email, me
    │   ├── statsAPI.js               # get stats
    │   ├── alertsAPI.js              # get, update status, resolve-all
    │   ├── geoAPI.js                 # geo attacks, stats, top IPs
    │   ├── mlAPI.js                  # metrics, classification, scores, retrain
    │   ├── rulesAPI.js               # CRUD rules
    │   ├── userAPI.js                # profile, stats, activity, permissions
    │   ├── settingsAPI.js            # get, save sections, test connections
    │   └── logsAPI.js                # get logs, stream
    │
    └── components/
        ├── ui/
        │   ├── Icon.jsx              # All 22 SVG icons as React component
        │   ├── Logo.jsx              # Sharp geometric SVG logo mark
        │   ├── Badge.jsx             # Severity badge component
        │   ├── StatCard.jsx          # Reusable stat card with accent line
        │   ├── Toggle.jsx            # Toggle switch component
        │   ├── Button.jsx            # Reusable button variants
        │   └── Modal.jsx             # Confirmation modal component
        │
        ├── layout/
        │   ├── AppLayout.jsx         # Topbar + Sidebar + page content wrapper
        │   ├── Topbar.jsx            # Logo, live dot, search, alerts, avatar
        │   └── Sidebar.jsx           # Nav items, badges, collapse, ML status
        │
        └── pages/
            ├── Login.jsx             # Auth card, form, SSO
            ├── Signup.jsx            # Role selector, strength meter, register
            ├── Dashboard.jsx         # Stats, feed, geo map, IPs, timeline
            ├── LiveLogs.jsx          # WebSocket stream, filters, scroll
            ├── Alerts.jsx            # Filter pills, table, actions
            ├── GeoMap.jsx            # World map, country table, stats
            ├── MLEngine.jsx          # Metrics, confidence bars, scatter
            ├── Anomalies.jsx         # Hero card, anomaly table
            ├── Trends.jsx            # Bar charts, period toggle
            ├── Rules.jsx             # Table, toggle, modal
            ├── Settings.jsx          # Six-tab panel, danger zone
            └── Admin.jsx             # Profile, stats, activity, permissions
```

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
backend/
├── app.py                            # FastAPI entry point, lifespan, CORS, routers
├── config.py                         # Settings from environment variables
├── requirements.txt                  # Python dependencies
├── .env                              # Secrets (not committed)
├── alembic.ini                       # Database migration config
├── alembic/
│   └── versions/                     # Migration scripts
│
├── models/
│   ├── __init__.py
│   └── models.py                     # SQLAlchemy: User, Alert, Rule, AuditLog, Settings
│
├── middleware/
│   ├── __init__.py
│   └── auth_middleware.py            # JWT verify, RBAC decorators
│
├── routes/
│   ├── auth.py                       # /api/auth/*
│   ├── stats.py                      # /api/stats
│   ├── alerts.py                     # /api/alerts/*
│   ├── geo.py                        # /api/geo, /api/top-ips
│   ├── ml.py                         # /api/ml/*
│   ├── rules.py                      # /api/rules/*
│   ├── user.py                       # /api/user/*
│   ├── settings.py                   # /api/settings/*
│   ├── logs.py                       # /api/logs/*, WebSocket /ws/logs
│   └── firewall.py                   # /api/firewall/*
│
├── services/
│   ├── es_client.py                  # Elasticsearch connection and queries
│   └── ml_service.py                 # Load models, score events
│
└── tests/
    ├── test_auth.py
    ├── test_api_endpoints.py
    └── test_ml_pipeline.py
```

### 3.2 FastAPI Application Entry Point

```python
# app.py — structure specification
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models.models import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables, seed default data
    Base.metadata.create_all(bind=engine)
    seed_default_users()
    seed_default_rules()
    yield
    # Shutdown: cleanup

app = FastAPI(
    title="SecureWatch AI API",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers with /api prefix
app.include_router(auth_router,     prefix="/api/auth")
app.include_router(stats_router,    prefix="/api")
app.include_router(alerts_router,   prefix="/api")
app.include_router(geo_router,      prefix="/api")
app.include_router(ml_router,       prefix="/api/ml")
app.include_router(rules_router,    prefix="/api")
app.include_router(user_router,     prefix="/api/user")
app.include_router(settings_router, prefix="/api/settings")
app.include_router(logs_router,     prefix="/api")
app.include_router(firewall_router, prefix="/api")
```

### 3.3 Dependency Injection Pattern

```python
# Shared FastAPI dependencies used across all routes

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # Verify JWT, return User object
    # Raises HTTPException 401 if invalid

def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    # Raises HTTPException 403 if not admin

def require_permission(permission: str):
    def checker(current_user: User = Depends(get_current_user)):
        if permission not in ROLE_PERMISSIONS[current_user.role]:
            raise HTTPException(403, f"Permission required: {permission}")
        return current_user
    return checker
```

---

## 4. API Architecture

### 4.1 API Response Standard

All API responses follow this exact structure:

**Success Response:**
```json
{
    "data": {},
    "message": "Operation successful",
    "status": "success",
    "timestamp": "2025-04-01T12:00:00Z"
}
```

**Error Response:**
```json
{
    "error": "Human-readable error message",
    "code": "ERROR_CODE_CONSTANT",
    "status": "error",
    "timestamp": "2025-04-01T12:00:00Z"
}
```

**Paginated Response:**
```json
{
    "data": [],
    "total": 100,
    "page": 1,
    "per_page": 20,
    "status": "success"
}
```

### 4.2 HTTP Status Code Standards

| Code | Usage |
|---|---|
| 200 | Successful GET, PATCH, PUT |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no body) |
| 400 | Validation error, bad request body |
| 401 | Missing or invalid JWT token |
| 403 | Valid JWT but insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict — duplicate email, duplicate rule ID |
| 422 | Unprocessable entity — FastAPI Pydantic validation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### 4.3 Pydantic Request/Response Models

```python
# All request bodies validated via Pydantic v2

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(min_length=1)

class RegisterRequest(BaseModel):
    email:     EmailStr
    password:  str = Field(min_length=12)
    firstName: str = Field(min_length=1)
    lastName:  str = Field(min_length=1)
    role:      Literal["admin", "analyst", "viewer"] = "analyst"

class AlertStatusUpdate(BaseModel):
    status: Literal["open", "investigating", "resolved"]

class RuleCreate(BaseModel):
    name:      str = Field(min_length=1, max_length=255)
    condition: str = Field(min_length=1)
    severity:  Literal["critical", "high", "medium", "low"]
    action:    str = Field(min_length=1)

class DangerZoneConfirm(BaseModel):
    confirm: str  # Must equal "FLUSH", "RESET", or "DELETE"
```

### 4.4 Complete API Contract (All Endpoints)

```
AUTHENTICATION
POST   /api/auth/login           Body: LoginRequest         Returns: token + user
POST   /api/auth/register        Body: RegisterRequest      Returns: user
GET    /api/auth/check-email     Query: email               Returns: {exists: bool}
POST   /api/auth/send-verify     Body: {email}              Returns: {message}
GET    /api/auth/me              JWT required               Returns: UserProfile

DASHBOARD
GET    /api/stats                JWT required               Returns: stats object
GET    /api/alerts               JWT + query params         Returns: alerts array
POST   /api/alerts/:id/status    JWT + AlertStatusUpdate    Returns: updated alert
POST   /api/alerts/resolve-all   JWT required               Returns: {message}
GET    /api/geo                  JWT required               Returns: geo attacks
GET    /api/geo/stats            JWT required               Returns: geo stats
GET    /api/top-ips              JWT required               Returns: IP array

ML ENGINE
GET    /api/ml/metrics           JWT required               Returns: metrics
GET    /api/ml/classification    JWT required               Returns: confidence array
GET    /api/ml/scores            JWT required               Returns: scatter points
GET    /api/ml/anomalies         JWT required               Returns: anomaly array
GET    /api/ml/config            JWT required               Returns: model config
POST   /api/ml/retrain           JWT + admin                Returns: {job_id, eta}

RULES
GET    /api/rules                JWT required               Returns: rules array
POST   /api/rules                JWT + RuleCreate           Returns: new rule
PATCH  /api/rules/:id            JWT + partial rule         Returns: updated rule
PUT    /api/rules/:id            JWT + full rule            Returns: updated rule
DELETE /api/rules/:id            JWT required               Returns: {message}

USER
GET    /api/user/me              JWT required               Returns: UserProfile
PUT    /api/user/me              JWT + ProfileUpdate        Returns: updated user
POST   /api/user/change-password JWT + passwords            Returns: {message}
GET    /api/user/stats           JWT required               Returns: user stats
GET    /api/user/activity        JWT required               Returns: activity array
GET    /api/user/permissions     JWT required               Returns: permissions

SETTINGS
GET    /api/settings             JWT required               Returns: all settings
POST   /api/settings/general     JWT required               Returns: {message}
POST   /api/settings/notifications JWT required             Returns: {message}
POST   /api/settings/ml          JWT required               Returns: {message}
POST   /api/settings/security    JWT required               Returns: {message}
GET    /api/settings/test-connections JWT required          Returns: connection status
DELETE /api/settings/flush-logs  JWT admin + {confirm:FLUSH}  Returns: {message}
POST   /api/settings/reset-ml    JWT admin + {confirm:RESET}  Returns: {message}
DELETE /api/settings/delete-users JWT admin + {confirm:DELETE} Returns: {message}

FIREWALL
POST   /api/firewall/block       JWT + {ip}                 Returns: {message}
GET    /api/firewall/blocked     JWT required               Returns: blocked IPs

LOGS
GET    /api/logs                 JWT required               Returns: log array
GET    /api/logs/stream          None (SSE)                 Stream: SSE events
WebSocket /ws/logs               JWT in query param         Stream: JSON frames

HEALTH
GET    /api/health               None                       Returns: {status: ok}
```

---

## 5. PostgreSQL Architecture

### 5.1 Database Configuration

```python
# config.py
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://securewatch:password@localhost:5432/securewatch"
)

# SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,       # Verify connections before use
    pool_recycle=300,          # Recycle connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### 5.2 Complete Database Schema

```sql
-- Users table
CREATE TABLE users (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'analyst'
                            CHECK (role IN ('admin','analyst','viewer')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);

-- Alerts table
CREATE TABLE alerts (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    severity          VARCHAR(20)  NOT NULL
                                   CHECK (severity IN ('critical','high','medium','low')),
    name              VARCHAR(255) NOT NULL,
    source_ip         VARCHAR(50),
    ml_classification VARCHAR(100),
    if_score          FLOAT,
    status            VARCHAR(30)  NOT NULL DEFAULT 'open'
                                   CHECK (status IN ('open','investigating','resolved')),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    country           VARCHAR(100),
    attack_type       VARCHAR(100),
    raw_features      JSONB
);

CREATE INDEX idx_alerts_severity   ON alerts(severity);
CREATE INDEX idx_alerts_status     ON alerts(status);
CREATE INDEX idx_alerts_created    ON alerts(created_at DESC);
CREATE INDEX idx_alerts_source_ip  ON alerts(source_ip);

-- Rules table
CREATE TABLE rules (
    id         VARCHAR(20)  PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    condition  VARCHAR(255) NOT NULL,
    severity   VARCHAR(20)  NOT NULL
                            CHECK (severity IN ('critical','high','medium','low')),
    action     VARCHAR(100) NOT NULL,
    enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    hits_today INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_enabled  ON rules(enabled);
CREATE INDEX idx_rules_severity ON rules(severity);

-- Audit logs table
CREATE TABLE audit_logs (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action     VARCHAR(255) NOT NULL,
    resource   VARCHAR(255),
    details    TEXT,
    ip_address VARCHAR(50),
    success    BOOLEAN      NOT NULL DEFAULT TRUE,
    timestamp  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_logs(user_id);
CREATE INDEX idx_audit_action    ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Settings table
CREATE TABLE settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 5.3 Alembic Migration Strategy

```
alembic/
├── env.py                    # Migration environment config
├── script.py.mako            # Migration template
└── versions/
    ├── 001_initial_schema.py # Initial tables
    ├── 002_seed_admin.py     # Default admin user
    └── 003_seed_rules.py     # Default detection rules

Commands:
alembic upgrade head          # Apply all migrations
alembic downgrade -1          # Rollback one migration
alembic revision --autogenerate -m "description"
```

---

## 6. JWT Authentication Flow

### 6.1 Token Lifecycle

```
1. User submits POST /api/auth/login with email + password
2. FastAPI retrieves User from PostgreSQL by email
3. bcrypt.checkpw() compares submitted password to stored hash
4. If valid: create_access_token() generates signed JWT
5. JWT payload: {id, email, role, name, exp}
6. Response: {token: "...", user: {...}}
7. React stores token in localStorage (remember=true) or sessionStorage
8. Every subsequent request: Authorization: Bearer <token> header
9. FastAPI Depends(get_current_user) verifies signature on every request
10. On 401: axios interceptor clears token and redirects to /login
```

### 6.2 JWT Configuration

```python
# FastAPI JWT config
from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY      = os.getenv("JWT_SECRET_KEY")
ALGORITHM       = "HS256"
ACCESS_EXPIRE_H = int(os.getenv("JWT_EXPIRY_HOURS", 8))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 6.3 React Token Management

```javascript
// services/api.js — token management

const TOKEN_KEY = 'sw_token';

export const tokenStorage = {
    set: (token, remember) => {
        if (remember) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            sessionStorage.setItem(TOKEN_KEY, token);
        }
    },
    get: () => {
        return localStorage.getItem(TOKEN_KEY)
            || sessionStorage.getItem(TOKEN_KEY)
            || null;
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
    },
};
```

---

## 7. RBAC Authorization Flow

### 7.1 Role Permissions Matrix

```python
ROLE_PERMISSIONS = {
    'admin': [
        'view_dashboard', 'view_live_logs', 'manage_alerts',
        'create_rules', 'delete_rules', 'manage_users',
        'view_raw_logs', 'export_data', 'retrain_model',
        'access_settings', 'delete_system_data',
    ],
    'analyst': [
        'view_dashboard', 'view_live_logs', 'manage_alerts',
        'create_rules', 'view_raw_logs', 'export_data',
    ],
    'viewer': [
        'view_dashboard',
    ],
}
```

### 7.2 FastAPI RBAC Enforcement

```python
# Every protected endpoint declares its required permission

@router.get("/api/ml/retrain")
async def retrain_model(
    current_user: User = Depends(require_permission("retrain_model"))
):
    ...

@router.delete("/api/settings/delete-users")
async def delete_users(
    current_user: User = Depends(require_admin)
):
    ...
```

### 7.3 React Route-Level RBAC

```javascript
// App.jsx — route protection

function PrivateRoute({ children, requiredRole = null }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user)   return <Navigate to="/login" replace />;

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Usage in routes
<Route path="/settings" element={
    <PrivateRoute requiredRole="admin">
        <AppLayout><Settings /></AppLayout>
    </PrivateRoute>
}/>
```

---

## 8. WebSocket Architecture

### 8.1 FastAPI WebSocket Endpoint

```python
# routes/logs.py

from fastapi import WebSocket, WebSocketDisconnect
import asyncio, json, time, random

@router.websocket("/ws/logs")
async def websocket_logs(
    websocket: WebSocket,
    token: str = Query(None)
):
    # Verify JWT from query param
    if not token or not verify_token_silent(token):
        await websocket.close(code=4001)
        return

    await websocket.accept()
    try:
        while True:
            log = generate_log_entry()
            await websocket.send_json(log)
            await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()
```

### 8.2 React WebSocket Hook

```javascript
// hooks/useWebSocket.js

import { useEffect, useRef, useCallback, useState } from 'react';
import { tokenStorage } from '@services/api';

const WS_RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000];

export function useWebSocket(path, { onMessage, enabled = true } = {}) {
    const wsRef         = useRef(null);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef(null);
    const [status, setStatus] = useState('disconnected');

    const connect = useCallback(() => {
        if (!enabled) return;

        const token    = tokenStorage.get();
        const base     = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        const url      = `${base}${path}?token=${token}`;

        setStatus('connecting');
        const ws       = new WebSocket(url);
        wsRef.current  = ws;

        ws.onopen = () => {
            setStatus('connected');
            retryCountRef.current = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch {
                // ignore malformed frames
            }
        };

        ws.onclose = (event) => {
            setStatus('disconnected');
            if (event.code !== 1000 && event.code !== 4001) {
                scheduleReconnect();
            }
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [path, onMessage, enabled]);

    const scheduleReconnect = useCallback(() => {
        const intervals = WS_RECONNECT_INTERVALS;
        const idx       = Math.min(retryCountRef.current, intervals.length - 1);
        const delay     = intervals[idx];
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(connect, delay);
    }, [connect]);

    const disconnect = useCallback(() => {
        clearTimeout(retryTimerRef.current);
        wsRef.current?.close(1000);
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { status, disconnect };
}
```

### 8.3 WebSocket Reconnect Strategy

```
Attempt 1: Reconnect after 1 second
Attempt 2: Reconnect after 2 seconds
Attempt 3: Reconnect after 5 seconds
Attempt 4: Reconnect after 10 seconds
Attempt 5+: Reconnect after 30 seconds

Close code 1000 (normal close): No reconnect
Close code 4001 (auth failure): No reconnect, redirect to login
All other codes: Reconnect with backoff

Visual indicator in Sidebar: green=connected, yellow=connecting, red=disconnected
```

---

## 9. ML Pipeline Architecture

### 9.1 Complete Pipeline Flow

```
Raw log event from Elasticsearch
          ↓
feature_extraction.py
  - Parse log fields: ip, timestamp, action, bytes, user
  - Compute 12 numeric features (see PRD Section 8.1)
  - Return numpy array shape (1, 12)
          ↓
Isolation Forest (model.pkl)
  - contamination=0.05, n_estimators=100
  - model.decision_function(features) → score
  - if score < -0.7: flagged as anomaly
          ↓
If anomaly: Random Forest Classifier (classifier.pkl)
  - model.predict(features) → class index 0-5
  - model.predict_proba(features) → confidence per class
  - Map class index to attack type string
          ↓
Generate alert dict:
  - id, severity (from confidence), name, source_ip
  - ml_classification (type + confidence %)
  - if_score, attack_type, country, raw_features
          ↓
Write to Elasticsearch index: securewatch-alerts
Write to PostgreSQL table: alerts
          ↓
FastAPI /api/alerts picks up new alert within 2 seconds
WebSocket broadcast to connected React clients
Alert appears on Dashboard within 13-15 seconds total
```

### 9.2 ML File Responsibilities

```
ml/feature_extraction.py
  - Input:  dict (parsed log event fields)
  - Output: numpy array shape (1, 12)
  - No model dependencies

ml/train_isolation_forest.py
  - Loads data/normal_logs.csv (48,000+ rows)
  - Trains IsolationForest(n_estimators=100, contamination=0.05)
  - Saves to ml/model.pkl via joblib
  - Prints: accuracy metrics on test split

ml/train_rf_classifier.py
  - Loads data/labelled_attacks.csv (500+ rows)
  - Trains RandomForestClassifier(n_estimators=100, class_weight='balanced')
  - Saves to ml/classifier.pkl via joblib
  - Prints: classification report, confusion matrix

ml/predict.py
  - load_models(): loads model.pkl and classifier.pkl
  - score_event(log_dict): runs full pipeline, returns alert dict or None
  - is_anomaly(score): returns bool using -0.7 threshold

ml/pipeline.py
  - Polls Elasticsearch for new log events every 5 seconds
  - For each unscored event: calls score_event()
  - If anomaly: writes alert to Elasticsearch and PostgreSQL
  - Logs all pipeline timing for performance monitoring

ml/retrain_cron.py
  - Runs daily via cron or APScheduler
  - Fetches last 48h of normal events from Elasticsearch
  - Re-trains Isolation Forest on updated data
  - Replaces model.pkl atomically (rename after write)

ml/generate_training_data.py
  - Generates synthetic normal_logs.csv with 50,000 rows
  - Generates synthetic labelled_attacks.csv with 600 rows
  - Covers all 6 attack types with realistic feature distributions
```

### 9.3 ML Training Data Specification

```python
# Normal log feature ranges for synthetic generation
NORMAL_RANGES = {
    "login_count_per_minute":    (0, 3),        # Normal: 0-3 logins/min
    "ports_scanned":             (1, 5),         # Normal: 1-5 ports
    "request_rate_ratio":        (0.5, 1.5),    # Normal: within 50% of baseline
    "geo_distance_from_baseline":(0, 100),       # Normal: within 100km
    "time_of_day_score":         (0, 0.3),       # Normal: business hours
    "failed_auth_ratio":         (0, 0.1),       # Normal: under 10% failures
    "sudo_fail_count":           (0, 1),         # Normal: 0-1 sudo fails
    "unique_ports_per_min":      (1, 10),        # Normal: 1-10 unique ports
    "bytes_transferred":         (100, 100000),  # Normal: 100B - 100KB
    "connection_duration":       (1, 300),       # Normal: 1-300 seconds
    "user_agent_entropy":        (1.5, 3.5),     # Normal: moderate entropy
    "country_risk_score":        (0.0, 0.3),     # Normal: low-risk countries
}

# Attack feature ranges per class
ATTACK_RANGES = {
    "Brute Force SSH":    {"login_count_per_minute": (50, 300), "failed_auth_ratio": (0.9, 1.0)},
    "Port Scan/Recon":    {"ports_scanned": (100, 1024), "unique_ports_per_min": (50, 200)},
    "DDoS Pattern":       {"request_rate_ratio": (10, 50), "bytes_transferred": (1e6, 1e9)},
    "Slow Brute Force":   {"login_count_per_minute": (0.1, 1), "failed_auth_ratio": (0.8, 1.0)},
    "Geographic Anomaly": {"geo_distance_from_baseline": (5000, 20000), "country_risk_score": (0.7, 1.0)},
    "Privilege Escalation":{"sudo_fail_count": (5, 20), "failed_auth_ratio": (0.6, 1.0)},
}
```

---

## 10. ELK Pipeline Architecture

### 10.1 Pipeline Flow

```
Server Log Files (/var/log/auth.log, /var/log/apache2/access.log)
          ↓
Filebeat 8.x (Agent on monitored server)
  - Reads log files continuously
  - Ships to Logstash:5044 via Beats protocol
          ↓
Logstash 8.x (Processing)
  - Grok filter: parse SSH, Apache, sudo log formats
  - Mutate: add source_app, normalise field names
  - GeoIP: resolve source IP to country, city, coordinates
  - Output: Elasticsearch index securewatch-logs-YYYY.MM.dd
          ↓
Elasticsearch 8.x (Storage)
  - Index: securewatch-logs-YYYY.MM.dd (raw logs)
  - Index: securewatch-alerts (ML-generated alerts)
  - Index: securewatch-metrics (Metricbeat system metrics)
          ↓
ML Pipeline (Python)
  - Polls securewatch-logs-* for unscored events
  - Scores with Isolation Forest
  - Classifies with Random Forest
  - Writes to securewatch-alerts index
          ↓
FastAPI Backend
  - Reads from securewatch-alerts
  - Serves via /api/alerts endpoint
  - Broadcasts via WebSocket
          ↓
React Dashboard
  - Displays alerts, logs, metrics in real-time
```

### 10.2 Logstash Grok Patterns

```ruby
# logstash.conf

input {
  beats {
    port => 5044
  }
}

filter {
  # SSH Authentication Failure
  grok {
    match => {
      "message" => [
        "%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host_name} sshd\[%{NUMBER:pid}\]: Failed password for %{USERNAME:username} from %{IP:src_ip} port %{NUMBER:port}",
        "%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host_name} sshd\[%{NUMBER:pid}\]: Accepted password for %{USERNAME:username} from %{IP:src_ip}",
        "%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host_name} sshd\[%{NUMBER:pid}\]: Invalid user %{USERNAME:username} from %{IP:src_ip}",
        "%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host_name} sudo: %{USERNAME:username} : .* FAILED",
        "%{COMBINEDAPACHELOG}"
      ]
    }
    tag_on_failure => ["_grokparsefailure"]
  }

  geoip {
    source => "src_ip"
    target => "geoip"
  }

  date {
    match => ["timestamp", "MMM  d HH:mm:ss", "MMM dd HH:mm:ss"]
    target => "@timestamp"
  }

  mutate {
    add_field => { "source_app" => "securewatch" }
    add_field => { "ml_scored"  => false }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "securewatch-logs-%{+YYYY.MM.dd}"
  }
}
```

---

## 11. Docker Architecture

### 11.1 docker-compose.yml (ELK only)

```yaml
version: '3.8'
services:

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: securewatch-es
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    container_name: securewatch-kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    container_name: securewatch-logstash
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  es_data:
```

### 11.2 docker-compose.full.yml (Complete Stack)

```yaml
version: '3.8'

services:

  postgres:
    image: postgres:16-alpine
    container_name: securewatch-postgres
    environment:
      POSTGRES_DB:       securewatch
      POSTGRES_USER:     securewatch
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U securewatch"]
      interval: 10s
      timeout: 5s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    container_name: securewatch-es
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    volumes:
      - ./elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      elasticsearch:
        condition: service_healthy

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: securewatch-api
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL:    postgresql://securewatch:${DB_PASSWORD}@postgres:5432/securewatch
      ELASTICSEARCH_URL: http://elasticsearch:9200
      JWT_SECRET_KEY:  ${JWT_SECRET_KEY}
    volumes:
      - ./ml:/app/ml
    depends_on:
      postgres:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5

  ml-pipeline:
    build:
      context: ./ml
      dockerfile: Dockerfile
    container_name: securewatch-ml
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      DATABASE_URL:    postgresql://securewatch:${DB_PASSWORD}@postgres:5432/securewatch
    volumes:
      - ./ml:/app
      - ./data:/data
    depends_on:
      backend:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: securewatch-frontend
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://backend:8000
      VITE_WS_URL:  ws://backend:8000
    depends_on:
      - backend

volumes:
  pg_data:
  es_data:
```

### 11.3 Dockerfiles

**backend/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**ml/Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "pipeline.py"]
```

---

## 12. React Routing Structure

### 12.1 Route Definitions

```javascript
// App.jsx — complete routing

import { Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected routes — all roles */}
            <Route path="/" element={
                <PrivateRoute>
                    <AppLayout><Dashboard /></AppLayout>
                </PrivateRoute>
            }/>
            <Route path="/live-logs" element={
                <PrivateRoute permission="view_live_logs">
                    <AppLayout><LiveLogs /></AppLayout>
                </PrivateRoute>
            }/>
            <Route path="/alerts" element={
                <PrivateRoute permission="manage_alerts">
                    <AppLayout><Alerts /></AppLayout>
                </PrivateRoute>
            }/>
            <Route path="/geo-map" element={
                <PrivateRoute><AppLayout><GeoMap /></AppLayout></PrivateRoute>
            }/>
            <Route path="/ml-engine" element={
                <PrivateRoute><AppLayout><MLEngine /></AppLayout></PrivateRoute>
            }/>
            <Route path="/anomalies" element={
                <PrivateRoute><AppLayout><Anomalies /></AppLayout></PrivateRoute>
            }/>
            <Route path="/trends" element={
                <PrivateRoute><AppLayout><Trends /></AppLayout></PrivateRoute>
            }/>
            <Route path="/rules" element={
                <PrivateRoute permission="create_rules">
                    <AppLayout><Rules /></AppLayout>
                </PrivateRoute>
            }/>

            {/* Admin-only routes */}
            <Route path="/settings" element={
                <PrivateRoute requiredRole="admin">
                    <AppLayout><Settings /></AppLayout>
                </PrivateRoute>
            }/>

            {/* All authenticated users */}
            <Route path="/admin" element={
                <PrivateRoute><AppLayout><Admin /></AppLayout></PrivateRoute>
            }/>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
```

### 12.2 PrivateRoute and PublicRoute Components

```javascript
// PrivateRoute: redirect to /login if no token
function PrivateRoute({ children, requiredRole = null, permission = null }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user)   return <Navigate to="/login" replace />;

    // Role check
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    // Permission check
    if (permission) {
        const allowed = ROLE_PERMISSIONS[user.role]?.includes(permission);
        if (!allowed) return <Navigate to="/" replace />;
    }

    return children;
}

// PublicRoute: redirect to / if already logged in
function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user)    return <Navigate to="/" replace />;
    return children;
}
```

---

## 13. State Management Strategy

### 13.1 Architecture Decision

SecureWatch AI uses **React built-in state only** — no Redux, no Zustand, no MobX. Justification:

- Auth state: single AuthContext (login, logout, user object)
- Page state: local useState and useReducer per page component
- Server state: direct axios calls with local loading/error/data state
- Real-time state: WebSocket hook feeds into local page state

This keeps the codebase simple, debuggable, and maintainable for the project scope.

### 13.2 AuthContext

```javascript
// context/AuthContext.jsx

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate from stored token on app load
    useEffect(() => {
        const token = tokenStorage.get();
        if (token) {
            authAPI.me()
                .then(res => setUser(res.data))
                .catch(()  => tokenStorage.clear())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password, remember = false) => {
        const res = await authAPI.login(email, password);
        tokenStorage.set(res.data.token, remember);
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        tokenStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

### 13.3 Page-Level State Pattern

```javascript
// Standard pattern used in every page component

export default function Alerts() {
    const [alerts,  setAlerts]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [severity,setSeverity]= useState('');
    const [status,  setStatus]  = useState('');

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await alertsAPI.getAll({ severity, status });
            setAlerts(res.data.alerts);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load alerts');
        } finally {
            setLoading(false);
        }
    }, [severity, status]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    // render...
}
```

---

## 14. Axios Service Architecture

### 14.1 Base API Instance

```javascript
// services/api.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
API.interceptors.request.use(
    (config) => {
        const token = tokenStorage.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
```

### 14.2 Per-Domain Service Files

```javascript
// services/authAPI.js
import API from './api';
export const authAPI = {
    login:      (email, password) => API.post('/api/auth/login', { email, password }),
    register:   (data)            => API.post('/api/auth/register', data),
    checkEmail: (email)           => API.get('/api/auth/check-email', { params: { email } }),
    sendVerify: (email)           => API.post('/api/auth/send-verify', { email }),
    me:         ()                => API.get('/api/auth/me'),
};

// services/alertsAPI.js
import API from './api';
export const alertsAPI = {
    getAll:       (params)         => API.get('/api/alerts', { params }),
    updateStatus: (id, status)     => API.post(`/api/alerts/${id}/status`, { status }),
    resolveAll:   ()               => API.post('/api/alerts/resolve-all'),
};

// services/mlAPI.js
import API from './api';
export const mlAPI = {
    getMetrics:        () => API.get('/api/ml/metrics'),
    getClassification: () => API.get('/api/ml/classification'),
    getScores:         () => API.get('/api/ml/scores'),
    getAnomalies:      () => API.get('/api/ml/anomalies'),
    getConfig:         () => API.get('/api/ml/config'),
    retrain:           () => API.post('/api/ml/retrain'),
};

// All other service files follow same pattern
```

---

## 15. Real-Time Update Strategy

### 15.1 Strategy by Data Type

| Data | Strategy | Interval / Trigger |
|---|---|---|
| Dashboard stats | setInterval polling | Every 2 seconds |
| Live alert feed | setInterval polling | Every 2 seconds |
| Live log stream | WebSocket | Push on each new log |
| ML metrics | Manual refresh | On page load only |
| Geo map data | setInterval polling | Every 30 seconds |
| Anomaly list | setInterval polling | Every 5 seconds |
| Rules | Manual refresh | On create / toggle |

### 15.2 useAutoRefresh Hook

```javascript
// hooks/useAutoRefresh.js

import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback, interval = 2000, enabled = true) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        // Run immediately on mount
        savedCallback.current();

        // Then run on interval
        const id = setInterval(() => savedCallback.current(), interval);
        return () => clearInterval(id);
    }, [interval, enabled]);
}

// Usage in Dashboard.jsx
useAutoRefresh(fetchStats,  2000);
useAutoRefresh(fetchAlerts, 2000);
useAutoRefresh(fetchGeoData, 30000);
```

---

## 16. Frontend Environment Variables

```bash
# frontend/.env (development)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_TITLE=SecureWatch AI
VITE_ENV=development

# frontend/.env.production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_TITLE=SecureWatch AI
VITE_ENV=production
```

```bash
# backend/.env
DATABASE_URL=postgresql://securewatch:password@localhost:5432/securewatch
ELASTICSEARCH_URL=http://localhost:9200
JWT_SECRET_KEY=change-this-in-production-minimum-32-characters
JWT_EXPIRY_HOURS=8
FLASK_PORT=8000
CORS_ORIGINS=http://localhost:3000
ML_MODEL_PATH=../ml/model.pkl
ML_CLASSIFIER_PATH=../ml/classifier.pkl
GEO_DB_PATH=../data/GeoLite2-City.mmdb
```

---

## 17. Error Handling Architecture

### 17.1 Backend Error Handlers (FastAPI)

```python
# Global exception handlers in app.py

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": str(exc.errors()[0]['msg']), "code": "VALIDATION_ERROR", "status": "error"}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": f"HTTP_{exc.status_code}", "status": "error"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Log full traceback internally
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": "INTERNAL_ERROR", "status": "error"}
    )
```

### 17.2 React Error Handling

```javascript
// Centralised error normaliser in services/api.js

export function getErrorMessage(error) {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.response?.status === 404) {
        return 'Resource not found';
    }
    if (error.response?.status === 403) {
        return 'You do not have permission for this action';
    }
    if (error.message === 'Network Error') {
        return 'Cannot connect to server. Check your connection.';
    }
    return 'An unexpected error occurred';
}

// Usage in every page component
try {
    await someAPI.call();
    toast.success('Action completed');
} catch (err) {
    toast.error(getErrorMessage(err));
}
```

---

## 18. Security Architecture

### 18.1 Backend Security

```python
# Rate limiting on auth endpoints
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/api/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest):
    ...

# Password requirements enforced at API level
def validate_password_strength(password: str) -> bool:
    has_upper   = any(c.isupper() for c in password)
    has_digit   = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in password)
    return len(password) >= 12 and has_upper and has_digit and has_special

# SQL injection: prevented by SQLAlchemy ORM parameterised queries
# XSS: prevented by JSON responses (no HTML rendering server-side)
# CSRF: prevented by JWT in Authorization header (not cookies)
```

### 18.2 CORS Configuration

```python
# Strict CORS in production
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 18.3 Danger Zone Confirmations

```python
# Three typed confirmations enforce intent for destructive operations

@router.delete("/api/settings/flush-logs")
async def flush_logs(data: DangerZoneConfirm, user=Depends(require_admin)):
    if data.confirm != "FLUSH":
        raise HTTPException(400, "Type FLUSH to confirm")
    # execute flush

@router.post("/api/settings/reset-ml")
async def reset_ml(data: DangerZoneConfirm, user=Depends(require_admin)):
    if data.confirm != "RESET":
        raise HTTPException(400, "Type RESET to confirm")

@router.delete("/api/settings/delete-users")
async def delete_users(data: DangerZoneConfirm, user=Depends(require_admin)):
    if data.confirm != "DELETE":
        raise HTTPException(400, "Type DELETE to confirm")
```

---

## 19. Reusable Component Architecture

### 19.1 Core UI Components

```javascript
// components/ui/StatCard.jsx
// Props: label, value, color (red|orange|cyan|green), meta
export function StatCard({ label, value, color, meta }) { ... }

// components/ui/Badge.jsx
// Props: severity (critical|high|medium|low|info)
export function Badge({ severity, children }) { ... }

// components/ui/Toggle.jsx
// Props: checked, onChange
export function Toggle({ checked, onChange }) { ... }

// components/ui/Button.jsx
// Props: variant (primary|secondary|danger), size, icon, loading, onClick
export function Button({ variant, size, icon, loading, onClick, children }) { ... }

// components/ui/Modal.jsx
// Props: open, title, message, confirmText, onConfirm, onCancel, danger
export function Modal({ open, title, message, confirmText, onConfirm, onCancel, danger }) { ... }

// components/ui/Icon.jsx
// Props: name (one of 22 icon IDs), size, color, style
export default function Icon({ name, size = 16, color = 'currentColor' }) { ... }

// components/ui/Logo.jsx
// Props: size
export default function Logo({ size = 28 }) { ... }
```

### 19.2 Component Prop Contracts

Every component is typed via JSDoc or PropTypes:

```javascript
// Badge.jsx — exact severity to class mapping
const SEVERITY_CLASSES = {
    critical: 'badge-crit',
    high:     'badge-high',
    medium:   'badge-medium',
    low:      'badge-low',
    info:     'badge-info',
};

// StatCard.jsx — exact color to CSS class mapping
const COLOR_CLASSES = {
    red:    'stat-card--red',
    orange: 'stat-card--orange',
    cyan:   'stat-card--cyan',
    green:  'stat-card--green',
};
```

---

## 20. CSS Architecture

### 20.1 CSS Strategy

SecureWatch AI uses **modular CSS files** — one CSS file per component when needed, with global CSS variables in index.css. No CSS-in-JS, no Tailwind, no frameworks.

```
src/
├── index.css               # CSS variables, reset, shared utilities
└── components/
    ├── layout/
    │   ├── AppLayout.css   # Layout-specific styles
    │   ├── Topbar.css
    │   └── Sidebar.css
    └── pages/
        ├── Dashboard.css
        ├── Alerts.css
        └── ...             # Per-page styles when needed
```

### 20.2 CSS Variable Usage

All colours, spacing, and font references use CSS variables from index.css:

```css
/* Correct */
color: var(--cyan);
background: var(--card);
border: 1px solid var(--border);

/* Never hardcode colours */
color: #00d4ff;   /* WRONG */
```

---

## 21. Logging Architecture

### 21.1 Backend Logging

```python
# Every backend module uses Python standard logging

import logging
logger = logging.getLogger(__name__)

# Log format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
)

# Usage throughout backend
logger.info(f"User {email} logged in from {ip}")
logger.warning(f"Failed login attempt for {email} from {ip}")
logger.error(f"Elasticsearch connection failed: {exc}")
logger.exception(f"Unhandled error in alert pipeline: {exc}")
```

### 21.2 Audit Log Requirements

Every destructive or sensitive action writes to the audit_logs table:

```
LOGIN_SUCCESS        — user login
LOGIN_FAILED         — failed login attempt
REGISTER             — new account created
ALERT_STATUS_UPDATE  — alert status changed
ALERTS_RESOLVE_ALL   — all alerts resolved
RULE_CREATE          — detection rule created
RULE_UPDATE          — rule enabled/disabled/modified
RULE_DELETE          — rule deleted
IP_BLOCKED           — IP added to blocklist
SETTINGS_SAVE        — any settings section saved
LOGS_FLUSHED         — all logs deleted (Danger Zone)
ML_RESET             — ML model reset (Danger Zone)
USERS_DELETED        — users deleted (Danger Zone)
```

---

## 22. Scalability Planning

### 22.1 Current Architecture Limits

| Component | Current Limit | Bottleneck |
|---|---|---|
| FastAPI (single worker) | ~1,000 req/sec | Single process |
| Elasticsearch (single node) | ~10,000 events/sec | Single node |
| PostgreSQL (single instance) | ~5,000 queries/sec | No read replicas |
| ML Pipeline (single process) | ~2,000 events/min scoring | Synchronous Python |
| WebSocket (single server) | ~1,000 concurrent | No clustering |

### 22.2 Phase 2 Scaling Path (Post-MSc)

```
FastAPI:       uvicorn --workers 4 (immediate, no code change)
Elasticsearch: 3-node cluster with replication
PostgreSQL:    Read replica for analytics queries
ML Pipeline:   Kafka queue between Logstash and ML service
WebSocket:     Redis pub/sub for multi-instance broadcasting
Frontend:      CloudFront CDN for static assets
```

---

## 23. Performance Optimisation

### 23.1 Frontend Optimisations

```javascript
// 1. Lazy load all page components
const Dashboard  = lazy(() => import('@pages/Dashboard'));
const LiveLogs   = lazy(() => import('@pages/LiveLogs'));
const MLEngine   = lazy(() => import('@pages/MLEngine'));
// All 12 pages lazy-loaded

// 2. Wrap router in Suspense
<Suspense fallback={<LoadingScreen />}>
    <Routes>...</Routes>
</Suspense>

// 3. Memoize expensive components
const AlertRow = memo(function AlertRow({ alert }) { ... });

// 4. Limit live log buffer
setLogs(prev => [...prev.slice(-200), newLog]); // Max 200 lines in DOM

// 5. Vite code splitting via manualChunks
// vendor, charts, http split in vite.config.js (see section 2.2)
```

### 23.2 Backend Optimisations

```python
# 1. Elasticsearch query optimisation
# Use filter context not query context for exact matches
# Filter context is cached, query context is not

# 2. Database query optimisation
# All filter columns have indexes (see schema section 5.2)
# Use .options(load_only(...)) to select only needed columns

# 3. Response compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## 24. Complete Technology Version Reference

| Technology | Version | Notes |
|---|---|---|
| React.js | 18.2.0 | Frontend framework |
| Vite | 5.x | Build tool and dev server |
| React Router DOM | 6.22.0 | Client-side routing |
| Axios | 1.6.7 | HTTP client |
| Recharts | 2.12.0 | Charts and data visualisation |
| react-hot-toast | 2.4.1 | Toast notifications |
| FastAPI | 0.110.0 | Backend framework |
| Uvicorn | 0.27.0 | ASGI server |
| SQLAlchemy | 2.0.x | ORM |
| Alembic | 1.13.x | Database migrations |
| PostgreSQL | 16 | Primary database |
| python-jose | 3.3.0 | JWT encode/decode |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| scikit-learn | 1.4.0 | ML models |
| pandas | 2.2.0 | Data processing |
| numpy | 1.26.3 | Numerical computing |
| joblib | 1.3.2 | Model serialisation |
| Elasticsearch Python | 8.12.0 | ES client |
| Elasticsearch | 8.12.0 | Search and storage |
| Logstash | 8.12.0 | Log processing |
| Filebeat | 8.12.0 | Log shipping |
| Kibana | 8.12.0 | Log visualisation |
| Docker | 25.x | Containerisation |
| Docker Compose | 2.x | Multi-container |
| Node.js | 20 LTS | Frontend build |
| Python | 3.11 | Backend runtime |
| Nginx | Alpine | Frontend production server |

---

## 25. Final Engineering Note

This TRD preserves every contract defined in the SecureWatch AI PRD v3.0. The only change from the original PRD is the frontend implementation — React.js with Vite replaces Vanilla JavaScript. All backend contracts, API routes, response shapes, ML architecture, ELK pipeline, database schema, Docker configuration, and authentication flows remain exactly as specified in the PRD. Any engineer or AI coding agent reading this document alongside the PRD has a complete and unambiguous specification to implement the full SecureWatch AI platform.