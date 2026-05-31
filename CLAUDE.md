markdown# CLAUDE.md — SecureWatch AI Frontend

## My Role
I am the Senior Frontend Engineer for SecureWatch AI.
I only touch the frontend/ folder.
I never touch backend/, ml/, or elk/.

## Project
SecureWatch AI — Cybersecurity monitoring dashboard.
Dark theme. Sharp edges. Dense information. No rounded corners. No emoji.

## My Stack
React.js 18 + Vite + React Router v6 + Axios + Recharts
Fonts: Syne (UI) + JetBrains Mono (data)
CSS: Plain CSS + CSS variables only

## Folder I Own
frontend/src/
├── index.jsx            App entry
├── App.jsx              Routes
├── index.css            CSS variables + reset
├── context/
│   └── AuthContext.jsx  Auth state
├── hooks/
│   ├── useAutoRefresh.js
│   └── useWebSocket.js
├── services/            API calls only (axios)
└── components/
├── ui/              Icon, Logo, Badge, StatCard, Toggle, Button, Modal
├── layout/          AppLayout, Topbar, Sidebar
└── pages/           12 pages

## Hard Rules
1. Zero border-radius — nowhere except toggle thumb
2. Zero emoji — 22 SVG icons only
3. Zero hardcoded colours — var(--cyan), var(--red) etc only
4. Zero CSS frameworks — no Tailwind, Bootstrap, MUI
5. Zero fetch() in components — axios services only
6. Zero Redux — useState + useContext only
7. Zero recharts replacements — only recharts for charts
8. Never touch backend files

## CSS Variables (All in index.css)
```css
--bg0: #060b11;    --bg1: #0b1220;    --bg2: #0f1a2e;
--card: #0d1828;   --border: #1a2d45; --border2: #223550;
--text1: #e4eaf4;  --text2: #7a9bbf;  --text3: #3d5a7a;
--cyan: #00d4ff;   --green: #00e887;  --red: #ff3b5c;
--orange: #ff8c42; --yellow: #ffd166; --purple: #9b7dff;
--blue: #3b82f6;   --sidebar: 224px;
```

## Severity Colours
- CRITICAL → --red
- HIGH → --orange
- MEDIUM → --yellow
- LOW → --green
- Active/Selected → --cyan

## 12 Pages I Build
/login      Login.jsx
/signup     Signup.jsx
/           Dashboard.jsx
/live-logs  LiveLogs.jsx
/alerts     Alerts.jsx
/geo-map    GeoMap.jsx
/ml-engine  MLEngine.jsx
/anomalies  Anomalies.jsx
/trends     Trends.jsx
/rules      Rules.jsx
/settings   Settings.jsx
/admin      Admin.jsx

## Route Protection
Public:      /login, /signup
Admin only:  /settings
Analyst+:    /live-logs, /alerts, /rules
All users:   everything else

## Auth Flow
App loads → check token → GET /api/auth/me → setUser
Login → POST /api/auth/login → store token → navigate('/')
401 response → clear token → navigate('/login')
Sign out → clear token → navigate('/login')

## API Services (I call, backend owns)
authAPI     → /api/auth/*
statsAPI    → /api/stats
alertsAPI   → /api/alerts/*
geoAPI      → /api/geo, /api/top-ips
mlAPI       → /api/ml/*
rulesAPI    → /api/rules/*
userAPI     → /api/user/*
settingsAPI → /api/settings/*
logsAPI     → /api/logs/stream (SSE)

## Token Storage
remember=true  → localStorage  (30 days)
remember=false → sessionStorage (8 hours)

## Live Data Refresh
Dashboard stats     → every 2 seconds
Dashboard alerts    → every 2 seconds
Geo map             → every 30 seconds
WebSocket logs      → pushed from server

## WebSocket
Endpoint:   /ws/logs?token=JWT
Reconnect:  1s → 2s → 5s → 10s → 30s
Close 1000: stop
Close 4001: clear token → /login
Max buffer: 200 log lines in state

## SVG Icons (22 total — no emoji ever)
ic-dashboard  ic-logs       ic-alerts    ic-globe
ic-cpu        ic-anomaly    ic-trends    ic-rules
ic-settings   ic-user       ic-eye       ic-eyeoff
ic-search     ic-lock       ic-bell      ic-mail
ic-check      ic-x          ic-chevron-left
ic-chevron-right  ic-analyst  ic-admin
All icons: fill=none, stroke=currentColor,
           strokeWidth=1.8, strokeLinecap=square

## Logo Mark
Outer square:  36x36px, 1.5px stroke, #00D4FF
Inner diamond: rotated 45°, same stroke
Crosshair:     H + V lines, 1.2px
TL + BR corners: 5x5px solid cyan
TR + BL corners: 5x5px solid red

## Animations (Only These)
```css
livePulse  → green dot in topbar
geoPulse   → world map attack dots
shimmer    → skeleton loading
sidebar    → width 0.25s ease
navItem    → background 0.15s
input      → border-color 0.2s
btn:active → translateY(1px)
```

## Debugging Rules
1. Read full error before touching code
2. Find exact file and line
3. Smallest possible fix
4. Test before moving on
5. Never break working code to fix something else

## Environment Variables
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

## Default Login (Dev Only)
Email:    admin@securewatch.local
Password: Admin@123456