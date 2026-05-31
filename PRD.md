# SecureWatch AI — Product Requirements Document v3.0

---

## Cover

**Project:** SecureWatch AI — Security Operations Dashboard
**Version:** 3.0
**Date:** April 2025
**Deadline:** 2 Weeks + 2 Days (Non-Negotiable)
**Frontend:** React.js (Changed from HTML)
**Classification:** Internal Use Only

---

## Table of Contents

1. Project Overview and Objectives
2. System Architecture
3. Design System v2 — Icons, Logo, Typography
4. Screen-by-Screen Specification (12 Pages)
5. Technology Stack
6. Project Folder Structure
7. Backend API Reference
8. ML Pipeline Specification
9. Database Schema
10. WebSocket Specification
11. Authentication and RBAC
12. ELK Stack Configuration
13. Two-Week Build Plan
14. Risks and Mitigations

---

## 1. Project Overview and Objectives

### 1.1 What is SecureWatch AI

SecureWatch AI is a real-time cybersecurity monitoring dashboard that combines the ELK Stack (Elasticsearch, Logstash, Kibana) with Machine Learning (Isolation Forest + Random Forest Classifier) to detect, classify, and visualise security threats in system logs. Unlike rule-based SIEM tools, it learns what normal behaviour looks like and automatically flags deviations, catching slow and low-frequency attacks that traditional systems miss.

### 1.2 Design v2 Rules (Non-Negotiable)

- All emoji icons replaced with clean SVG icon system — 16x16, stroke-based, square linecap
- Logo is a sharp geometric SVG mark — outer square frame, inner diamond, crosshair lines, four corner accent squares
- Zero rounded corners anywhere in the application — cards, buttons, inputs, containers, badges all sharp
- Typography uses Syne for all UI text and JetBrains Mono for code, IPs, scores, timestamps
- Sidebar has toggle button using SVG chevron icons
- Password toggles use SVG eye and eye-off icons
- No emoji anywhere in the application

### 1.3 Project Objectives

- Ingest and parse real-time server and system logs via Filebeat to Logstash to Elasticsearch
- Apply Isolation Forest ML model to detect anomalies without labelled training data
- Classify detected anomalies into attack types using Random Forest Classifier
- Display alerts, logs, geo-maps, and ML metrics on a live React dashboard with 12 navigable pages
- Provide full admin control — rules engine, settings panel, user account management
- Detect and display alerts within 15 seconds of anomaly occurrence end-to-end

### 1.4 Target Users

| Role | Access Level | Primary Use |
|---|---|---|
| Admin | Full access all 12 pages | Manage rules, users, ML config, settings, danger zone |
| Analyst | View and investigate, no settings | Monitor alerts, logs, anomalies, trends |
| Viewer | Read-only dashboard | Executive summary and reporting only |

---

## 2. System Architecture

### 2.1 Five-Layer Data Pipeline

```
Layer 1 — Collection:    Filebeat 8.x
Layer 2 — Processing:    Logstash 8.x + Grok patterns
Layer 3 — Storage:       Elasticsearch 8.x
Layer 4 — ML Detection:  Python + scikit-learn (IF + RF)
Layer 5 — Visualisation: React.js Dashboard
```

### 2.2 ML Detection Flow (4 Steps)

**Step 1 — Feature Extraction**
Extract 12 numeric features per log event:
1. login_count_per_minute
2. ports_scanned
3. request_rate_ratio
4. geo_distance_from_baseline
5. time_of_day_score
6. failed_auth_ratio
7. sudo_fail_count
8. unique_ports_per_min
9. bytes_transferred
10. connection_duration
11. user_agent_entropy
12. country_risk_score

**Step 2 — Isolation Forest**
Score each feature vector. Score below -0.7 flags the event as anomaly. No labelled data required. Trains on 48,000 or more normal log samples. Auto-retrains every 24 hours.

**Step 3 — RF Classifier**
Takes confirmed anomalies and classifies into one of six types:
- Brute Force SSH
- Port Scan / Recon
- DDoS Pattern
- Slow Brute Force
- Geographic Anomaly
- Privilege Escalation

**Step 4 — Alert Generation**
Anomaly plus classification creates alert document in Elasticsearch. Backend API picks it up within 2 seconds. Dashboard receives via WebSocket or polling. Total time under 15 seconds.

---

## 3. Design System v2

### 3.1 Logo Specification

Sharp geometric SVG mark. No rounded corners, no gradients, no emoji.

```
- Outer square frame: 36x36px, 1.5px stroke, colour #00D4FF
- Inner diamond: rotated 45 degrees, vertices at frame midpoints
- Crosshair: vertical and horizontal centre lines, 1.2px stroke
- Top-left corner: 5x5px solid cyan square #00D4FF
- Top-right corner: 5x5px solid red square #FF3B5C
- Bottom-left corner: 5x5px solid red square #FF3B5C
- Bottom-right corner: 5x5px solid cyan square #00D4FF
- Wordmark: "SecureWatch" white weight 800, uppercase, Syne font
```

### 3.2 SVG Icon System — All 22 Icons

| Icon ID | Used On | Description |
|---|---|---|
| ic-dashboard | Dashboard nav | 2x2 grid of four equal rectangles |
| ic-logs | Live Logs nav | Rectangle with three horizontal lines inside |
| ic-alerts | Alerts nav and topbar | Triangle with vertical line and dot |
| ic-globe | Geo Map nav | Square with grid lines and arc |
| ic-cpu | ML Engine nav | Processor chip with pin lines |
| ic-anomaly | Anomalies nav | Zigzag EKG-style polyline |
| ic-trends | Trends nav | Upward arrow with tick lines |
| ic-rules | Rules nav | Three lines with square dots |
| ic-settings | Settings nav | Gear shape with circle centre |
| ic-user | My Account nav | Person silhouette |
| ic-eye | Password show | Eye oval with circle pupil |
| ic-eyeoff | Password hide | Eye with diagonal slash |
| ic-search | Topbar search | Circle with diagonal line |
| ic-lock | Auth and Security | Rectangle padlock with arch |
| ic-bell | Notifications | Bell silhouette |
| ic-mail | Email settings | Rectangle envelope |
| ic-check | Permissions granted | Checkmark polyline |
| ic-x | Permissions denied | Two crossing lines |
| ic-chevron-left | Sidebar collapse | Left angle bracket |
| ic-chevron-right | Sidebar expand | Right angle bracket |
| ic-analyst | Sign Up role | Search magnifier with plus |
| ic-admin | Sign Up role | Five-point star polygon |

### 3.3 CSS Variables (Complete)

```css
:root {
  --bg0:     #060b11;
  --bg1:     #0b1220;
  --bg2:     #0f1a2e;
  --bg3:     #111f35;
  --card:    #0d1828;
  --border:  #1a2d45;
  --border2: #223550;
  --text1:   #e4eaf4;
  --text2:   #7a9bbf;
  --text3:   #3d5a7a;
  --cyan:    #00d4ff;
  --green:   #00e887;
  --red:     #ff3b5c;
  --orange:  #ff8c42;
  --yellow:  #ffd166;
  --purple:  #9b7dff;
  --blue:    #3b82f6;
  --sidebar: 224px;
}
```

### 3.4 Typography

- Primary font: Syne from Google Fonts — weights 400, 600, 700, 800
- Monospace font: JetBrains Mono — for IPs, scores, timestamps, log messages, code
- Nav labels: uppercase, letter-spacing 0.3px, weight 600, size 12px
- Section labels: uppercase, letter-spacing 1px, size 9-10px, weight 700
- Page titles: uppercase, letter-spacing 0.5px, weight 800, size 18px with inline SVG icon
- Stat card values: JetBrains Mono, weight 800, size 28-34px
- Badges: JetBrains Mono, uppercase, weight 800, size 9px

### 3.5 Sharp Edge Constraint

Zero border-radius everywhere. All components are sharp rectangles. Only exception is toggle switch inner thumb which is intentionally round.

---

## 4. Screen-by-Screen Specification

### 4.1 Login Page

**Purpose:** Entry point. Sharp auth card on dark grid background. Issues JWT on success.

**UI Elements:**
- SVG geometric logo mark with wordmark
- Page heading: Operator Login
- Subtitle: Authenticate to access the security console
- Email input — sharp, placeholder: admin@securewatch.local
- Password input with ic-eye toggle SVG button
- Keep me signed in checkbox
- Primary button: Authenticate — cyan background, black uppercase text, sharp
- SSO divider line
- LDAP / Active Directory button with ic-lock icon
- Link: No account? Request access
- Footer: TLS 1.3 Encrypted, Session timeout 8h

**React Component:** `src/components/pages/Login.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| handleLogin() | email: string, password: string, remember: boolean | JWT or Error | POST /api/auth/login, stores JWT, navigates to dashboard |
| validateEmail() | email: string | boolean | RFC 5322 regex validation |
| validatePassword() | password: string | boolean | Min 12 chars, 1 number, 1 symbol |
| togglePasswordVisibility() | none | void | Swaps input type, swaps ic-eye to ic-eyeoff |
| handleSSO() | provider: string | redirect | Redirects to LDAP OAuth |
| setSession() | token: string, remember: boolean | void | localStorage 30d or sessionStorage 8h |

---

### 4.2 Sign Up Page

**Purpose:** New user registration. 480px wide auth card. Role selector with SVG icons.

**UI Elements:**
- Same SVG logo mark as Login
- Role selector: two cards — Analyst (ic-analyst) and Admin (ic-admin)
- Selected role: cyan border, cyan background tint, icon turns cyan
- First Name and Last Name in two-column grid
- Work Email with hint text
- Password with ic-eye toggle and 2px strength meter bar
- Strength bar: red=Weak, orange=Fair, yellow=Good, green=Strong
- Confirm Password input
- Terms checkbox required
- Button: Create Account
- Link: Already registered? Sign in

**React Component:** `src/components/pages/Signup.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| handleSignup() | firstName, lastName, email, password, role | success or Error | POST /api/auth/register, bcrypt 12 rounds |
| checkPasswordStrength() | password: string | score 0-4 | length, uppercase, digit, special |
| updateStrengthBar() | score: number | void | Width and colour update |
| validatePasswordMatch() | pass1, pass2: string | boolean | Inline error on blur |
| selectRole() | roleEl: Element | void | Updates selected state and icon colour |
| checkEmailExists() | email: string | boolean | GET /api/auth/check-email debounced 500ms |

---

### 4.3 Dashboard

**Purpose:** Main overview. Real-time stats, alert feed, attack map, top IPs, 24-hour timeline. Auto-refresh every 2 seconds.

**UI Elements:**
- Topbar: SVG logo, LIVE dot with CSS pulse animation, search bar with ic-search, 3 Critical button with ic-alerts, user avatar with notification dot
- Sidebar: 224px, collapses to 52px via ic-chevron-left and ic-chevron-right toggle
- Sidebar sections: Main, Analysis, Config with all nav items and SVG icons
- Active nav: 2px left cyan border, cyan text, cyan icon stroke
- Sidebar footer: ML Model Confidence label, 2px progress bar, percentage in JetBrains Mono
- Four stat cards with 2px top accent: Threats Detected red, Brute Force orange, Anomaly Score cyan, Logs per Min green
- Live Alert Feed card: 6 alerts with severity badge, name, time, metadata line
- View All link navigates to Alerts page
- Attack Origin Map: dark background, CSS grid overlay, pulsing geo dots, no Kibana label
- Top Offending IPs: IP cyan mono, count, type, proportional risk bar
- Alert Timeline: recharts BarChart, 45 bars, colour-coded by severity

**React Component:** `src/components/pages/Dashboard.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchDashboardStats() | none | stats object | GET /api/stats every 2 seconds via setInterval |
| fetchLiveAlerts() | limit: number = 6 | Alert array | GET /api/alerts?limit=6&sort=desc |
| renderAlertFeed() | alerts: Alert array | JSX | Maps severity to badge class |
| fetchGeoData() | none | GeoPoint array | GET /api/geo |
| renderGeoMap() | points: GeoPoint array | JSX | Pulsing dots at CSS percent positions |
| fetchTopIPs() | limit: number = 4 | IPEntry array | GET /api/top-ips |
| renderTimeline() | buckets: HourBucket array | JSX | recharts BarChart with Cell colours |
| startAutoRefresh() | interval: number = 2000 | void | setInterval calling all fetch functions |
| toggleSidebar() | none | void | Toggles collapsed state, swaps chevron |
| navigateTo() | page: string | void | React Router useNavigate |

---

### 4.4 Live Logs

**Purpose:** Real-time log stream. Clean label only — no pipeline path text shown to users.

**UI Elements:**
- Page title: Live Logs with ic-logs icon
- Log stream card: header shows "Live Log Stream" only
- Pause and Resume toggle button
- Filter buttons: INFO blue, WARN yellow, ALERT orange, CRIT red
- Search input for IP or keyword
- Log rows: timestamp mono, level badge, message text
- ALERT rows: 2px orange left border, subtle orange background
- CRIT rows: 2px red left border, subtle red background
- WARN rows: 2px yellow left border
- Auto-scroll to bottom on each new row
- Export button at header

**React Component:** `src/components/pages/LiveLogs.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| startLogStream() | none | void | EventSource to /api/logs/stream SSE endpoint |
| appendLogLine() | log: object | void | Adds row to state array, triggers scroll |
| scrollToBottom() | none | void | useRef scroll to bottom after state update |
| togglePause() | none | void | Toggles paused state, stops appending |
| filterByLevel() | levels: string array | void | Filters displayed rows by level |
| filterByKeyword() | keyword: string | void | Case-insensitive message filter |
| getLogLevelClass() | level: string | string | Maps level to CSS class |
| exportLogs() | format: string | void | GET /api/logs/export triggers download |

---

### 4.5 Alerts Page

**Purpose:** Full alert management. Filter by severity and status. All actions inline.

**UI Elements:**
- Page title: Alerts with ic-alerts icon
- Severity filter pills: All, Critical, High, Medium, Low
- Status filter pills: Open, Investigating, Resolved
- Export button and Mark All Resolved danger button
- Table: Severity badge, Alert Name bold, Source IP mono, ML Classification mono, Time mono, Status dot, Action button
- Status dots: open red glow, investigating yellow, resolved green
- Action buttons: Investigate, View, Block IP, Watch

**React Component:** `src/components/pages/Alerts.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchAlerts() | severity, status | Alert array | GET /api/alerts with query params |
| filterAlerts() | severity, status | void | Updates filter state, re-fetches |
| investigateAlert() | alertId: string | void | POST /api/alerts/:id/status investigating |
| resolveAlert() | alertId: string | void | POST /api/alerts/:id/status resolved |
| blockIP() | ip: string | void | POST /api/firewall/block with confirmation |
| markAllResolved() | none | void | POST /api/alerts/resolve-all with confirmation |
| exportAlerts() | format: string | void | Download trigger |

---

### 4.6 Geo Map

**Purpose:** Global attack origin view. Pulsing dots. No Kibana text. Country table.

**UI Elements:**
- Page title: Geo Map with ic-globe icon
- Four stat cards: Countries red, Active IPs orange, Tor Exits yellow, Botnets cyan
- World map: dark gradient, CSS grid at 3% opacity, SVG continent shapes at 12% opacity
- Pulsing geo dots: 9px, coloured by severity, outward CSS pulse animation
- No Kibana label or pipeline text visible
- Colour legend below map
- Top Attack Origins table: flag, country, count, bar, badge

**React Component:** `src/components/pages/GeoMap.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchGeoAttacks() | none | GeoAttack array | GET /api/geo |
| fetchGeoStats() | none | GeoStats object | GET /api/geo/stats |
| coordsToPercent() | lat, lng: number | left, top percent | Map positioning |
| getDotColorClass() | severity: string | CSS variable | crit red, high orange, med yellow, low cyan |
| fetchCountryTable() | none | Country array | From geo attack data sorted by count |

---

### 4.7 ML Engine

**Purpose:** Model metrics, confidence bars, scatter plot, config panel. No pipeline diagram shown to users.

**UI Elements:**
- Page title: ML Engine with ic-cpu icon
- Subtitle: Isolation Forest — Attack Classification — scikit-learn
- Four metric cards with 2px top accent: Accuracy orange, Precision cyan, Recall yellow, Contamination purple
- Attack Classification Confidence: five gradient bars with label and percentage
- Anomaly scatter plot using recharts ScatterChart: cyan dots normal, red dots anomaly
- Model Config panel: 6 values in 3-column grid
- Status text: Running in green mono
- Retrain Model and Full Report buttons
- How the ML Pipeline Works section is completely hidden from users

**React Component:** `src/components/pages/MLEngine.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchMLMetrics() | none | metrics object | GET /api/ml/metrics |
| fetchClassificationConf() | none | Confidence array | GET /api/ml/classification |
| fetchAnomalyScores() | none | ScorePoint array | GET /api/ml/scores |
| fetchModelConfig() | none | ModelConfig | GET /api/ml/config |
| triggerRetrain() | none | void | POST /api/ml/retrain with toast notification |

---

### 4.8 Anomalies

**Purpose:** All ML-detected anomalies sorted by IF score. Hero card and full table.

**UI Elements:**
- Page title: Anomalies with ic-anomaly icon
- Hero card: largest IF score in red JetBrains Mono, IP, classification, time
- Mini scatter plot preview
- Anomaly table: Source IP, IF Score coloured by threshold, Classification badge, Time, Action
- Score colours: below -0.8 red, -0.8 to -0.6 orange, above -0.6 yellow
- Action buttons: Investigate, Block, Watch

**React Component:** `src/components/pages/Anomalies.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchAnomalies() | none | Anomaly array | GET /api/ml/anomalies sorted by score |
| getWorstAnomaly() | anomalies: array | Anomaly | Returns lowest IF score |
| getScoreColour() | score: number | CSS variable | Threshold-based colouring |
| investigateAnomaly() | id: string | void | POST /api/anomalies/:id/investigate |
| blockAnomalyIP() | ip: string | void | POST /api/firewall/block with dialog |
| triggerRescan() | none | void | POST /api/ml/rescan |

---

### 4.9 Trends

**Purpose:** 7-day and 30-day historical analysis. Bar charts and breakdown.

**UI Elements:**
- Page title: Trends with ic-trends icon
- 7 Days active and 30 Days toggle
- Daily Threat Volume: recharts BarChart, 7 bars, red-orange gradient
- Three stat cards: Avg Daily Threats with change, Peak Hour, Most Common Attack
- Attack Type Breakdown: five horizontal bars with count

**React Component:** `src/components/pages/Trends.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchTrendData() | period: 7d or 30d | DayBucket array | GET /api/trends?period= |
| fetchTrendStats() | period: string | TrendStats | GET /api/trends/stats |
| fetchAttackBreakdown() | period: string | AttackType array | GET /api/trends/breakdown |
| switchPeriod() | period: string | void | Updates state and re-fetches |
| calcPctChange() | current, previous | string | Returns +23% or -12% |

---

### 4.10 Rules

**Purpose:** Detection rule management. Toggle, create, edit, import.

**UI Elements:**
- Page title: Rules with ic-rules icon
- New Rule and Import Rules buttons
- Table: Rule ID mono muted, Name bold, Condition code pill, Severity badge, Action, Hits Today mono, Enabled toggle, Edit button
- Toggle switch: cyan when on, dark grey when off
- Condition shown as dark background mono bordered pill

**React Component:** `src/components/pages/Rules.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchRules() | none | Rule array | GET /api/rules |
| toggleRule() | ruleId, enabled: boolean | void | PATCH /api/rules/:id |
| createRule() | rule: RulePayload | Rule | POST /api/rules |
| updateRule() | ruleId, rule | Rule | PUT /api/rules/:id |
| deleteRule() | ruleId: string | void | DELETE /api/rules/:id with confirmation |
| validateCondition() | condition: string | boolean | Parses field operator value syntax |
| openEditModal() | rule: Rule | void | Sets modal state with rule data |

---

### 4.11 Settings

**Purpose:** Six-tab settings panel with left nav. All settings persist. Danger Zone requires typed confirmation.

**UI Elements:**
- Page title: Settings with ic-settings icon
- Left nav 190px: General, Notifications, ML Config, Integrations, Security, Danger Zone
- Active nav: 2px left cyan border, cyan text, cyan icon
- General: System Name, Timezone, Log Retention, Auto-refresh
- Notifications: Email toggle, address, Slack toggle, Min Severity
- ML Config: Contamination, n_estimators, Auto-retrain, Alert threshold
- Integrations: ES URL, Kibana URL, Logstash Port, Filebeat status
- Security: 2FA, Session timeout, IP Whitelist, LDAP/SSO
- Danger Zone: Flush Logs, Reset ML, Delete Users — all require typed confirmation

**React Component:** `src/components/pages/Settings.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| switchSettingsTab() | tabId: string | void | Updates active tab state |
| saveGeneralSettings() | config | void | POST /api/settings/general |
| saveNotificationSettings() | config | void | POST /api/settings/notifications |
| saveMLConfig() | config | void | POST /api/settings/ml |
| testConnections() | none | ConnectionStatus | GET /api/settings/test-connections |
| saveSecuritySettings() | config | void | POST /api/settings/security |
| flushLogs() | confirmText: string | void | DELETE /api/settings/flush-logs only if FLUSH |
| resetMLModel() | confirmText: string | void | POST /api/settings/reset-ml only if RESET |
| deleteAllUsers() | confirmText: string | void | DELETE /api/settings/delete-users only if DELETE |

---

### 4.12 Admin / My Account

**Purpose:** Profile, stats, activity log, permissions. Sign Out returns to Login.

**UI Elements:**
- Page title: My Account with ic-user icon
- Sign Out danger button top right
- Profile card: 64px avatar with initials gradient, uppercase name, cyan role, mono email, Active and Admin badges
- Edit Profile and Change Password buttons
- Four stat cards: Alerts Reviewed, Rules Created, Uptime, Days Active
- Recent Activity: icon container with SVG, action text, relative time
- Permissions: name and ic-check green or ic-x red per permission

**React Component:** `src/components/pages/Admin.jsx`

**Functions:**

| Function | Parameters | Returns | Behaviour |
|---|---|---|---|
| fetchUserProfile() | none | UserProfile | GET /api/user/me |
| fetchUserStats() | none | UserStats | GET /api/user/stats |
| fetchActivityLog() | none | Activity array | GET /api/user/activity |
| fetchPermissions() | none | Permission array | GET /api/user/permissions |
| updateProfile() | data | void | PUT /api/user/me |
| changePassword() | current, newPass | void | POST /api/user/change-password |
| getRelativeTime() | timestamp: string | string | 2 minutes ago, 1 hour ago, Yesterday |
| logout() | none | void | Clears JWT, navigates to /login |

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Log Collection | Filebeat 8.x | Ships /var/log/* to Logstash port 5044 |
| Log Processing | Logstash 8.x + Grok | Parses SSH, Apache, system logs |
| Storage | Elasticsearch 8.x | Indexes structured log documents |
| ML Anomaly | Python + scikit-learn | Isolation Forest detection |
| ML Classify | Python + scikit-learn | Random Forest 6-class classifier |
| Backend API | Python Flask | REST + SSE + JWT auth |
| Frontend | React.js 18 | All 12 pages, SVG icons, recharts |
| Charts | recharts | BarChart, ScatterChart, ResponsiveContainer |
| Routing | react-router-dom v6 | Client-side navigation |
| HTTP Client | axios | All API calls with JWT interceptor |
| Notifications | react-hot-toast | Action feedback toasts |
| Geo IP | MaxMind GeoLite2 | Offline IP geolocation |
| Database | SQLite / PostgreSQL | Users, rules, alerts, audit logs |
| Deployment | Docker + Docker Compose | Full stack containerisation |

---

## 6. Project Folder Structure

```
securewatch-ai/
│
├── backend/
│   ├── app.py                        # Flask entry point, registers all blueprints
│   ├── config.py                     # Environment variables and config constants
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Secrets and URLs (not committed)
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py                 # SQLAlchemy: User, Alert, Rule, AuditLog, Settings
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth_middleware.py        # JWT verify, role check, permission check decorators
│   └── routes/
│       ├── auth.py                   # POST /api/auth/login, register, check-email
│       ├── stats.py                  # GET /api/stats
│       ├── alerts.py                 # GET/POST /api/alerts
│       ├── geo.py                    # GET /api/geo, /api/top-ips
│       ├── ml.py                     # GET /api/ml/metrics, classification, scores, anomalies
│       ├── rules.py                  # CRUD /api/rules
│       ├── user.py                   # GET/PUT /api/user/me, stats, activity, permissions
│       ├── settings.py               # GET/POST /api/settings/*
│       └── logs.py                   # SSE /api/logs/stream, GET /api/logs
│
├── ml/
│   ├── feature_extraction.py         # Extract 12 features from log event dict
│   ├── train_isolation_forest.py     # Train IF model on 48k normal samples
│   ├── train_rf_classifier.py        # Train RF on 6 attack type categories
│   ├── predict.py                    # Load models, score events, return label
│   ├── pipeline.py                   # Full: log event to alert output
│   ├── generate_training_data.py     # Generate synthetic normal and attack samples
│   ├── retrain_cron.py               # Daily scheduled retraining
│   ├── model.pkl                     # Saved Isolation Forest (generated)
│   └── classifier.pkl                # Saved RF Classifier (generated)
│
├── frontend/
│   ├── package.json                  # React 18, react-router-dom, axios, recharts
│   ├── .env                          # REACT_APP_API_URL=http://localhost:5000
│   ├── public/
│   │   └── index.html                # Root HTML with Google Fonts links
│   └── src/
│       ├── index.js                  # ReactDOM.render, BrowserRouter wrap
│       ├── index.css                 # CSS variables, reset, shared utility classes
│       ├── App.jsx                   # Routes definition, PrivateRoute wrapper
│       ├── context/
│       │   └── AuthContext.jsx       # Auth state, login, logout, user
│       ├── services/
│       │   └── api.js                # axios instance, JWT interceptor, all API calls
│       ├── hooks/
│       │   └── useAutoRefresh.js     # Custom hook for setInterval data refresh
│       └── components/
│           ├── ui/
│           │   ├── Icon.jsx          # All 22 SVG icons as React component
│           │   └── Logo.jsx          # Sharp geometric SVG logo mark
│           ├── layout/
│           │   ├── AppLayout.jsx     # Topbar + Sidebar + children wrapper
│           │   ├── Topbar.jsx        # Logo, live dot, search, alerts button, avatar
│           │   └── Sidebar.jsx       # Nav items, badges, collapse toggle, ML status
│           └── pages/
│               ├── Login.jsx         # Auth card, form, SSO button
│               ├── Signup.jsx        # Role selector, strength meter, register form
│               ├── Dashboard.jsx     # Stats, alert feed, geo map, top IPs, timeline
│               ├── LiveLogs.jsx      # SSE stream, filters, auto-scroll
│               ├── Alerts.jsx        # Filter pills, table, action buttons
│               ├── GeoMap.jsx        # World map dots, country table, stats
│               ├── MLEngine.jsx      # Metrics, confidence bars, scatter plot
│               ├── Anomalies.jsx     # Hero card, anomaly table
│               ├── Trends.jsx        # Bar charts, period toggle, breakdown
│               ├── Rules.jsx         # Table, toggle switches, create modal
│               ├── Settings.jsx      # Six-tab panel, danger zone
│               └── Admin.jsx         # Profile, stats, activity, permissions
│
├── elk/
│   ├── docker-compose.yml            # Elasticsearch + Kibana + Logstash
│   ├── logstash.conf                 # Grok patterns for SSH, Apache, sudo logs
│   └── filebeat.yml                  # Filebeat config shipping to Logstash
│
├── data/
│   ├── normal_logs.csv               # 48k normal log samples for IF training
│   └── labelled_attacks.csv          # 500 labelled attack events for RF training
│
├── tests/
│   ├── test_ml_pipeline.py           # Feature extraction and scoring unit tests
│   ├── test_api_endpoints.py         # All REST endpoint integration tests
│   └── test_auth.py                  # Login, register, JWT validation tests
│
├── docker-compose.full.yml           # Full stack: ELK + Backend + Frontend
├── .gitignore
└── README.md
```

---

## 7. Backend API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | None | Email + password, returns JWT |
| POST | /api/auth/register | None | Create account, returns JWT |
| GET | /api/auth/check-email | None | Check if email already exists |
| POST | /api/auth/send-verify | None | Send verification email |
| GET | /api/auth/me | JWT | Get current user from token |

### Dashboard Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/stats | JWT | threats, bruteForce, anomalyScore, logsPerMin |
| GET | /api/alerts | JWT | All alerts, filterable by severity and status |
| POST | /api/alerts/:id/status | JWT | Update alert status |
| POST | /api/alerts/resolve-all | JWT | Resolve all open alerts |
| GET | /api/geo | JWT | Geo attack points array |
| GET | /api/geo/stats | JWT | Countries, IPs, Tor exits, botnets |
| GET | /api/top-ips | JWT | Top attacking IPs sorted by count |

### ML Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/ml/metrics | JWT | accuracy, precision, recall, contamination |
| GET | /api/ml/classification | JWT | Attack type confidence percentages |
| GET | /api/ml/scores | JWT | Scatter plot anomaly score points |
| GET | /api/ml/anomalies | JWT | All detected anomalies sorted by score |
| GET | /api/ml/config | JWT | Model configuration parameters |
| POST | /api/ml/retrain | JWT | Trigger model retraining job |

### Rules Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/rules | JWT | All detection rules with hit counts |
| POST | /api/rules | JWT | Create new rule |
| PATCH | /api/rules/:id | JWT | Toggle enabled or update rule |
| PUT | /api/rules/:id | JWT | Full rule replacement |
| DELETE | /api/rules/:id | JWT | Delete rule with confirmation |

### User Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/user/me | JWT | Current user profile |
| PUT | /api/user/me | JWT | Update profile |
| POST | /api/user/change-password | JWT | Change password with current verification |
| GET | /api/user/stats | JWT | Alerts reviewed, rules created, uptime |
| GET | /api/user/activity | JWT | Recent actions with timestamps |
| GET | /api/user/permissions | JWT | Role-based permission list |

### Settings Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/settings | JWT | All current settings |
| POST | /api/settings/general | JWT | Save general settings |
| POST | /api/settings/notifications | JWT | Save notification settings |
| POST | /api/settings/ml | JWT | Save ML config settings |
| POST | /api/settings/security | JWT | Save security settings |
| GET | /api/settings/test-connections | JWT | Test ELK connectivity |
| DELETE | /api/settings/flush-logs | JWT Admin | Requires confirm=FLUSH |
| POST | /api/settings/reset-ml | JWT Admin | Requires confirm=RESET |
| DELETE | /api/settings/delete-users | JWT Admin | Requires confirm=DELETE |

### Firewall and Logs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/firewall/block | JWT | Block an IP address |
| GET | /api/firewall/blocked | JWT | List all blocked IPs |
| GET | /api/logs | JWT | Recent log entries |
| GET | /api/logs/stream | None | SSE live log stream |
| GET | /api/health | None | Backend health check |

---

## 8. ML Pipeline Specification

### Feature Extraction — 12 Features

```python
features = {
    "login_count_per_minute":    float,  # SSH/auth login attempts per minute
    "ports_scanned":             float,  # Unique destination ports accessed
    "request_rate_ratio":        float,  # Current rate divided by baseline rate
    "geo_distance_from_baseline":float,  # Distance in km from normal login location
    "time_of_day_score":         float,  # Anomaly score for time (0=normal 1=unusual)
    "failed_auth_ratio":         float,  # Failed divided by total auth attempts
    "sudo_fail_count":           float,  # Failed sudo commands in window
    "unique_ports_per_min":      float,  # Unique destination ports per minute
    "bytes_transferred":         float,  # Total bytes in session
    "connection_duration":       float,  # Session duration in seconds
    "user_agent_entropy":        float,  # Shannon entropy of user agent strings
    "country_risk_score":        float,  # Country-based risk 0.0 to 1.0
}
```

### Isolation Forest Configuration

```python
IsolationForest(
    n_estimators=100,
    contamination=0.05,
    random_state=42,
    max_samples='auto',
)
# Alert threshold: score < -0.7
# Training samples: 48,000 minimum normal events
# Retraining: every 24 hours via cron
```

### Random Forest Classifier Configuration

```python
RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    class_weight='balanced',
)
# Classes:
# 0: Brute Force SSH
# 1: Port Scan / Recon
# 2: DDoS Pattern
# 3: Slow Brute Force
# 4: Geographic Anomaly
# 5: Privilege Escalation
```

### Alert Pipeline Timing

```
Log event occurs on server:          T+0s
Filebeat picks up log line:          T+1s
Logstash parses and enriches:        T+2s
Elasticsearch indexes document:      T+3s
Python ML script scores event:       T+4s
IF flags as anomaly:                 T+5s
RF classifies attack type:           T+6s
Alert written to Elasticsearch:      T+7s
Backend API detects new alert:       T+9s
Dashboard receives via poll/WS:      T+11s
User sees alert on dashboard:        T+13s
Total: Under 15 seconds guaranteed
```

---

## 9. Database Schema

### Users Table

```sql
CREATE TABLE users (
    id         VARCHAR(36)  PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'analyst',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active  BOOLEAN      DEFAULT TRUE
);
```

### Alerts Table

```sql
CREATE TABLE alerts (
    id                VARCHAR(36)  PRIMARY KEY,
    severity          VARCHAR(20)  NOT NULL,
    name              VARCHAR(255) NOT NULL,
    source_ip         VARCHAR(50),
    ml_classification VARCHAR(100),
    if_score          FLOAT,
    status            VARCHAR(30)  DEFAULT 'open',
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME,
    country           VARCHAR(100),
    attack_type       VARCHAR(100),
    raw_features      TEXT
);
```

### Rules Table

```sql
CREATE TABLE rules (
    id         VARCHAR(20)  PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    condition  VARCHAR(255) NOT NULL,
    severity   VARCHAR(20)  NOT NULL,
    action     VARCHAR(100) NOT NULL,
    enabled    BOOLEAN      DEFAULT TRUE,
    hits_today INTEGER      DEFAULT 0,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id         INTEGER      PRIMARY KEY AUTOINCREMENT,
    user_id    VARCHAR(36),
    user_email VARCHAR(255),
    action     VARCHAR(255) NOT NULL,
    resource   VARCHAR(255),
    details    TEXT,
    ip_address VARCHAR(50),
    success    BOOLEAN      DEFAULT TRUE,
    timestamp  DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

### Settings Table

```sql
CREATE TABLE settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT,
    updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. WebSocket and SSE Specification

### Live Log Stream — SSE

```
Endpoint: GET /api/logs/stream
Protocol: Server-Sent Events (text/event-stream)
Auth: None required (internal use)
Format: data: {"time":"HH:MM:SS","level":"INFO|WARN|ALERT|CRIT","message":"string"}\n\n
Interval: New event every 2.5 seconds
Client: EventSource API in React useEffect
Reconnect: EventSource auto-reconnects on disconnect
```

### React SSE Implementation

```javascript
useEffect(() => {
    const es = new EventSource('http://localhost:5000/api/logs/stream');
    es.onmessage = (event) => {
        const log = JSON.parse(event.data);
        if (!paused) {
            setLogs(prev => [...prev.slice(-200), log]);
        }
    };
    es.onerror = () => es.close();
    return () => es.close();
}, [paused]);
```

---

## 11. Authentication and RBAC

### JWT Token Payload

```json
{
    "id":    "user-uuid",
    "email": "admin@securewatch.local",
    "role":  "admin",
    "name":  "Admin User",
    "exp":   1714000000
}
```

### Role Permissions Matrix

| Permission | Admin | Analyst | Viewer |
|---|---|---|---|
| view_dashboard | Yes | Yes | Yes |
| view_live_logs | Yes | Yes | No |
| manage_alerts | Yes | Yes | No |
| create_rules | Yes | Yes | No |
| delete_rules | Yes | No | No |
| manage_users | Yes | No | No |
| view_raw_logs | Yes | Yes | No |
| export_data | Yes | Yes | No |
| retrain_model | Yes | No | No |
| access_settings | Yes | No | No |
| delete_system_data | Yes | No | No |

### Session Management

```
remember=true:  Store JWT in localStorage, expires in 30 days
remember=false: Store JWT in sessionStorage, expires in 8 hours
On logout: Remove from both localStorage and sessionStorage
On 401: Auto-remove token, redirect to /login via axios interceptor
```

---

## 12. ELK Stack Configuration

### docker-compose.yml (elk/)

```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

### Logstash Grok Patterns

```
SSH Auth Failure:
%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host} sshd\[%{NUMBER:pid}\]: Failed password for %{USERNAME:username} from %{IP:src_ip} port %{NUMBER:port}

SSH Auth Success:
%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host} sshd\[%{NUMBER:pid}\]: Accepted password for %{USERNAME:username} from %{IP:src_ip}

Sudo Failure:
%{SYSLOGTIMESTAMP:timestamp} %{HOSTNAME:host} sudo: %{USERNAME:username} : .* FAILED

Apache Access Log:
%{COMBINEDAPACHELOG}
```

---

## 13. Two-Week Build Plan

| Day | Phase | Tasks |
|---|---|---|
| Day 1 | Project Setup | Folder structure, Docker ELK up, Git init, .env, README |
| Day 2 | Log Pipeline | Logstash Grok patterns, Filebeat config, test log flow |
| Day 3 | ML — Isolation Forest | Feature extraction, generate 48k samples, train IF, save model.pkl |
| Day 4 | ML — RF Classifier | Label 500 attacks, train RF, build pipeline.py, test end-to-end |
| Day 5 | Backend Part 1 | Flask app, auth routes, stats, alerts, geo endpoints |
| Day 6 | Backend Part 2 | ML routes, rules CRUD, user routes, settings, SSE logs |
| Day 7 | React Setup + Auth | create-react-app, routing, AuthContext, Login page, Signup page |
| Day 8 | Dashboard + Layout | Topbar, Sidebar, Dashboard page with all components wired to API |
| Day 9 | Live Logs + Alerts | SSE stream page, pause/filter, Alerts table with all actions |
| Day 10 | Geo Map + ML Engine | World map dots, country table, ML metrics, confidence bars, scatter |
| Day 11 | Anomalies + Trends + Rules | All three pages wired to backend APIs |
| Day 12 | Settings + Admin | Six-tab settings with danger zone, My Account with permissions |
| Day 13 | Integration Testing | End-to-end: inject logs, verify ML detection, dashboard alert in 15s |
| Day 14 | Polish + Demo Data | Realistic data, README screenshots, demo video recording |
| +Day 15 | Deployment | docker-compose.full.yml, cloud VPS deploy, full system test |
| +Day 16 | Buffer | Final fixes, viva prep, submission |

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ELK Stack setup delay | High | Docker Compose starts full stack in under 5 minutes |
| ML false positives | High | Tune contamination 0.05 to 0.1, raise threshold -0.7 to -0.5 |
| ML misses attacks | High | Lower threshold to -0.8, add rule-based parallel fallback |
| WebSocket instability | Medium | SSE auto-reconnects natively, fall back to 2s polling |
| No labelled training data | Medium | Use CICIDS 2017 from Kaggle or synthetic generation script |
| CORS errors | Low | Flask-CORS origins=* in development |
| ML overruns deadline | High | Implement rule-based detection first, add ML as enhancement |
| React state complexity | Medium | Keep API calls in page components, use context only for auth |

---

## Final Note

This PRD is the single source of truth for SecureWatch AI v3.0. Every page, every function, every API endpoint, every CSS variable, every SVG icon ID, every database table, every ML parameter, and every build day is defined here. The frontend is React.js — all other specifications from v2 remain unchanged. Any developer or AI agent reading this document has everything needed to build the complete application without further clarification.