// Settings.jsx — Admin settings panel with 6 tabs
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { settingsAPI } from '../../services/settingsAPI';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import Icon from '../ui/Icon';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

/* ── constants ─────────────────────────────────────────────── */

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'ml', label: 'ML Config' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'security', label: 'Security' },
  { key: 'danger', label: 'Danger Zone' },
];

const SANE_DEFAULTS = {
  system_name: 'SecureWatch AI',
  timezone: 'UTC',
  log_retention: '90 days',
  refresh_interval: '2s',
  email_alerts: 'true',
  alert_email: 'admin@securewatch.local',
  slack_enabled: 'false',
  slack_url: '',
  min_severity: 'medium',
  contamination: '0.1',
  n_estimators: '100',
  auto_retrain: 'true',
  alert_threshold: '-0.7',
  es_url: 'http://localhost:9200',
  kibana_url: 'http://localhost:5601',
  logstash_port: '5044',
  two_fa: 'false',
  session_timeout: '8h',
};

/* ── helpers ─────────────────────────────────────────────── */

/** Parse string booleans from the backend settings store */
function toBool(val) {
  if (typeof val === 'boolean') return val;
  return String(val).toLowerCase() === 'true';
}

/* ── Shared inline styles for settings ── */
const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  maxWidth: 540,
};

const fieldRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

/* ================================================================
   SETTINGS COMPONENT
   ================================================================ */
export default function Settings() {
  const { user } = useAuth();

  // Defense-in-depth: double-check admin role
  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">
            <Icon name="ic-settings" size={20} />
            Settings
          </h1>
        </div>
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--red)',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Admin access required
        </div>
      </div>
    );
  }

  return <SettingsInner />;
}

/* ── Inner component (only rendered for admins) ── */
function SettingsInner() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({ ...SANE_DEFAULTS });
  const [loading, setLoading] = useState(true);

  /* ── fetch ── */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.get();
      // Merge with defaults for any missing key
      setSettings({ ...SANE_DEFAULTS, ...(data || {}) });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ── field setter ── */
  const set = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  /* ── render ── */
  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-settings" size={20} />
          Settings
        </h1>
      </div>

      {/* Two-column layout: nav + content */}
      <div style={{ display: 'flex', gap: 24, minHeight: 500 }}>
        {/* Left nav */}
        <nav
          style={{
            width: 190,
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            paddingRight: 0,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 16px',
                background:
                  activeTab === tab.key
                    ? 'rgba(0, 212, 255, 0.06)'
                    : 'transparent',
                border: 'none',
                borderLeft:
                  activeTab === tab.key
                    ? '2px solid var(--cyan)'
                    : '2px solid transparent',
                color:
                  activeTab === tab.key ? 'var(--cyan)' : 'var(--text2)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              {tab.key === 'danger' && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    background: 'var(--red)',
                    flexShrink: 0,
                  }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div style={{ flex: 1, paddingLeft: 8 }}>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 40, marginBottom: 12 }}
                />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'general' && (
                <GeneralTab settings={settings} set={set} />
              )}
              {activeTab === 'notifications' && (
                <NotificationsTab settings={settings} set={set} />
              )}
              {activeTab === 'ml' && (
                <MLTab settings={settings} set={set} />
              )}
              {activeTab === 'integrations' && (
                <IntegrationsTab settings={settings} />
              )}
              {activeTab === 'security' && (
                <SecurityTab settings={settings} set={set} />
              )}
              {activeTab === 'danger' && <DangerZoneTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: GENERAL
   ================================================================ */
function GeneralTab({ settings, set }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.saveGeneral({
        system_name: settings.system_name,
        timezone: settings.timezone,
        log_retention: settings.log_retention,
        refresh_interval: settings.refresh_interval,
      });
      toast.success('General settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="General" />

      <div>
        <label className="form-label" htmlFor="set-system-name">
          System Name
        </label>
        <input
          id="set-system-name"
          className="form-input"
          type="text"
          value={settings.system_name}
          onChange={(e) => set('system_name', e.target.value)}
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-timezone">
          Timezone
        </label>
        <input
          id="set-timezone"
          className="form-input"
          type="text"
          value={settings.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          placeholder="UTC"
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-log-retention">
          Log Retention
        </label>
        <input
          id="set-log-retention"
          className="form-input"
          type="text"
          value={settings.log_retention}
          onChange={(e) => set('log_retention', e.target.value)}
          placeholder="90 days"
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-refresh-interval">
          Refresh Interval
        </label>
        <input
          id="set-refresh-interval"
          className="form-input form-input-mono"
          type="text"
          value={settings.refresh_interval}
          onChange={(e) => set('refresh_interval', e.target.value)}
          placeholder="2s"
        />
      </div>

      <div style={{ paddingTop: 4 }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save General
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: NOTIFICATIONS
   ================================================================ */
function NotificationsTab({ settings, set }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.saveNotifications({
        email_alerts: toBool(settings.email_alerts),
        alert_email: settings.alert_email,
        slack_enabled: toBool(settings.slack_enabled),
        slack_url: settings.slack_url,
        min_severity: settings.min_severity,
      });
      toast.success('Notification settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="Notifications" />

      <div style={fieldRow}>
        <div>
          <div className="form-label" style={{ marginBottom: 0 }}>
            Email Alerts
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}
          >
            Send alert notifications via email
          </div>
        </div>
        <Toggle
          checked={toBool(settings.email_alerts)}
          onChange={() =>
            set('email_alerts', !toBool(settings.email_alerts))
          }
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-alert-email">
          Alert Email
        </label>
        <input
          id="set-alert-email"
          className="form-input"
          type="email"
          value={settings.alert_email}
          onChange={(e) => set('alert_email', e.target.value)}
          placeholder="admin@securewatch.local"
        />
      </div>

      <div style={fieldRow}>
        <div>
          <div className="form-label" style={{ marginBottom: 0 }}>
            Slack Integration
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}
          >
            Forward alerts to a Slack channel
          </div>
        </div>
        <Toggle
          checked={toBool(settings.slack_enabled)}
          onChange={() =>
            set('slack_enabled', !toBool(settings.slack_enabled))
          }
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-slack-url">
          Slack Webhook URL
        </label>
        <input
          id="set-slack-url"
          className="form-input form-input-mono"
          type="url"
          value={settings.slack_url}
          onChange={(e) => set('slack_url', e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-min-severity">
          Minimum Severity
        </label>
        <select
          id="set-min-severity"
          className="form-input"
          value={settings.min_severity}
          onChange={(e) => set('min_severity', e.target.value)}
        >
          {['critical', 'high', 'medium', 'low'].map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ paddingTop: 4 }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Notifications
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: ML CONFIG
   ================================================================ */
function MLTab({ settings, set }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.saveML({
        contamination: parseFloat(settings.contamination) || 0.1,
        n_estimators: parseInt(settings.n_estimators, 10) || 100,
        auto_retrain: toBool(settings.auto_retrain),
        alert_threshold: parseFloat(settings.alert_threshold) || -0.7,
      });
      toast.success('ML configuration saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="ML Configuration" />

      <div>
        <label className="form-label" htmlFor="set-contamination">
          Contamination
        </label>
        <input
          id="set-contamination"
          className="form-input form-input-mono"
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={settings.contamination}
          onChange={(e) => set('contamination', e.target.value)}
        />
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          Expected proportion of anomalies (0.0 - 1.0)
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="set-n-estimators">
          N Estimators
        </label>
        <input
          id="set-n-estimators"
          className="form-input form-input-mono"
          type="number"
          min="10"
          step="10"
          value={settings.n_estimators}
          onChange={(e) => set('n_estimators', e.target.value)}
        />
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          Number of trees in the isolation forest
        </div>
      </div>

      <div style={fieldRow}>
        <div>
          <div className="form-label" style={{ marginBottom: 0 }}>
            Auto Retrain
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}
          >
            Automatically retrain model on new data
          </div>
        </div>
        <Toggle
          checked={toBool(settings.auto_retrain)}
          onChange={() =>
            set('auto_retrain', !toBool(settings.auto_retrain))
          }
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-alert-threshold">
          Alert Threshold
        </label>
        <input
          id="set-alert-threshold"
          className="form-input form-input-mono"
          type="number"
          step="0.1"
          value={settings.alert_threshold}
          onChange={(e) => set('alert_threshold', e.target.value)}
        />
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          Decision boundary for anomaly scoring
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save ML Config
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: INTEGRATIONS
   ================================================================ */
function IntegrationsTab({ settings }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setResults(null);
    try {
      const data = await settingsAPI.testConnections();
      setResults(data);
      toast.success('Connection test complete');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="Integrations" />

      <div className="card" style={{ padding: 16 }}>
        <table className="data-table" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th>Service</th>
              <th>Endpoint</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Elasticsearch</td>
              <td
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text2)',
                }}
              >
                {settings.es_url}
              </td>
              <td>
                {results && (
                  <Badge
                    severity={
                      results.elasticsearch?.connected ? 'low' : 'critical'
                    }
                  >
                    {results.elasticsearch?.connected
                      ? 'Connected'
                      : 'Failed'}
                  </Badge>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Kibana</td>
              <td
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text2)',
                }}
              >
                {settings.kibana_url}
              </td>
              <td>
                {results && (
                  <Badge
                    severity={
                      results.kibana?.connected ? 'low' : 'critical'
                    }
                  >
                    {results.kibana?.connected ? 'Connected' : 'Failed'}
                  </Badge>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Logstash</td>
              <td
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text2)',
                }}
              >
                Port {settings.logstash_port}
              </td>
              <td>
                {results && (
                  <Badge
                    severity={
                      results.logstash?.connected ? 'low' : 'critical'
                    }
                  >
                    {results.logstash?.connected ? 'Connected' : 'Failed'}
                  </Badge>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <Button
          variant="action"
          onClick={handleTest}
          loading={testing}
        >
          Test Connections
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: SECURITY
   ================================================================ */
function SecurityTab({ settings, set }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send fields that SecuritySettingsBody actually accepts
      await settingsAPI.saveSecurity({
        two_fa: toBool(settings.two_fa),
        session_timeout: settings.session_timeout,
      });
      toast.success('Security settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="Security" />

      <div style={fieldRow}>
        <div>
          <div className="form-label" style={{ marginBottom: 0 }}>
            Two-Factor Authentication
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}
          >
            Require 2FA for all user accounts
          </div>
        </div>
        <Toggle
          checked={toBool(settings.two_fa)}
          onChange={() => set('two_fa', !toBool(settings.two_fa))}
        />
      </div>

      <div>
        <label className="form-label" htmlFor="set-session-timeout">
          Session Timeout
        </label>
        <input
          id="set-session-timeout"
          className="form-input form-input-mono"
          type="text"
          value={settings.session_timeout}
          onChange={(e) => set('session_timeout', e.target.value)}
          placeholder="8h"
        />
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
          Duration before inactive sessions expire (e.g. 8h, 30m)
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Security
        </Button>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: DANGER ZONE
   ================================================================ */
function DangerZoneTab() {
  const [flushModal, setFlushModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const handleFlush = async () => {
    setFlushModal(false);
    try {
      await settingsAPI.flushLogs('FLUSH');
      toast.success('All logs flushed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReset = async () => {
    setResetModal(false);
    try {
      await settingsAPI.resetML('RESET');
      toast.success('ML model reset');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleteModal(false);
    try {
      await settingsAPI.deleteUsers('DELETE');
      toast.success('Non-admin users deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div style={sectionStyle}>
      <TabHeader title="Danger Zone" danger />

      <div
        style={{
          border: '1px solid rgba(255, 59, 92, 0.3)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Flush Logs */}
        <DangerAction
          title="Flush All Logs"
          description="Permanently delete all system log entries. This cannot be undone."
          buttonLabel="Flush Logs"
          onClick={() => setFlushModal(true)}
        />

        <div style={{ height: 1, background: 'rgba(255, 59, 92, 0.15)' }} />

        {/* Reset ML */}
        <DangerAction
          title="Reset ML Model"
          description="Destroy the trained model and all anomaly data. A fresh model will be trained from scratch."
          buttonLabel="Reset ML"
          onClick={() => setResetModal(true)}
        />

        <div style={{ height: 1, background: 'rgba(255, 59, 92, 0.15)' }} />

        {/* Delete Users */}
        <DangerAction
          title="Delete All Users"
          description="Remove every non-admin user account and their associated data."
          buttonLabel="Delete Users"
          onClick={() => setDeleteModal(true)}
        />
      </div>

      {/* Modals with typed confirm */}
      <Modal
        open={flushModal}
        title="Flush All Logs"
        message="This will permanently delete all log data. Type FLUSH to confirm."
        danger
        confirmLabel="Flush Logs"
        requireTypedConfirm="FLUSH"
        onConfirm={handleFlush}
        onCancel={() => setFlushModal(false)}
      />

      <Modal
        open={resetModal}
        title="Reset ML Model"
        message="This will destroy the trained model and all anomaly history. Type RESET to confirm."
        danger
        confirmLabel="Reset ML"
        requireTypedConfirm="RESET"
        onConfirm={handleReset}
        onCancel={() => setResetModal(false)}
      />

      <Modal
        open={deleteModal}
        title="Delete All Users"
        message="This will permanently remove all non-admin users. Type DELETE to confirm."
        danger
        confirmLabel="Delete Users"
        requireTypedConfirm="DELETE"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}

/* ================================================================
   SHARED SUB-COMPONENTS
   ================================================================ */

function TabHeader({ title, danger }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: danger ? 'var(--red)' : 'var(--text1)',
        paddingBottom: 12,
        borderBottom: `1px solid ${danger ? 'rgba(255, 59, 92, 0.3)' : 'var(--border)'}`,
        marginBottom: 4,
      }}
    >
      {title}
    </div>
  );
}

function DangerAction({ title, description, buttonLabel, onClick }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text1)',
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      <Button variant="danger" size="sm" onClick={onClick}>
        {buttonLabel}
      </Button>
    </div>
  );
}
