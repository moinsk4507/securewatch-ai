# SecureWatch AI — UI/UX Design Brief

**Classification:** Engineering Design Specification
**Version:** 1.0
**Stack:** React.js + CSS Modules
**Date:** April 2025

---

## Design Philosophy

### Core Principle

SecureWatch AI is not a consumer product. It is an operational tool used by security analysts under pressure, in low-light environments, across long shifts. Every design decision serves one purpose — **give analysts the right information at the right time with zero cognitive friction.**

### Design Ethos — Five Laws

**Law 1 — Information Density Over Aesthetics**
Every pixel earns its place. No decorative whitespace. No padding added for visual breathing room alone. If a cell can hold three data points, it holds three data points.

**Law 2 — Sharp Edges Signal Precision**
Rounded corners communicate softness, friendliness, consumer apps. SecureWatch AI is a precision instrument. Every corner is 90 degrees. Every border is a hard line.

**Law 3 — Colour Carries Meaning**
Colour is never decorative. Cyan means active, interactive, selected. Red means critical threat. Orange means high severity. Yellow means medium. Green means safe or confirmed. Purple means ML-computed. Blue means informational. If something glows, it is because the system demands your attention.

**Law 4 — Motion Serves Function**
Animations communicate state changes, not personality. A pulsing dot means live. A fading row means resolved. A sliding panel means transition. Nothing animates to be beautiful.

**Law 5 — Hierarchy Is Non-Negotiable**
The most critical information is always the largest and brightest. Severity scores dominate their containers. Alert names are bold. Timestamps are muted. The visual hierarchy matches the operational hierarchy.

### Design Reference Points

- Splunk SIEM operational dashboards
- Bloomberg Terminal information density
- Palantir Gotham dark interface
- Military-grade HUD displays
- NASA mission control panel layouts
- Industrial SCADA monitoring systems

---

## 1. Colour Palette

### 1.1 Foundation Colours

```css
:root {
  /* ── BACKGROUNDS ── */
  --bg-void:      #030608;   /* Deepest black — behind everything */
  --bg-base:      #060b11;   /* Page background */
  --bg-surface:   #0b1220;   /* Topbar, sidebar */
  --bg-elevated:  #0f1a2e;   /* Inputs, secondary panels */
  --bg-card:      #0d1828;   /* All cards */
  --bg-card-alt:  #0a1420;   /* Alternate card (log stream) */
  --bg-overlay:   #071020cc; /* Modal backdrop — 80% opacity */

  /* ── BORDERS ── */
  --border-subtle:  #1a2d45;  /* Default borders */
  --border-default: #223550;  /* Hover borders, focused inputs */
  --border-strong:  #2e4a6e;  /* Active elements */

  /* ── TEXT ── */
  --text-primary:   #e4eaf4;  /* Main readable text */
  --text-secondary: #7a9bbf;  /* Labels, subtitles, metadata */
  --text-muted:     #3d5a7a;  /* Timestamps, placeholders */
  --text-disabled:  #243a52;  /* Disabled state text */

  /* ── ACCENT — CYAN (Primary) ── */
  --cyan-bright:  #00d4ff;  /* Active states, icons, links, logo */
  --cyan-dim:     #0097b8;  /* Hover state of cyan elements */
  --cyan-ghost:   rgba(0, 212, 255, 0.08);  /* Active backgrounds */
  --cyan-glow:    rgba(0, 212, 255, 0.15);  /* Glow effects */
  --cyan-border:  rgba(0, 212, 255, 0.25);  /* Cyan-tinted borders */

  /* ── SEVERITY — RED (Critical) ── */
  --red-bright:   #ff3b5c;
  --red-dim:      #cc2244;
  --red-ghost:    rgba(255, 59, 92, 0.08);
  --red-glow:     rgba(255, 59, 92, 0.20);
  --red-border:   rgba(255, 59, 92, 0.30);

  /* ── SEVERITY — ORANGE (High) ── */
  --orange-bright: #ff8c42;
  --orange-dim:    #cc6422;
  --orange-ghost:  rgba(255, 140, 66, 0.08);
  --orange-glow:   rgba(255, 140, 66, 0.20);
  --orange-border: rgba(255, 140, 66, 0.30);

  /* ── SEVERITY — YELLOW (Medium) ── */
  --yellow-bright: #ffd166;
  --yellow-dim:    #cca033;
  --yellow-ghost:  rgba(255, 209, 102, 0.08);
  --yellow-glow:   rgba(255, 209, 102, 0.15);
  --yellow-border: rgba(255, 209, 102, 0.25);

  /* ── SEVERITY — GREEN (Low / Healthy) ── */
  --green-bright:  #00e887;
  --green-dim:     #00aa55;
  --green-ghost:   rgba(0, 232, 135, 0.08);
  --green-glow:    rgba(0, 232, 135, 0.20);
  --green-border:  rgba(0, 232, 135, 0.20);

  /* ── ML / ANALYTICS — PURPLE ── */
  --purple-bright: #9b7dff;
  --purple-dim:    #6a4fd4;
  --purple-ghost:  rgba(155, 125, 255, 0.08);
  --purple-border: rgba(155, 125, 255, 0.25);

  /* ── INFORMATIONAL — BLUE ── */
  --blue-bright:   #3b82f6;
  --blue-dim:      #1d5fd4;
  --blue-ghost:    rgba(59, 130, 246, 0.08);
  --blue-border:   rgba(59, 130, 246, 0.25);

  /* ── CHART PALETTE ── */
  --chart-1: #00d4ff;  /* Cyan */
  --chart-2: #ff3b5c;  /* Red */
  --chart-3: #ff8c42;  /* Orange */
  --chart-4: #ffd166;  /* Yellow */
  --chart-5: #9b7dff;  /* Purple */
  --chart-6: #00e887;  /* Green */
}
```

### 1.2 Colour Usage Rules

**Never use colour decoratively.** Every colour instance must carry one of these meanings:

| Colour | Meaning | Usage |
|---|---|---|
| Cyan `#00d4ff` | Active, interactive, selected, live | Active nav items, focused inputs, primary buttons, links |
| Red `#ff3b5c` | Critical threat, danger, urgent | CRIT badges, threat counts, danger zone, error states |
| Orange `#ff8c42` | High severity, warning | HIGH badges, brute force stats, high-risk bars |
| Yellow `#ffd166` | Medium severity, caution | MED badges, recall metrics, caution indicators |
| Green `#00e887` | Safe, healthy, resolved, success | LOW badges, pipeline health, success toasts |
| Purple `#9b7dff` | ML-computed, analytical | ML metrics, anomaly scatter, contamination score |
| Blue `#3b82f6` | Informational only | INFO log level, informational tooltips |
| White `#e4eaf4` | Primary readable text | Body text, card titles, table data |

### 1.3 Severity Colour System

```
CRITICAL  ██████  #ff3b5c  Red neon    — Immediate action required
HIGH      ██████  #ff8c42  Orange neon — Action required soon
MEDIUM    ██████  #ffd166  Yellow neon — Monitor closely
LOW       ██████  #00e887  Green neon  — Informational
```

---

## 2. Typography System

### 2.1 Font Stack

```css
:root {
  --font-display: 'Syne', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}
```

**Syne** — All UI text, headings, labels, navigation, buttons
**JetBrains Mono** — IP addresses, IF scores, timestamps, log messages, code conditions, stat values, any numeric data that must be scannable

### 2.2 Type Scale

```css
:root {
  /* ── DISPLAY ── */
  --text-stat:    clamp(28px, 3vw, 36px);  /* Stat card values */
  --text-hero:    42px;                     /* Hero anomaly score */

  /* ── HEADINGS ── */
  --text-page:    18px;   /* Page titles */
  --text-section: 15px;   /* Section headings */
  --text-card:    13px;   /* Card titles */

  /* ── BODY ── */
  --text-body:    13px;   /* Primary body text */
  --text-small:   12px;   /* Secondary body, table data */
  --text-xs:      11px;   /* Metadata, subtitles */
  --text-2xs:     10px;   /* Helper text, hints */

  /* ── LABELS ── */
  --text-label:   10px;   /* Uppercase section labels */
  --text-badge:   9px;    /* Severity badges */
  --text-nano:    9px;    /* Timestamps in mono */
}
```

### 2.3 Type Treatments

**Page Titles**
```css
.page-title {
  font-family: var(--font-display);
  font-size: var(--text-page);
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-primary);
}
```

**Section Labels**
```css
.section-label {
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

**Stat Values**
```css
.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-stat);
  font-weight: 800;
  line-height: 1;
  /* colour applied per severity */
}
```

**Monospace Data**
```css
.data-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--text-secondary);
}

/* IP addresses specifically */
.ip-address {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--cyan-bright);
  letter-spacing: 0.5px;
}
```

**Log Messages**
```css
.log-message {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.4;
}
```

### 2.4 Typography Don'ts

- Never use font-weight below 400 on dark backgrounds — too hard to read
- Never use italic on monospace data
- Never mix Syne and JetBrains Mono in the same sentence unless one is a code element
- Never use text-transform: uppercase on body copy longer than 4 words
- Never use letter-spacing on body text — only on uppercase labels and buttons

---

## 3. Grid System

### 3.1 Layout Grid

```css
/* App shell — fixed layout, no scrolling on body */
.app-shell {
  display: grid;
  grid-template-rows: 50px 1fr;    /* Topbar + content */
  grid-template-columns: auto 1fr; /* Sidebar + main */
  height: 100vh;
  overflow: hidden;
}

/* Page content area */
.page-content {
  padding: 24px;
  overflow-y: auto;
  height: 100%;
}
```

### 3.2 Page-Level Grids

**Dashboard — Two-column primary grid:**
```css
.dashboard-primary {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 14px;
  margin-bottom: 14px;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
```

**Settings — Left nav + content:**
```css
.settings-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 16px;
}
```

**Geo Map stats row:**
```css
.geo-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
```

**ML Engine — Two-column metrics:**
```css
.ml-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.ml-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
```

**Profile — Two-column lower section:**
```css
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
```

### 3.3 Gap Standards

```css
:root {
  --gap-xs:  6px;   /* Between tight inline elements */
  --gap-sm:  8px;   /* Between filter pills */
  --gap-md:  12px;  /* Between geo stat cards */
  --gap-lg:  14px;  /* Primary grid gaps */
  --gap-xl:  20px;  /* Between major sections */
  --gap-2xl: 24px;  /* Page padding */
}
```

---

## 4. Spacing System

### 4.1 Base Unit

Base unit: **4px**. All spacing is a multiple of 4.

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### 4.2 Component Spacing Standards

```css
/* Card internal padding */
.card-header { padding: 14px 18px; }
.card-body   { padding: 14px 18px; }

/* Table cells */
.table-th { padding: 10px 14px; }
.table-td { padding: 11px 14px; }

/* Alert rows */
.alert-row { padding: 11px 14px; margin-bottom: 7px; }

/* Nav items */
.nav-item { padding: 9px 14px; }

/* Badges */
.badge { padding: 2px 7px; }

/* Buttons */
.btn-primary   { padding: 10px 20px; }
.btn-secondary { padding: 7px 14px; }
.btn-action    { padding: 3px 10px; }

/* Inputs */
.form-input { padding: 10px 14px; }

/* Page padding */
.page { padding: 24px; }
```

### 4.3 Density Rule

SecureWatch AI is a **dense UI**. Resist the urge to add padding. Analyst screens display large amounts of data simultaneously. Every extra pixel of padding is a data point that doesn't fit. Tighter is better unless it breaks readability.

---

## 5. Sidebar Behaviour

### 5.1 Dimensions

```css
:root {
  --sidebar-expanded:  224px;
  --sidebar-collapsed: 52px;
}

.sidebar {
  width: var(--sidebar-expanded);
  transition: width 0.25s ease;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}
```

### 5.2 Toggle Button

```css
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  cursor: pointer;
  margin: 10px auto 4px;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.sidebar-toggle:hover {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
```

### 5.3 Nav Item States

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  color: var(--text-secondary);
}

/* Default hover */
.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* Active/current route */
.nav-item.active {
  background: var(--cyan-ghost);
  border-left-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* Active icon tint */
.nav-item.active .nav-icon {
  color: var(--cyan-bright);
}

/* Collapsed state — icons only */
.sidebar.collapsed .nav-item {
  padding: 9px 0;
  justify-content: center;
}
.sidebar.collapsed .nav-label,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .nav-section,
.sidebar.collapsed .ml-status {
  display: none;
}
```

### 5.4 Nav Badges

```css
.nav-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  background: var(--red-ghost);
  color: var(--red-bright);
  flex-shrink: 0;
}

.nav-badge.green {
  background: var(--green-ghost);
  color: var(--green-bright);
}
```

### 5.5 ML Status Footer

```css
.ml-status {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  padding: 10px 12px;
  margin: 10px 12px;
}

.ml-status-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.ml-bar-track {
  height: 2px;
  background: var(--border-subtle);
}

.ml-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan-bright), var(--purple-bright));
}

.ml-bar-text {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--cyan-bright);
  margin-top: 5px;
}
```

---

## 6. Navigation Behaviour

### 6.1 Topbar Specification

```css
.topbar {
  height: 50px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  flex-shrink: 0;
  z-index: 100;
}
```

**Live Indicator:**
```css
.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--green-bright);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--green-bright);
  animation: livePulse 1.5s infinite;
}

@keyframes livePulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(0, 232, 135, 0.5);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 5px rgba(0, 232, 135, 0);
  }
}
```

**Search Bar:**
```css
.topbar-search {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  transition: border-color 0.2s;
}

.topbar-search:focus-within {
  border-color: var(--cyan-bright);
  box-shadow: 0 0 0 1px var(--cyan-glow);
}

.topbar-search input {
  background: none;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 12px;
  outline: none;
  width: 100%;
}
```

**Critical Alert Button:**
```css
.topbar-critical {
  background: var(--red-ghost);
  border: 1px solid var(--red-border);
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 800;
  color: var(--red-bright);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: background 0.15s;
}

.topbar-critical:hover {
  background: rgba(255, 59, 92, 0.14);
}
```

---

## 7. Card Design

### 7.1 Base Card

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  /* Zero border-radius — non-negotiable */
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-title {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  padding: 14px 18px;
}
```

### 7.2 Stat Card

```css
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
}

/* Top accent line — 2px, severity-coloured */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.stat-card--red::before    { background: var(--red-bright);    }
.stat-card--orange::before { background: var(--orange-bright); }
.stat-card--cyan::before   { background: var(--cyan-bright);   }
.stat-card--green::before  { background: var(--green-bright);  }
.stat-card--purple::before { background: var(--purple-bright); }

.stat-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 10px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-stat);
  font-weight: 800;
  line-height: 1;
}

.stat-value--red    { color: var(--red-bright);    }
.stat-value--orange { color: var(--orange-bright); }
.stat-value--cyan   { color: var(--cyan-bright);   }
.stat-value--green  { color: var(--green-bright);  }

.stat-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
}
```

### 7.3 Log Stream Card

```css
.log-stream-card {
  background: var(--bg-card-alt);
  border: 1px solid var(--border-subtle);
}

.log-stream-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  padding: 13px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

---

## 8. Table Design

### 8.1 Base Table

```css
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px 14px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
  white-space: nowrap;
}

.data-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  vertical-align: middle;
  color: var(--text-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* Row hover */
.data-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.015);
}
```

### 8.2 Alert Table Row

```css
/* Alert table rows have left-border severity indicator */
.alert-table-row td:first-child {
  border-left: 2px solid transparent;
}

.alert-table-row--critical td:first-child { border-left-color: var(--red-bright);    }
.alert-table-row--high     td:first-child { border-left-color: var(--orange-bright); }
.alert-table-row--medium   td:first-child { border-left-color: var(--yellow-bright); }
.alert-table-row--low      td:first-child { border-left-color: var(--green-bright);  }
```

### 8.3 Rules Table

```css
/* Condition code pill inside table cell */
.rule-condition {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  padding: 2px 8px;
  border: 1px solid var(--border-subtle);
  display: inline-block;
  white-space: nowrap;
}
```

### 8.4 Country Breakdown Table

```css
.country-row {
  display: grid;
  grid-template-columns: 28px 1fr 55px 90px 90px;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.country-risk-bar {
  height: 3px;
  background: var(--border-subtle);
}

.country-risk-fill {
  height: 100%;
  background: var(--red-bright);
}
```

---

## 9. Alert Severity Visuals

### 9.1 Badge System

```css
/* Base badge — all badges share these rules */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  /* Zero border-radius */
  white-space: nowrap;
}

.badge--critical {
  background: var(--red-ghost);
  color: var(--red-bright);
  border: 1px solid var(--red-border);
}

.badge--high {
  background: var(--orange-ghost);
  color: var(--orange-bright);
  border: 1px solid var(--orange-border);
}

.badge--medium {
  background: var(--yellow-ghost);
  color: var(--yellow-bright);
  border: 1px solid var(--yellow-border);
}

.badge--low {
  background: var(--green-ghost);
  color: var(--green-bright);
  border: 1px solid var(--green-border);
}

.badge--info {
  background: var(--blue-ghost);
  color: var(--blue-bright);
  border: 1px solid var(--blue-border);
}
```

### 9.2 Alert Feed Rows

```css
.alert-row {
  border: 1px solid var(--border-subtle);
  padding: 11px 14px;
  margin-bottom: 7px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.alert-row:hover {
  border-color: var(--border-default);
}

/* Left accent border + tinted background per severity */
.alert-row--critical {
  border-left: 2px solid var(--red-bright);
  background: var(--red-ghost);
}

.alert-row--high {
  border-left: 2px solid var(--orange-bright);
  background: var(--orange-ghost);
}

.alert-row--medium {
  border-left: 2px solid var(--yellow-bright);
  background: transparent;
}

.alert-row--low {
  border-left: 2px solid var(--green-bright);
  background: transparent;
}
```

### 9.3 Status Dots

```css
.status-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  margin-right: 6px;
  flex-shrink: 0;
}

.status-dot--open {
  background: var(--red-bright);
  box-shadow: 0 0 5px var(--red-bright);
  animation: dotPulse 2s infinite;
}

.status-dot--investigating {
  background: var(--yellow-bright);
  /* No animation — in progress, not urgent */
}

.status-dot--resolved {
  background: var(--green-bright);
  /* No glow — resolved is calm */
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
```

### 9.4 Log Level Row Treatments

```css
.log-line {
  display: grid;
  grid-template-columns: 68px 52px 1fr;
  gap: 12px;
  padding: 5px 18px;
  align-items: center;
  border-left: 2px solid transparent;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.02);
}

.log-line--ALERT {
  background: rgba(255, 140, 66, 0.05);
  border-left-color: var(--orange-bright);
}

.log-line--CRIT {
  background: rgba(255, 59, 92, 0.06);
  border-left-color: var(--red-bright);
}

.log-line--WARN {
  border-left-color: rgba(255, 209, 102, 0.3);
}

.log-level {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-level--INFO  { color: var(--blue-bright);   }
.log-level--WARN  { color: var(--yellow-bright);  }
.log-level--ALERT { color: var(--orange-bright);  }
.log-level--CRIT  { color: var(--red-bright);     }
```

---

## 10. Chart Styling

### 10.1 Recharts Global Style Rules

```css
/* Override recharts defaults to match dark theme */

/* Remove default white backgrounds */
.recharts-surface,
.recharts-wrapper {
  background: transparent !important;
}

/* Cartesian grid lines */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: var(--border-subtle);
  stroke-dasharray: none;
  opacity: 0.5;
}

/* Axis text */
.recharts-text {
  fill: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
}

/* Tooltip */
.recharts-tooltip-wrapper .custom-tooltip {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-primary);
}
```

### 10.2 Alert Timeline Bar Chart

```css
/* recharts BarChart bars — colour by severity */

/* Bars coloured via Cell component in JSX */
/* color mapping based on threat count */
.timeline-bar--critical { fill: var(--red-bright);    }
.timeline-bar--high     { fill: var(--orange-bright); }
.timeline-bar--medium   { fill: var(--yellow-bright); }
.timeline-bar--normal   { fill: var(--cyan-bright);   }

/* Bars have zero border-radius — use recharts radius={0} prop */
```

### 10.3 Scatter Plot

```css
/* ML anomaly scatter plot dots */

.scatter-dot--normal {
  fill: var(--cyan-bright);
  opacity: 0.45;
  /* 7px radius */
}

.scatter-dot--anomaly {
  fill: var(--red-bright);
  opacity: 0.9;
  filter: drop-shadow(0 0 4px var(--red-bright));
  /* 7px radius */
}
```

### 10.4 Confidence Bars (ML Engine)

```css
.confidence-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.confidence-bar-track {
  flex: 1;
  height: 6px;
  background: var(--border-subtle);
}

.confidence-bar-fill {
  height: 100%;
  /* Gradient per attack type */
}

/* Attack type gradients */
.confidence-bar--brute-force {
  background: linear-gradient(90deg, var(--red-bright), var(--orange-bright));
}
.confidence-bar--port-scan {
  background: linear-gradient(90deg, var(--orange-bright), var(--yellow-bright));
}
.confidence-bar--ddos {
  background: linear-gradient(90deg, var(--yellow-bright), var(--cyan-bright));
}
.confidence-bar--slow-bf {
  background: linear-gradient(90deg, var(--cyan-bright), var(--blue-bright));
}
.confidence-bar--geo-anomaly {
  background: linear-gradient(90deg, var(--purple-bright), #ff6b9d);
}
```

### 10.5 Trend Bar Chart

```css
/* Daily threat volume bars */
.trend-bar {
  background: linear-gradient(to top, var(--red-bright), var(--orange-bright));
  /* height set dynamically via inline style: count/max * 100% */
  flex: 1;
  min-height: 3px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.trend-bar:hover {
  opacity: 0.7;
}
```

---

## 11. Animation Behaviour

### 11.1 Animation Principles

- **Duration:** 150ms for micro-interactions (hover), 250ms for layout changes (sidebar), 300ms for page transitions
- **Easing:** `ease` for UI transitions, `linear` for live pulsing animations
- **No bounce:** No spring physics, no overshoot. Precision instruments don't bounce.
- **No decorative animation:** If it doesn't communicate state, it doesn't animate.

### 11.2 Animation Catalogue

```css
/* ── SIDEBAR COLLAPSE ── */
.sidebar {
  transition: width 0.25s ease;
}

/* ── NAV ITEM HOVER ── */
.nav-item {
  transition: background 0.15s, color 0.15s;
}

/* ── LIVE INDICATOR PULSE ── */
@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,232,135,0.5); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 5px rgba(0,232,135,0); }
}
.live-dot { animation: livePulse 1.5s infinite; }

/* ── GEO DOT PULSE ── */
@keyframes geoPulse {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 0.7; }
  100% { box-shadow: 0 0 0 10px transparent; opacity: 0; }
}
.geo-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  animation: geoPulse 2s infinite;
}

/* ── OPEN STATUS DOT ── */
@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.status-dot--open { animation: dotPulse 2s infinite; }

/* ── SKELETON LOADING SHIMMER ── */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-card) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* ── ALERT ROW RESOLVE ── */
.alert-row--resolving {
  transition: opacity 0.3s, transform 0.3s;
  opacity: 0.4;
  transform: translateX(4px);
}

/* ── MODAL OPEN ── */
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
.modal-content {
  animation: modalIn 0.15s ease;
}

/* ── TOAST SLIDE IN ── */
/* Handled by react-hot-toast library */

/* ── BUTTON PRESS ── */
.btn:active {
  transform: translateY(1px);
}

/* ── INPUT FOCUS ── */
.form-input {
  transition: border-color 0.2s, box-shadow 0.2s;
}
```

### 11.3 Animations to Never Use

- Rotating loaders (use linear progress bars instead)
- Confetti, sparkles, celebratory effects
- Parallax scrolling
- 3D transforms
- Elastic/spring easing
- Infinite decorative loops (except the live dot and geo dots which are functional)

---

## 12. Hover States

### 12.1 Hover State Catalogue

```css
/* ── SIDEBAR NAV ITEM ── */
.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
  /* 0.15s transition */
}

/* ── TABLE ROWS ── */
.data-table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.015);
  /* Extremely subtle — just enough to track cursor */
}

/* ── ALERT ROWS ── */
.alert-row:hover {
  border-color: var(--border-default);
  cursor: pointer;
}

/* ── SECONDARY BUTTON ── */
.btn-secondary:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* ── ACTION BUTTON (table) ── */
.btn-action:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* ── CARD ACTION LINK ── */
.card-action:hover {
  text-decoration: underline;
}

/* ── CHART BARS ── */
.trend-bar:hover,
.timeline-bar:hover {
  opacity: 0.7;
}

/* ── GEO DOTS ── */
.geo-dot:hover {
  cursor: pointer;
  /* Tooltip shows on hover */
}

/* ── SETTINGS NAV ITEM ── */
.settings-nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* ── TOGGLE SWITCH TRACK ── */
.toggle-slider:hover {
  opacity: 0.85;
}

/* ── FILTER PILLS ── */
.filter-pill:hover {
  background: var(--cyan-ghost);
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
  cursor: pointer;
}
```

---

## 13. Loading States

### 13.1 Skeleton Components

```css
/* All skeleton elements use same shimmer animation */

.skeleton-line {
  height: 12px;
  background: var(--bg-elevated);
  /* shimmer animation applied */
}

.skeleton-line--short  { width: 40%; }
.skeleton-line--medium { width: 65%; }
.skeleton-line--long   { width: 90%; }

.skeleton-stat-value {
  height: 34px;
  width: 80px;
  /* shimmer animation */
}

.skeleton-row {
  height: 44px;
  border-bottom: 1px solid var(--border-subtle);
  /* shimmer animation */
}
```

### 13.2 Loading State Per Component

```
Stat Cards:
  Grey shimmer box where the number will be
  Grey shimmer line where the label is
  Accent line still shows (colour based on card type)

Alert Feed:
  3 skeleton rows with grey shimmer
  Each row: badge-shaped box + two lines

Tables:
  5 skeleton rows, full width
  Column proportions match actual table

Charts:
  Grey rectangle matching chart container height
  No axis labels during load

Buttons (action loading):
  SVG spinner icon replaces button text
  Button remains same size
  Disabled state (pointer-events: none)
  Opacity: 0.7
```

### 13.3 Full-Page Loading (App startup token check)

```css
.loading-screen {
  height: 100vh;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
}

/* Logo mark centred */
/* Linear progress bar below */

.loading-bar-track {
  width: 200px;
  height: 2px;
  background: var(--border-subtle);
}

@keyframes loadingBar {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.loading-bar-fill {
  height: 100%;
  width: 40%;
  background: var(--cyan-bright);
  animation: loadingBar 1.2s ease infinite;
}
```

---

## 14. Form Styling

### 14.1 Input Fields

```css
.form-label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  display: block;
}

.form-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  /* Zero border-radius */
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:focus {
  border-color: var(--cyan-bright);
  box-shadow: 0 0 0 1px var(--cyan-glow);
}

.form-input--error {
  border-color: var(--red-bright);
  box-shadow: 0 0 0 1px var(--red-glow);
}
```

### 14.2 Password Input with Toggle

```css
.password-wrap {
  position: relative;
}

.password-wrap .form-input {
  padding-right: 42px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.password-toggle:hover {
  color: var(--text-secondary);
}
```

### 14.3 Password Strength Meter

```css
.strength-meter {
  height: 2px;
  background: var(--border-subtle);
  margin-top: 6px;
  overflow: hidden;
}

.strength-meter-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}

.strength-meter-fill--0 { width: 0%;   background: transparent; }
.strength-meter-fill--1 { width: 25%;  background: var(--red-bright);    }
.strength-meter-fill--2 { width: 50%;  background: var(--orange-bright); }
.strength-meter-fill--3 { width: 75%;  background: var(--yellow-bright); }
.strength-meter-fill--4 { width: 100%; background: var(--green-bright);  }

.strength-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  transition: color 0.3s;
}
```

### 14.4 Select Dropdown

```css
.form-select {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron down icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-select:focus {
  border-color: var(--cyan-bright);
}
```

### 14.5 Checkbox

```css
.form-checkbox {
  accent-color: var(--cyan-bright);
  width: 13px;
  height: 13px;
  cursor: pointer;
}

.form-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-check-label {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
```

### 14.6 Inline Field Errors

```css
.field-error {
  font-size: 11px;
  color: var(--red-bright);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

---

## 15. Button System

### 15.1 Button Variants

```css
/* ── BASE BUTTON ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: opacity 0.2s, transform 0.1s;
  /* Zero border-radius */
}

.btn:active { transform: translateY(1px); }

/* ── PRIMARY — CYAN FILL ── */
.btn-primary {
  background: var(--cyan-bright);
  color: #000000;
  padding: 10px 20px;
  font-size: 12px;
}
.btn-primary:hover { opacity: 0.88; }

/* ── SECONDARY — OUTLINED ── */
.btn-secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  padding: 7px 14px;
  font-size: 11px;
}
.btn-secondary:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* ── DANGER — RED OUTLINE ── */
.btn-danger {
  background: transparent;
  border: 1px solid var(--red-border);
  color: var(--red-bright);
  padding: 7px 14px;
  font-size: 11px;
}
.btn-danger:hover {
  background: var(--red-ghost);
}

/* ── ACTION — MICRO BUTTON (in tables) ── */
.btn-action {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 3px 10px;
  font-size: 10px;
}
.btn-action:hover {
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* ── CARD ACTION LINK ── */
.card-action-link {
  background: none;
  border: none;
  color: var(--cyan-bright);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 0;
}

/* ── LOADING STATE (all variants) ── */
.btn--loading {
  pointer-events: none;
  opacity: 0.7;
}

/* ── FULL WIDTH ── */
.btn-full { width: 100%; justify-content: center; }

/* ── DISABLED ── */
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
```

### 15.2 Toggle Switch

```css
.toggle-wrap {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 18px;
}

.toggle-wrap input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border-default);
  transition: background 0.3s;
  /* Zero border-radius */
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  left: 3px;
  bottom: 3px;
  background: #ffffff;
  transition: transform 0.3s;
  /* This is the only intentionally round element — standard UI */
  border-radius: 50%;
}

.toggle-wrap input:checked + .toggle-slider {
  background: var(--cyan-bright);
}

.toggle-wrap input:checked + .toggle-slider::before {
  transform: translateX(16px);
}
```

### 15.3 Filter Pills

```css
.filter-pill {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  padding: 4px 12px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-pill:hover,
.filter-pill--active {
  background: var(--cyan-ghost);
  border-color: var(--cyan-bright);
  color: var(--cyan-bright);
}

/* Severity-tinted pills */
.filter-pill--critical { color: var(--red-bright);    }
.filter-pill--high     { color: var(--orange-bright); }
.filter-pill--medium   { color: var(--yellow-bright); }
.filter-pill--low      { color: var(--green-bright);  }
```

---

## 16. Modal System

### 16.1 Modal Structure

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  width: 440px;
  max-width: 90vw;
  animation: modalIn 0.15s ease;
  /* Zero border-radius */
}

.modal-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-message {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
}

.modal-footer {
  padding: 0 20px 20px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
```

### 16.2 Danger Zone Modal Variant

```css
/* Danger confirmation modals have red top accent */
.modal-content--danger {
  border-top: 2px solid var(--red-bright);
}

.modal-title--danger {
  color: var(--red-bright);
}

/* Typed confirmation input */
.modal-confirm-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--red-border);
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  outline: none;
  margin-top: 12px;
}

.modal-confirm-input:focus {
  border-color: var(--red-bright);
  box-shadow: 0 0 0 1px var(--red-glow);
}

/* Confirm button disabled until correct text typed */
.btn-danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

### 16.3 Close Button

```css
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: color 0.15s;
}

.modal-close:hover {
  color: var(--text-primary);
}
```

---

## 17. Notification Styling

### 17.1 Toast Notifications (react-hot-toast)

```javascript
// Toast configuration in index.jsx

import { Toaster } from 'react-hot-toast';

<Toaster
  position="bottom-right"
  toastOptions={{
    duration: 3500,
    style: {
      background:  'var(--bg-elevated)',
      border:      '1px solid var(--border-default)',
      borderRadius: 0,          // Sharp — non-negotiable
      color:       'var(--text-primary)',
      fontFamily:  "'Syne', sans-serif",
      fontSize:    '12px',
      fontWeight:  600,
      padding:     '10px 14px',
      maxWidth:    '340px',
    },
    success: {
      iconTheme: {
        primary:    'var(--green-bright)',
        secondary:  'var(--bg-elevated)',
      },
      style: {
        borderLeft: '2px solid var(--green-bright)',
      },
    },
    error: {
      iconTheme: {
        primary:    'var(--red-bright)',
        secondary:  'var(--bg-elevated)',
      },
      style: {
        borderLeft: '2px solid var(--red-bright)',
      },
    },
  }}
/>
```

### 17.2 Connection Warning Banner

```css
/* Persistent top banner for offline or connection issues */

.connection-banner {
  position: fixed;
  top: 50px; /* Below topbar */
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 90;
}

.connection-banner--offline {
  background: rgba(255, 59, 92, 0.12);
  border-bottom: 1px solid var(--red-border);
  color: var(--red-bright);
}

.connection-banner--reconnecting {
  background: rgba(255, 140, 66, 0.10);
  border-bottom: 1px solid var(--orange-border);
  color: var(--orange-bright);
}
```

### 17.3 Error Banner (Inline Page Error)

```css
.error-banner {
  background: var(--red-ghost);
  border: 1px solid var(--red-border);
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--red-bright);
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 18. Icon System

### 18.1 All 22 SVG Icons — Specifications

```
Design rules for every icon:
- viewBox: "0 0 24 24"
- fill: none
- stroke: currentColor
- stroke-width: 1.8
- stroke-linecap: square   ← Makes corners sharp, not rounded
- stroke-linejoin: miter   ← Sharp joins
- Size rendered: 16x16px in nav, 12-14px in cards, 18px in page titles
```

```javascript
// Icon specifications per ID

ic-dashboard:
  Two rows of two rectangles
  Rect 1: x=3 y=3 w=7 h=7
  Rect 2: x=14 y=3 w=7 h=7
  Rect 3: x=3 y=14 w=7 h=7
  Rect 4: x=14 y=14 w=7 h=7

ic-logs:
  Outer rectangle x=3 y=3 w=18 h=18
  Line 1: x1=7 y1=8 x2=17 y2=8
  Line 2: x1=7 y1=12 x2=17 y2=12
  Line 3: x1=7 y1=16 x2=13 y2=16

ic-alerts:
  Triangle: points="12 2 22 20 2 20"
  Line: x1=12 y1=9 x2=12 y2=13
  Dot line: x1=12 y1=17 x2=12.01 y2=17

ic-globe:
  Outer rect: x=3 y=3 w=18 h=18
  H-line: x1=3 y1=9 x2=21 y2=9
  H-line: x1=3 y1=15 x2=21 y2=15
  V-line: x1=12 y1=3 x2=12 y2=21
  Arc: d="M3 12c2-3 4-4 9-4s7 1 9 4"

ic-cpu:
  Outer rect: x=5 y=5 w=14 h=14
  Inner rect: x=9 y=9 w=6 h=6
  8 pin lines extending outward

ic-anomaly:
  EKG polyline: points="22 12 18 12 15 21 9 3 6 12 2 12"

ic-trends:
  Upward arrow polyline: points="23 6 13.5 15.5 8.5 10.5 1 18"
  Arrowhead: points="17 6 23 6 23 12"

ic-rules:
  Line 1: x1=8 y1=6 x2=21 y2=6
  Line 2: x1=8 y1=12 x2=21 y2=12
  Line 3: x1=8 y1=18 x2=21 y2=18
  Dot 1: x1=3 y1=6 x2=3.01 y2=6
  Dot 2: x1=3 y1=12 x2=3.01 y2=12
  Dot 3: x1=3 y1=18 x2=3.01 y2=18

ic-settings:
  Circle: cx=12 cy=12 r=3
  Gear path (standard gear outline)

ic-user:
  Path (shoulders): "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
  Rect (head): x=9 y=3 w=6 h=8

ic-search:
  Circle: cx=11 cy=11 r=8
  Line: x1=21 y1=21 x2=16.65 y2=16.65

ic-lock:
  Rect (body): x=3 y=11 w=18 h=11
  Path (arch): "M7 11V7a5 5 0 0 1 10 0v4"

ic-bell:
  Path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
  Clapper: "M13.73 21a2 2 0 0 1-3.46 0"

ic-mail:
  Rect: x=2 y=4 w=20 h=16
  V-fold: polyline points="2,4 12,13 22,4"

ic-check:
  stroke-width: 2.5
  Polyline: points="20 6 9 17 4 12"

ic-x:
  stroke-width: 2.5
  Line 1: x1=18 y1=6 x2=6 y2=18
  Line 2: x1=6 y1=6 x2=18 y2=18

ic-chevron-left:
  stroke-width: 2
  Polyline: points="15 18 9 12 15 6"

ic-chevron-right:
  stroke-width: 2
  Polyline: points="9 18 15 12 9 6"

ic-eye:
  Path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
  Circle: cx=12 cy=12 r=3

ic-eyeoff:
  Path (top half): "M17.94 17.94A10.07..."
  Path (bottom): "M9.9 4.24A9.12..."
  Diagonal slash: x1=1 y1=1 x2=23 y2=23

ic-analyst:
  Circle: cx=11 cy=11 r=8
  Line (handle): x1=21 y1=21 x2=16.65 y2=16.65
  Plus: lines through center of circle

ic-admin:
  Five-point star polygon
  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
```

### 18.2 Icon React Component

```jsx
// Icon.jsx — all icons as SVG symbols
// Usage: <Icon name="alerts" size={16} color="currentColor" />

// Icon inherits colour from parent via currentColor
// Never hardcode icon colours — use parent element's color property
```

---

## 19. Logo Specification

### 19.1 Geometric Mark

```
Construction:
- Outer square:    36x36px, 1.5px stroke, #00D4FF
- Inner diamond:   Rotated 45°, vertices at frame midpoints, 1.5px stroke #00D4FF
- Crosshair H:     Horizontal centre line, 1.2px stroke #00D4FF
- Crosshair V:     Vertical centre line, 1.2px stroke #00D4FF
- Corner TL:       5x5px solid #00D4FF fill
- Corner TR:       5x5px solid #FF3B5C fill
- Corner BL:       5x5px solid #FF3B5C fill
- Corner BR:       5x5px solid #00D4FF fill

Colour meaning:
  Cyan corners:   Primary — system active and monitoring
  Red corners:    Threat — the system exists because threats exist

Wordmark:
  "SecureWatch"   white, Syne weight 800, uppercase, letter-spacing 1px
  "AI" or end     cyan (#00D4FF), same treatment
```

---

## 20. Responsive Behaviour

### 20.1 Breakpoints

```css
:root {
  --bp-xs:   480px;   /* Small phones */
  --bp-sm:   768px;   /* Tablets portrait */
  --bp-md:   1024px;  /* Tablets landscape, small laptops */
  --bp-lg:   1280px;  /* Standard laptops */
  --bp-xl:   1440px;  /* Large monitors */
  --bp-2xl:  1920px;  /* Analyst workstations */
}
```

### 20.2 Responsive Grid Adaptations

```css
/* Dashboard stat cards */
@media (max-width: 1024px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr 1fr;
  }

  /* Dashboard primary grid collapses */
  .dashboard-primary {
    grid-template-columns: 1fr;
  }

  /* ML metrics grid */
  .ml-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Geo stats */
  .geo-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
```

---

## 21. Mobile Adaptations

### 21.1 Mobile Navigation

```css
/* Below 768px: sidebar becomes drawer overlay */
@media (max-width: 768px) {

  .sidebar {
    position: fixed;
    top: 50px;
    left: 0;
    height: calc(100vh - 50px);
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    width: var(--sidebar-expanded) !important;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  /* Overlay behind sidebar */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    top: 50px;
    background: rgba(6, 11, 17, 0.85);
    z-index: 199;
  }

  /* Hamburger button appears in topbar */
  .topbar-menu-btn {
    display: flex;
  }

  /* Content area takes full width */
  .main-layout {
    grid-template-columns: 1fr;
  }
}
```

### 21.2 Mobile Table Adaptations

```css
/* Tables become card stacks on mobile */
@media (max-width: 768px) {

  .data-table thead {
    display: none;
  }

  .data-table tr {
    display: block;
    border: 1px solid var(--border-subtle);
    margin-bottom: 8px;
    padding: 10px 14px;
  }

  .data-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: none;
    font-size: 12px;
  }

  .data-table td::before {
    content: attr(data-label);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin-right: 12px;
  }
}
```

### 21.3 Mobile Form Adaptations

```css
@media (max-width: 768px) {

  /* Two-column form grids collapse to single */
  .form-row {
    grid-template-columns: 1fr;
  }

  /* Auth card takes full width with small margin */
  .auth-box {
    width: calc(100vw - 32px);
    margin: 16px;
  }

  /* Settings layout collapses */
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
```

---

## 22. Accessibility Rules

### 22.1 Colour Contrast Standards

All text meets **WCAG 2.1 AA minimum** (4.5:1 for normal text, 3:1 for large text):

```
Text primary #e4eaf4 on bg-base #060b11:
  Contrast ratio: 17.2:1  ✓ AAA

Text secondary #7a9bbf on bg-base #060b11:
  Contrast ratio: 5.8:1   ✓ AA

Text muted #3d5a7a on bg-base #060b11:
  Contrast ratio: 2.4:1   ✗ Fails AA
  → Only used for timestamps and placeholders
  → Never used for actionable or critical information

Cyan #00d4ff on bg-base #060b11:
  Contrast ratio: 9.1:1   ✓ AAA

Red badge #ff3b5c on badge background rgba(255,59,92,0.08):
  Contrast ratio: 6.2:1   ✓ AA
```

### 22.2 Keyboard Navigation

```css
/* All interactive elements must show focus ring */
:focus-visible {
  outline: 2px solid var(--cyan-bright);
  outline-offset: 2px;
}

/* Remove browser default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--cyan-bright);
  color: #000;
  padding: 8px 16px;
  font-weight: 800;
  z-index: 9999;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

### 22.3 ARIA Requirements

```jsx
// All icon-only buttons must have aria-label
<button aria-label="Toggle sidebar" className="sidebar-toggle">
  <Icon name="chevron-left" />
</button>

// All status indicators must have aria-label
<span className="status-dot status-dot--open"
      role="img"
      aria-label="Status: Open" />

// Live log stream must announce to screen readers
<div aria-live="polite" aria-atomic="false" className="log-body">
  {/* New log lines appended here */}
</div>

// Alert counts in nav badge
<span className="nav-badge" aria-label="12 active alerts">12</span>

// Modal must trap focus
<div role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title">
  <h2 id="modal-title">Block IP Address</h2>
</div>

// Loading states
<div aria-busy="true" aria-label="Loading alerts">
  {/* skeleton */}
</div>
```

### 22.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all non-essential animations */
  .live-dot,
  .geo-dot::after,
  .status-dot--open,
  .skeleton {
    animation: none;
  }

  /* Keep functional transitions but make instant */
  .sidebar,
  .form-input,
  .btn,
  .nav-item,
  .modal-content {
    transition-duration: 0ms;
  }
}
```

### 22.5 Screen Reader Announcements

```jsx
// Announce real-time data updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {newAlertCount > 0 && `${newAlertCount} new alerts detected`}
</div>

// Announce action confirmations
<div aria-live="assertive" className="sr-only">
  {actionFeedback}  {/* "Alert resolved", "IP blocked", etc. */}
</div>

// Screen-reader-only utility class
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);S
  border: 0;
}
```

---

## Design System Summary

```
Design DNA — SecureWatch AI

Zero rounded corners         Sharp = Precision
Syne + JetBrains Mono       Display + Data
14px primary gaps            Dense but breathable
2px accent lines             Severity at a glance
currentColor SVG icons       22 stroke-based glyphs
CSS custom properties        Single source of truth
Colour = meaning             Never decorative
Motion = state               Never decorative
WCAG AA minimum              Non-negotiable
Functional density           Data before whitespace
```

This brief is the single authoritative reference for all visual decisions in SecureWatch AI. Every component built for this platform must comply with these specifications. Deviations require explicit engineering review and documented justification.