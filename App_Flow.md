# SecureWatch AI — Complete App Flow Document

**Version:** 1.0
**Frontend:** React.js + React Router DOM v6
**Date:** April 2025

---

## Navigation Hierarchy Overview

```
SecureWatch AI
│
├── PUBLIC ROUTES (no JWT required)
│   ├── /login          → Login.jsx
│   └── /signup         → Signup.jsx
│
└── PROTECTED ROUTES (JWT required)
    │
    ├── /               → Dashboard.jsx       [all roles]
    ├── /live-logs       → LiveLogs.jsx        [analyst, admin]
    ├── /alerts          → Alerts.jsx          [analyst, admin]
    ├── /geo-map         → GeoMap.jsx          [all roles]
    ├── /ml-engine       → MLEngine.jsx        [all roles]
    ├── /anomalies       → Anomalies.jsx       [analyst, admin]
    ├── /trends          → Trends.jsx          [all roles]
    ├── /rules           → Rules.jsx           [analyst, admin]
    ├── /settings        → Settings.jsx        [admin only]
    └── /admin           → Admin.jsx           [all roles]
```

---

## 1. Authentication Flow

### 1.1 App Startup — Token Rehydration

```
Browser loads React app
        ↓
index.jsx renders <AuthProvider>
        ↓
AuthContext useEffect fires
        ↓
┌───────────────────────────────────┐
│ tokenStorage.get()                │
│ Check localStorage first          │
│ Then check sessionStorage         │
└───────────────────────────────────┘
        ↓
   Token found?
   ┌────┴────┐
  YES       NO
   ↓         ↓
GET         user = null
/api/auth/me loading = false
   ↓         ↓
Success?  → Show /login
 ┌──┴──┐
YES    NO
 ↓      ↓
Set    Clear token
user   user = null
object loading = false
loading=false  ↓
 ↓        Redirect /login
App renders
with user
```

### 1.2 Login Flow

```
User lands on /login
        ↓
PublicRoute check:
  user already exists? → redirect to /
        ↓
Login.jsx renders:
  - SVG logo mark
  - Operator Login heading
  - Email input
  - Password input + ic-eye toggle
  - Remember me checkbox
  - Authenticate button
  - SSO divider + LDAP button
  - Sign up link
        ↓
User fills email + password
        ↓
handleLogin() fires on button click or Enter key
        ↓
Client validation:
  ┌─────────────────────────────────┐
  │ validateEmail()                  │
  │   regex: RFC 5322               │
  │   empty check                   │
  ├─────────────────────────────────┤
  │ validatePassword()               │
  │   length >= 12                  │
  │   not empty                     │
  └─────────────────────────────────┘
        ↓
   Valid?
  ┌──┴──┐
 NO    YES
  ↓      ↓
Show   Show loading spinner on button
inline  Disable button
error   ↓
       POST /api/auth/login
       { email, password }
        ↓
   Response?
  ┌─────┴─────┐
 200          401/500
  ↓              ↓
Extract        Show error banner:
token +        "Invalid credentials"
user           Re-enable button
  ↓
remember=true?
  ┌──┴──┐
 YES    NO
  ↓      ↓
localStorage  sessionStorage
(30 days)     (8 hours)
  ↓
setUser(user) in AuthContext
  ↓
useNavigate('/') → Dashboard
```

### 1.3 Session Expiration Behavior

```
User is active on any page
        ↓
Any API call fires via axios
        ↓
Server validates JWT
        ↓
JWT expired or invalid?
        ↓
Server returns HTTP 401
        ↓
axios response interceptor catches 401
        ↓
tokenStorage.clear()
  - removes from localStorage
  - removes from sessionStorage
        ↓
setUser(null) via AuthContext
        ↓
window.location.href = '/login'
        ↓
Login page renders
  ↓
Show optional toast:
"Session expired. Please sign in again."
        ↓
User logs in again → fresh JWT issued
```

### 1.4 Logout Flow

```
User clicks avatar in Topbar
        ↓
Dropdown appears:
  - My Account
  - Sign Out
        ↓
User clicks Sign Out
        ↓
logout() from useAuth()
        ↓
tokenStorage.clear()
        ↓
setUser(null)
        ↓
useNavigate('/login')
        ↓
PublicRoute allows /login
(no user in context)
        ↓
Login page renders clean
```

---

## 2. Signup Flow

```
User clicks "Request access" on Login
        ↓
useNavigate('/signup')
        ↓
PublicRoute check: user exists? → redirect /
        ↓
Signup.jsx renders:
  - SVG logo
  - Role selector (Analyst | Admin cards)
  - First Name + Last Name (grid)
  - Work Email
  - Password + strength meter
  - Confirm Password
  - Terms checkbox
  - Create Account button
        ↓
Step 1: Role Selection
  User clicks role card
        ↓
  selectRole(roleEl)
    - Remove selected from all cards
    - Add selected to clicked card
    - Icon stroke → cyan
    - Store role in local state
        ↓
Step 2: Form Fill
  User types password
        ↓
  checkPasswordStrength() on each keystroke:
    Score 0: bar hidden
    Score 1: 25% red     "Weak"
    Score 2: 50% orange  "Fair"
    Score 3: 75% yellow  "Good"
    Score 4: 100% green  "Strong"
        ↓
Step 3: Submit
  handleSignup() fires
        ↓
  Client validation:
    ┌────────────────────────────────┐
    │ Email: valid format?           │
    │ Password: >= 12 chars?         │
    │ Passwords match?               │
    │ Terms checkbox checked?        │
    └────────────────────────────────┘
        ↓
     Valid?
   ┌──┴──┐
  NO    YES
   ↓      ↓
 Inline  GET /api/auth/check-email (debounced 500ms)
 errors   ↓
        Email taken?
       ┌──┴──┐
      YES    NO
       ↓      ↓
    "Email   POST /api/auth/register
    already  { firstName, lastName,
    registered" email, password, role }
               ↓
            201 Created?
           ┌──┴──┐
          YES    NO
           ↓      ↓
        Auto-login: Show error
        POST /api/auth/login toast
           ↓
        Store token
        setUser()
        navigate('/')
```

---

## 3. Dashboard Navigation Flow

### 3.1 Initial Page Load

```
JWT valid → App renders AppLayout
        ↓
AppLayout renders:
  ┌─────────────────────────────────┐
  │  Topbar (fixed top, 50px)       │
  ├──────────┬──────────────────────┤
  │ Sidebar  │  Page Content        │
  │ (224px)  │  (flex 1, scroll)    │
  │          │                      │
  └──────────┴──────────────────────┘
        ↓
Dashboard.jsx mounts
        ↓
Parallel API calls fire immediately:
  ├── fetchDashboardStats()   → GET /api/stats
  ├── fetchLiveAlerts()       → GET /api/alerts?limit=6
  ├── fetchGeoData()          → GET /api/geo
  └── fetchTopIPs()           → GET /api/top-ips
        ↓
Loading state: skeleton placeholders shown
        ↓
All resolve → data populates:
  ├── 4 stat cards render with numbers
  ├── Alert feed renders 6 rows
  ├── Geo map renders pulsing dots
  ├── Top IPs table renders
  └── Timeline chart renders (recharts BarChart)
        ↓
useAutoRefresh starts:
  - fetchDashboardStats() every 2 seconds
  - fetchLiveAlerts()     every 2 seconds
  - fetchGeoData()        every 30 seconds
        ↓
Numbers update live without page reload
```

### 3.2 Sidebar Navigation Flow

```
Sidebar renders all nav items
        ↓
Current route highlighted:
  useLocation().pathname === item.path
  → active: cyan text + 2px left border + cyan icon
        ↓
User clicks nav item
        ↓
useNavigate(item.path)
        ↓
React Router matches new route
        ↓
Old page component unmounts:
  - clearInterval (auto-refresh stops)
  - WebSocket closes (if LiveLogs)
  - SSE closes (if LiveLogs)
        ↓
New page component mounts:
  - useEffect fires
  - API calls start
  - Data loads
        ↓
Sidebar highlight updates to new active route
```

### 3.3 Sidebar Collapse Flow

```
User clicks collapse toggle button (◀)
        ↓
toggleSidebar() in Sidebar.jsx
        ↓
setCollapsed(true)
        ↓
CSS transition: width 224px → 52px (0.25s ease)
        ↓
All nav labels disappear (display:none when collapsed)
All badges disappear
Section headers disappear
ML status footer disappears
        ↓
Icons remain visible and centred
        ↓
Toggle button icon: ic-chevron-left → ic-chevron-right
        ↓
Content area gains extra width automatically (flex layout)
        ↓
User clicks ▶ to expand:
Same flow in reverse
```

---

## 4. Alert Investigation Flow

```
User on Dashboard sees Live Alert Feed
        ↓
User clicks "View All →" link
        ↓
navigate('/alerts')
        ↓
Alerts.jsx mounts
        ↓
fetchAlerts() → GET /api/alerts
  All alerts loaded into state
        ↓
Table renders:
  Severity | Name | Source IP | ML Classification | Time | Status | Action
        ↓
═══════════════════════════════════════
FLOW A: Filter Alerts
═══════════════════════════════════════
User clicks severity pill: "Critical"
        ↓
setSeverity('critical')
        ↓
useEffect dependency changes
        ↓
fetchAlerts({ severity: 'critical' })
        ↓
Table re-renders filtered results
        ↓
User clicks status pill: "Open"
        ↓
fetchAlerts({ severity: 'critical', status: 'open' })
        ↓
Combined filter applied

═══════════════════════════════════════
FLOW B: Investigate Individual Alert
═══════════════════════════════════════
User clicks "Investigate" button on alert row
        ↓
investigateAlert(alertId)
        ↓
POST /api/alerts/{alertId}/status
{ status: "investigating" }
        ↓
200 OK response
        ↓
Update local state:
  alert.status = "investigating"
        ↓
Status dot changes: red → yellow
Button changes: "Investigate" → "View"
toast.success("Alert under investigation")

═══════════════════════════════════════
FLOW C: Block IP
═══════════════════════════════════════
User clicks "Block IP" button
        ↓
Modal opens:
  Title: "Block IP Address"
  Message: "Block 185.220.101.7? This adds it
            to the firewall blocklist."
  Confirm: red "Block IP" button
  Cancel: "Cancel" button
        ↓
User clicks "Block IP" in modal
        ↓
blockIP(alert.source_ip)
        ↓
POST /api/firewall/block
{ ip: "185.220.101.7" }
        ↓
200 OK
        ↓
Close modal
toast.success("IP 185.220.101.7 blocked")

═══════════════════════════════════════
FLOW D: Resolve Alert
═══════════════════════════════════════
User clicks "Resolve" (or investigates then resolves)
        ↓
resolveAlert(alertId)
        ↓
POST /api/alerts/{alertId}/status
{ status: "resolved" }
        ↓
Status dot: red/yellow → green
Row fades slightly (resolved state)
toast.success("Alert resolved")

═══════════════════════════════════════
FLOW E: Mark All Resolved
═══════════════════════════════════════
User clicks "Mark All Resolved" danger button
        ↓
Modal opens:
  Title: "Resolve All Alerts"
  Message: "This will mark all 12 open alerts
            as resolved. Cannot be undone."
  Confirm: red "Resolve All" button
        ↓
User confirms
        ↓
POST /api/alerts/resolve-all
        ↓
All alert rows update status → resolved
toast.success("All alerts resolved")
```

---

## 5. Real-Time Log Monitoring Flow

```
User navigates to /live-logs
        ↓
LiveLogs.jsx mounts
        ↓
Initial load: GET /api/logs
  Last 12 static log entries rendered
        ↓
startLogStream() fires in useEffect
        ↓
new EventSource('/api/logs/stream')
        ↓
SSE connection established to FastAPI
        ↓
Server sends log frame every 2.5 seconds:
  data: {"time":"04:22:05","level":"ALERT","message":"BRUTE FORCE..."}
        ↓
EventSource.onmessage fires
        ↓
paused state false?
  ┌──┴──┐
 YES    NO
  ↓      ↓
 Drop  Parse JSON
 frame  ↓
       setLogs(prev => [...prev.slice(-200), newLog])
       (max 200 lines kept in state to avoid memory leak)
        ↓
useEffect dependency on logs:
  scrollToBottom()
  logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight
        ↓
New log row appended to DOM with correct level class

═══════════════════════════════════════
FLOW A: Pause Stream
═══════════════════════════════════════
User clicks "Pause" button
        ↓
setPaused(true)
        ↓
Button text: "Pause" → "Resume"
        ↓
New frames arrive from SSE
  but are dropped (paused check in onmessage)
Existing logs stay frozen on screen
        ↓
User clicks "Resume"
        ↓
setPaused(false)
Stream continues appending

═══════════════════════════════════════
FLOW B: Filter by Level
═══════════════════════════════════════
User clicks "CRIT" filter button
        ↓
toggleLevel('CRIT') in local state
        ↓
activeLevels = ['INFO','WARN','ALERT'] (CRIT removed)
Wait — CRIT was active, now toggled off
activeLevels = ['INFO','WARN','ALERT','CRIT'].filter(l => l !== 'CRIT')
        ↓
Log rows re-render:
  CRIT rows: display none
  Others: visible
        ↓
User clicks CRIT again to re-enable

═══════════════════════════════════════
FLOW C: Keyword Search
═══════════════════════════════════════
User types "192.168.1.44" in search input
        ↓
filterByKeyword('192.168.1.44')
        ↓
Each log row filtered:
  message.toLowerCase().includes(keyword.toLowerCase())
        ↓
Non-matching rows: display none
Matching rows: visible with keyword highlighted

═══════════════════════════════════════
FLOW D: Page Unmount Cleanup
═══════════════════════════════════════
User navigates away from /live-logs
        ↓
LiveLogs.jsx unmounts
        ↓
useEffect cleanup function fires:
  eventSource.close()
  → SSE connection closed cleanly
  → No memory leak
  → Server stops sending frames to this client
```

---

## 6. WebSocket Reconnect Flow

```
useWebSocket('/ws/logs') hook initialises
        ↓
connect() function called
        ↓
Build URL: ws://localhost:8000/ws/logs?token=<JWT>
        ↓
new WebSocket(url)
setStatus('connecting')
        ↓
ws.onopen fires
        ↓
setStatus('connected')
retryCount = 0
Sidebar WS indicator: green dot
        ↓
Server sends log JSON frames
        ↓
ws.onmessage fires
onMessage callback called → page updates
        ↓
CONNECTION DROPS (network issue / server restart)
        ↓
ws.onclose fires
event.code check:
  ┌────────────────────────────────────────┐
  │ code 1000 (normal close)               │
  │   → No reconnect                       │
  │   → User navigated away               │
  ├────────────────────────────────────────┤
  │ code 4001 (auth failure)               │
  │   → No reconnect                       │
  │   → tokenStorage.clear()              │
  │   → navigate('/login')                │
  ├────────────────────────────────────────┤
  │ Any other code                         │
  │   → scheduleReconnect()               │
  └────────────────────────────────────────┘
        ↓
scheduleReconnect():
  Attempt 1: wait 1 second
  Attempt 2: wait 2 seconds
  Attempt 3: wait 5 seconds
  Attempt 4: wait 10 seconds
  Attempt 5+: wait 30 seconds
        ↓
setStatus('disconnected')
Sidebar WS indicator: red dot
        ↓
After delay: connect() called again
setStatus('connecting')
Sidebar WS indicator: yellow dot
        ↓
Connection succeeds?
  ┌──┴──┐
 YES    NO
  ↓      ↓
setStatus  scheduleReconnect
connected  with next delay
retryCount=0
        ↓
Component unmounts?
  clearTimeout(retryTimerRef)
  ws.close(1000)
  → clean shutdown, no reconnect triggered
```

---

## 7. ML Anomaly Workflow

```
User navigates to /ml-engine
        ↓
MLEngine.jsx mounts
        ↓
Parallel fetches:
  ├── GET /api/ml/metrics        → 4 metric cards
  ├── GET /api/ml/classification → confidence bars
  ├── GET /api/ml/scores         → scatter plot data
  └── GET /api/ml/config         → config panel
        ↓
Renders:
  ┌─────────────────────────────────────────┐
  │  73%       94%       88%       0.05     │
  │ Accuracy  Precision  Recall  Contaminat │
  ├──────────────────┬──────────────────────┤
  │ Classification   │  Scatter Plot        │
  │ Confidence Bars  │  cyan=normal         │
  │                  │  red=anomaly         │
  ├──────────────────┴──────────────────────┤
  │ Model Config: algorithm, n_estimators,   │
  │ last trained, samples, features, status  │
  └─────────────────────────────────────────┘

═══════════════════════════════════════
FLOW A: Retrain Model
═══════════════════════════════════════
User clicks "Retrain Model" button
        ↓
Button shows loading spinner
        ↓
POST /api/ml/retrain
        ↓
200 OK: { job_id: "retrain-001", eta: "5 minutes" }
        ↓
toast.success("Retraining started. ETA: 5 minutes")
Button re-enables

═══════════════════════════════════════
FLOW B: View Anomalies
═══════════════════════════════════════
User navigates to /anomalies
        ↓
Anomalies.jsx mounts
        ↓
GET /api/ml/anomalies
        ↓
Sort by if_score ascending (most extreme first)
        ↓
Hero card renders:
  Worst anomaly displayed large:
  "-0.92" in red JetBrains Mono
  IP: 192.168.1.44 · Brute Force SSH
  Detected 00:12s ago · Rule BF-001 triggered
        ↓
Anomaly table renders:
  Each row colour-coded by IF score:
    < -0.8  → red score
    -0.8 to -0.6 → orange score
    > -0.6  → yellow score
        ↓
User clicks "Investigate" on anomaly row
  → POST /api/alerts/{ip}/investigate
  → toast.success
        ↓
User clicks "Block"
  → Modal confirmation
  → POST /api/firewall/block { ip }
  → toast.success("IP blocked")
        ↓
User clicks "Re-scan"
  → POST /api/ml/rescan
  → toast.success("Re-scanning last 1000 events")
  → Table refreshes after 3 seconds
```

---

## 8. Rules Creation Workflow

```
User navigates to /rules
        ↓
Rules.jsx mounts
        ↓
GET /api/rules
  8 default rules loaded from PostgreSQL
        ↓
Table renders:
  ID | Name | Condition | Severity | Action | Hits | Toggle | Edit

═══════════════════════════════════════
FLOW A: Toggle Rule On/Off
═══════════════════════════════════════
User clicks toggle switch on rule row
        ↓
toggleRule(ruleId, !currentEnabled)
        ↓
Optimistic UI update:
  Toggle visually flips immediately
        ↓
PATCH /api/rules/{ruleId}
{ enabled: false }
        ↓
200 OK → confirm state
Error → revert toggle, show error toast

═══════════════════════════════════════
FLOW B: Create New Rule
═══════════════════════════════════════
User clicks "+ New Rule" button
        ↓
Modal opens:
  ┌─────────────────────────────────┐
  │  CREATE DETECTION RULE           │
  │                                  │
  │  Rule Name: [____________]       │
  │  Condition: [____________]       │
  │  Severity:  [critical ▼]        │
  │  Action:    [Alert + Block ▼]   │
  │                                  │
  │  [Cancel]  [Create Rule]         │
  └─────────────────────────────────┘
        ↓
User fills form:
  Name: "SSH Root Login Attempt"
  Condition: "username = root AND auth_type = ssh"
  Severity: critical
  Action: Alert + Block
        ↓
User clicks "Create Rule"
        ↓
Client validation:
  validateCondition(condition):
    Check format: field operator value
    Return error if malformed
        ↓
   Valid?
  ┌──┴──┐
 NO    YES
  ↓      ↓
Inline  POST /api/rules
error   { name, condition, severity, action }
         ↓
       201 Created
         ↓
       Close modal
       Add new rule to top of table
       toast.success("Rule created: SSH Root Login Attempt")

═══════════════════════════════════════
FLOW C: Edit Existing Rule
═══════════════════════════════════════
User clicks "Edit" on rule row
        ↓
openEditModal(rule)
  Populate modal fields with existing rule data
        ↓
Same modal as Create but pre-filled
Title: "EDIT RULE — BF-001"
        ↓
User modifies condition or action
        ↓
User clicks "Save Changes"
        ↓
PUT /api/rules/{ruleId}
{ full updated rule object }
        ↓
200 OK
Close modal
Update rule in table state
toast.success("Rule updated")

═══════════════════════════════════════
FLOW D: Delete Rule
═══════════════════════════════════════
User clicks "Edit" → then "Delete Rule" inside modal
        ↓
Confirmation modal:
  "Delete rule BF-001: SSH Brute Force?
   This cannot be undone."
  Red "Delete" button
        ↓
User confirms
        ↓
DELETE /api/rules/{ruleId}
        ↓
204 No Content
Close modal
Remove rule from table state
toast.success("Rule deleted")
```

---

## 9. Settings Workflow

```
User navigates to /settings
        ↓
PrivateRoute checks: user.role === 'admin'?
  ┌──┴──┐
 NO    YES
  ↓      ↓
navigate('/')  Settings.jsx mounts
"Access denied"
        ↓
GET /api/settings → all current settings loaded
        ↓
Two-column layout renders:
  Left: settings nav (190px)
  Right: active tab content

═══════════════════════════════════════
FLOW A: Switch Settings Tab
═══════════════════════════════════════
User clicks "Notifications" in left nav
        ↓
switchSettingsTab('notifications')
        ↓
setActiveTab('notifications')
        ↓
Left nav: "Notifications" gets active style
  (2px left cyan border, cyan text)
        ↓
Right panel: Notifications tab content shows
  All other tabs: display none

═══════════════════════════════════════
FLOW B: Save General Settings
═══════════════════════════════════════
User changes System Name field
User changes Timezone dropdown
        ↓
User clicks "Save Changes"
        ↓
Button shows loading state
        ↓
POST /api/settings/general
{ system_name, timezone, log_retention, refresh_interval }
        ↓
200 OK
toast.success("General settings saved")
Button re-enables

═══════════════════════════════════════
FLOW C: ML Config Save + Retrain
═══════════════════════════════════════
User clicks "ML Config" tab
        ↓
User changes contamination from 0.05 to 0.08
User changes alert threshold from -0.7 to -0.6
        ↓
User clicks "Save + Retrain"
        ↓
POST /api/settings/ml
{ contamination: 0.08, alert_threshold: -0.6, ... }
        ↓
200 OK: "ML settings saved. Model will retrain."
toast.success("ML settings saved. Retraining model...")

═══════════════════════════════════════
FLOW D: Test Connections
═══════════════════════════════════════
User clicks "Integrations" tab
        ↓
User clicks "Test + Save" button
        ↓
GET /api/settings/test-connections
        ↓
Response:
  {
    elasticsearch: "connected",
    kibana: "connected",
    logstash: "connected",
    filebeat: "connected"
  }
        ↓
Status badges update:
  connected → green "Connected"
  unreachable → red "Unreachable"

═══════════════════════════════════════
FLOW E: Danger Zone — Flush Logs
═══════════════════════════════════════
User clicks "Danger Zone" tab (ic-alerts icon, red text)
        ↓
Danger zone renders with red border section
        ↓
User clicks "Flush Logs" button
        ↓
Confirmation modal opens:
  Title: "Flush All Logs"
  Message: "This permanently deletes all stored
            log data. This cannot be undone."
  Input: "Type FLUSH to confirm"
  Button: red "Flush Logs"
        ↓
User types "FLUSH" in input
        ↓
"Flush Logs" button enables
        ↓
User clicks "Flush Logs"
        ↓
DELETE /api/settings/flush-logs
{ confirm: "FLUSH" }
        ↓
200 OK
Close modal
toast.success("All logs flushed")

═══════════════════════════════════════
FLOW F: Danger Zone — Reset ML Model
═══════════════════════════════════════
User clicks "Reset Model" button
        ↓
Modal: "Type RESET to confirm"
        ↓
POST /api/settings/reset-ml
{ confirm: "RESET" }
        ↓
toast.success("ML model reset. Retraining from scratch.")

═══════════════════════════════════════
FLOW G: Danger Zone — Delete Users
═══════════════════════════════════════
User clicks "Delete Users" button
        ↓
Modal: "Type DELETE to confirm"
        ↓
DELETE /api/settings/delete-users
{ confirm: "DELETE" }
        ↓
toast.success("Non-admin users deleted")
```

---

## 10. User Profile Workflow

```
User clicks avatar in Topbar
        ↓
Dropdown menu appears:
  - My Account
  - Sign Out
        ↓
User clicks "My Account"
        ↓
navigate('/admin')
        ↓
Admin.jsx mounts
        ↓
Parallel fetches:
  ├── GET /api/user/me          → profile data
  ├── GET /api/user/stats       → stat cards
  ├── GET /api/user/activity    → activity list
  └── GET /api/user/permissions → permissions list
        ↓
Page renders:
  ┌───────────────────────────────────────┐
  │  [Avatar]  Name          [Edit] [PWD] │
  │            Role: Admin                │
  │            email@securewatch.local    │
  │            Last login: Today 04:20 UTC│
  ├───────────────────────────────────────┤
  │  247        18       94%      14d     │
  │ Alerts    Rules    Uptime   Days      │
  ├──────────────────┬────────────────────┤
  │  Recent Activity │  Permissions       │
  │  icon + action   │  name + ✓ or ✗    │
  │  + relative time │                    │
  └──────────────────┴────────────────────┘

═══════════════════════════════════════
FLOW A: Edit Profile
═══════════════════════════════════════
User clicks "Edit Profile"
        ↓
Modal opens:
  Name: [current name input]
  Email: [read-only — email cannot change]
        ↓
User updates name
        ↓
PUT /api/user/me
{ name: "New Name" }
        ↓
200 OK
setUser updates in AuthContext
Profile card updates
toast.success("Profile updated")

═══════════════════════════════════════
FLOW B: Change Password
═══════════════════════════════════════
User clicks "Change Password"
        ↓
Modal opens:
  Current Password: [password input]
  New Password:     [password input]
  Confirm New:      [password input]
        ↓
User fills all three fields
        ↓
POST /api/user/change-password
{ current, newPass }
        ↓
400? → "Current password is incorrect"
200? → toast.success("Password changed")
       Modal closes

═══════════════════════════════════════
FLOW C: Sign Out from My Account
═══════════════════════════════════════
User clicks "Sign Out" danger button (top right)
        ↓
logout() from useAuth()
        ↓
tokenStorage.clear()
setUser(null)
navigate('/login')
```

---

## 11. Admin Workflow

### 11.1 Admin-Only Capabilities

```
Admin user logs in
        ↓
Sidebar renders ALL nav items:
  ✓ Dashboard
  ✓ Live Logs
  ✓ Alerts
  ✓ Geo Map
  ✓ ML Engine
  ✓ Anomalies
  ✓ Trends
  ✓ Rules
  ✓ Settings       ← Admin only
  ✓ My Account
        ↓
Admin visits /settings
  → Full access to all 6 tabs
  → Danger Zone visible
  → Can flush logs, reset ML, delete users
        ↓
Admin can toggle any rule on/off
Admin can delete rules
Admin can retrain ML model
Admin can block IP addresses
Admin can resolve all alerts at once
```

### 11.2 Admin vs Analyst vs Viewer Differences

```
ROUTE ACCESS:

Route          │ Admin │ Analyst │ Viewer
───────────────┼───────┼─────────┼────────
/              │  ✓    │   ✓     │  ✓
/live-logs     │  ✓    │   ✓     │  ✗ → /
/alerts        │  ✓    │   ✓     │  ✗ → /
/geo-map       │  ✓    │   ✓     │  ✓
/ml-engine     │  ✓    │   ✓     │  ✓
/anomalies     │  ✓    │   ✓     │  ✗ → /
/trends        │  ✓    │   ✓     │  ✓
/rules         │  ✓    │   ✓     │  ✗ → /
/settings      │  ✓    │   ✗ → / │  ✗ → /
/admin         │  ✓    │   ✓     │  ✓

ACTION ACCESS:

Action                │ Admin │ Analyst │ Viewer
──────────────────────┼───────┼─────────┼────────
View dashboard        │  ✓    │   ✓     │  ✓
View live logs        │  ✓    │   ✓     │  ✗
Investigate alerts    │  ✓    │   ✓     │  ✗
Block IP              │  ✓    │   ✓     │  ✗
Create rules          │  ✓    │   ✓     │  ✗
Delete rules          │  ✓    │   ✗     │  ✗
Retrain ML model      │  ✓    │   ✗     │  ✗
Access settings       │  ✓    │   ✗     │  ✗
Flush logs            │  ✓    │   ✗     │  ✗
Delete users          │  ✓    │   ✗     │  ✗
Export data           │  ✓    │   ✓     │  ✗
```

---

## 12. Protected Routes Structure

```javascript
// Complete route protection logic

App.jsx route tree:

/login   → PublicRoute → Login
/signup  → PublicRoute → Signup

/ → PrivateRoute(any) → AppLayout → Dashboard

/live-logs → PrivateRoute(permission="view_live_logs")
             → AppLayout → LiveLogs

/alerts    → PrivateRoute(permission="manage_alerts")
             → AppLayout → Alerts

/geo-map   → PrivateRoute(any)
             → AppLayout → GeoMap

/ml-engine → PrivateRoute(any)
             → AppLayout → MLEngine

/anomalies → PrivateRoute(any)
             → AppLayout → Anomalies

/trends    → PrivateRoute(any)
             → AppLayout → Trends

/rules     → PrivateRoute(permission="create_rules")
             → AppLayout → Rules

/settings  → PrivateRoute(requiredRole="admin")
             → AppLayout → Settings

/admin     → PrivateRoute(any)
             → AppLayout → Admin

*          → Navigate to /

PrivateRoute decision tree:
        ↓
  loading=true?
    → render <LoadingScreen />
        ↓
  user=null?
    → <Navigate to="/login" replace />
        ↓
  requiredRole set AND user.role !== requiredRole?
    → <Navigate to="/" replace />
        ↓
  permission set AND user.role lacks permission?
    → <Navigate to="/" replace />
        ↓
  → render children
```

---

## 13. Error Handling Flow

### 13.1 API Error Flow

```
Any page makes API call
        ↓
axios request interceptor:
  Attaches Authorization: Bearer <token>
        ↓
Request sent to FastAPI
        ↓
Response received:
  ┌──────────────────────────────────────┐
  │ 200-299 → success path               │
  │ 400     → validation error           │
  │ 401     → session expired (see 1.3)  │
  │ 403     → permission denied          │
  │ 404     → not found                  │
  │ 422     → Pydantic validation error  │
  │ 429     → rate limited               │
  │ 500     → server error               │
  │ Network → CORS / server down         │
  └──────────────────────────────────────┘
        ↓
axios response interceptor:
  401 → auto logout (see session flow)
  All others → reject with error object
        ↓
catch block in page component:
  err.response?.data?.error  → use API message
  err.response?.status 403   → "Permission denied"
  err.response?.status 404   → "Not found"
  err.message === "Network Error" → "Cannot connect to server"
  fallback → "An unexpected error occurred"
        ↓
setError(message) in component state
        ↓
One of:
  A. Inline error banner in page
  B. toast.error(message) via react-hot-toast
  C. Modal with error (for critical actions)
```

### 13.2 Form Error Flow

```
User submits form
        ↓
Client-side validation runs first
        ↓
Errors found?
  ┌──┴──┐
 YES    NO
  ↓      ↓
Show    API call fires
inline
errors
below
each
field
(red text,
red border
on input)
        ↓
API returns 400 or 422?
        ↓
Map field errors to inputs:
  "Email already registered" → email field error
  "Password too short" → password field error
  Generic → top-level error banner
```

---

## 14. Loading States

### 14.1 Page Load Loading States

```
Every page component has loading state
        ↓
loading=true during initial fetch
        ↓
Render pattern:

if (loading) return (
  <div style={{ padding: 24 }}>
    <SkeletonLoader/>
  </div>
)

if (error) return (
  <div style={{ padding: 24 }}>
    <ErrorBanner message={error} onRetry={fetchData} />
  </div>
)

return <PageContent data={data} />

SkeletonLoader shows:
  - Grey placeholder bars where content will appear
  - Animated shimmer effect via CSS animation
  - Matches layout of actual content
```

### 14.2 Action Button Loading States

```
User clicks action button
        ↓
setActionLoading(true)
Button renders:
  - Spinner icon replaces button text
  - Button disabled (pointer-events: none)
  - Opacity reduced
        ↓
API call resolves or rejects
        ↓
setActionLoading(false)
Button restores to normal state
```

### 14.3 Dashboard Auto-Refresh Loading

```
Dashboard stats auto-refresh every 2 seconds
        ↓
Do NOT show loading state on refresh:
  - Numbers update silently
  - No skeleton, no spinner
  - Previous values stay visible
        ↓
Only show loading on first mount
```

---

## 15. API Failure Handling

### 15.1 Retry Strategy

```
API call fails with network error
(server unreachable, timeout)
        ↓
useAutoRefresh handles it gracefully:
  Next interval fires after 2 seconds
  Tries again automatically
  No user action required
        ↓
If 3 consecutive failures:
  Show persistent warning banner:
  "Connection issues detected.
   Retrying automatically..."
  Yellow warning bar at top of page
        ↓
On next success:
  Banner disappears
  Data updates normally
```

### 15.2 Offline Detection

```
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)
        ↓
offline event fires:
  Show persistent banner:
  "You are offline. Reconnecting..."
  Pause all auto-refresh intervals
        ↓
online event fires:
  Hide banner
  Resume all intervals
  Immediate fetch to sync data
```

---

## 16. User Interaction Diagrams

### 16.1 Dashboard Interaction Map

```
Dashboard
    │
    ├── Stat Cards
    │     └── (display only, no interaction)
    │
    ├── Live Alert Feed
    │     ├── Alert row click  → (future: alert detail modal)
    │     └── "View All →"    → navigate('/alerts')
    │
    ├── Attack Origin Map
    │     └── Dot hover        → tooltip: country + count + type
    │
    ├── Top Offending IPs
    │     └── (display only)
    │
    └── Alert Timeline
          └── Bar hover         → recharts Tooltip
```

### 16.2 Alerts Page Interaction Map

```
Alerts Page
    │
    ├── Severity Filter Pills
    │     └── Click pill        → filter by severity
    │
    ├── Status Filter Pills
    │     └── Click pill        → filter by status
    │
    ├── "Export" button         → GET /api/alerts/export
    │
    ├── "Mark All Resolved"     → confirmation modal → POST /api/alerts/resolve-all
    │
    └── Table rows
          ├── "Investigate"     → POST /api/alerts/:id/status {investigating}
          ├── "View"            → POST /api/alerts/:id/status (same)
          ├── "Block IP"        → confirmation modal → POST /api/firewall/block
          ├── "Watch"           → POST /api/alerts/:id/status {open, watching}
          └── "Resolve"         → POST /api/alerts/:id/status {resolved}
```

### 16.3 Rules Page Interaction Map

```
Rules Page
    │
    ├── "+ New Rule"            → create modal → POST /api/rules
    │
    ├── "Import Rules"          → file picker → POST /api/rules/import
    │
    └── Table rows
          ├── Toggle switch      → PATCH /api/rules/:id {enabled}
          └── "Edit" button      → edit modal
                ├── Save         → PUT /api/rules/:id
                └── Delete       → confirm modal → DELETE /api/rules/:id
```

---

## 17. Complete App Flow Summary

```
                    SECUREWATCH AI — COMPLETE APP FLOW
                    ===================================

BROWSER OPENS
     ↓
AuthContext rehydrates (token check)
     ↓
     ├── No token → /login → user authenticates → /dashboard
     └── Valid token → /dashboard directly

DASHBOARD (/)
     ↓ auto-refresh 2s
     ├── Stats update silently
     ├── Alert feed updates
     └── User navigates via sidebar

     /live-logs  → SSE stream → filter → pause → search
     /alerts     → filter → investigate → block → resolve
     /geo-map    → view attack origins → country table
     /ml-engine  → view metrics → retrain (admin)
     /anomalies  → hero card → investigate → block
     /trends     → 7d/30d toggle → breakdown view
     /rules      → toggle → create → edit → delete
     /settings   → tab switch → save → danger zone (admin)
     /admin      → profile → edit → change password → logout

ANY PAGE
     ↓
     ├── 401 → auto logout → /login
     ├── 403 → toast error → stay on page
     ├── Network error → retry banner
     └── 500 → error toast

LOGOUT
     ↓
Clear token → setUser(null) → /login
```

---

This document defines every user flow, route, interaction, and error path in SecureWatch AI. Every flow maps directly to the API contracts defined in the PRD and TRD. Any React developer can implement the complete frontend from this document without additional clarification.