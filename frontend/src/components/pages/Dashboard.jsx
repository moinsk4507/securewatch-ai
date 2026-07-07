// Dashboard.jsx — Main operational dashboard with live-refreshing panels
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import toast from 'react-hot-toast';

import { statsAPI } from '../../services/statsAPI';
import { alertsAPI } from '../../services/alertsAPI';
import { geoAPI } from '../../services/geoAPI';
import { systemAPI } from '../../services/systemAPI';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import WorldMapBackground from '../ui/WorldMapBackground';

/* ── helpers ────────────────────────────────────────────────── */

const SEVERITY_MAP = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

/** Return a CSS variable name for a severity level */
function sevColor(sev) {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return 'var(--red)';
  if (s === 'high') return 'var(--orange)';
  if (s === 'medium') return 'var(--yellow)';
  return 'var(--green)';
}

/** Relative time string: "3m ago", "2h ago", etc. */
function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.max(0, Math.floor(diff / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Safe display: show the value or "—" if undefined/null */
function safe(v) {
  if (v === undefined || v === null || v === '') return '\u2014';
  return v;
}

/* ── demo timeline data (filler until Trends API) ──────────── */

function generateDemoTimeline() {
  const bars = [];
  for (let i = 0; i < 45; i++) {
    const value = Math.floor(Math.random() * 80) + 5;
    let severity;
    if (value > 65) severity = 'critical';
    else if (value > 45) severity = 'high';
    else if (value > 25) severity = 'medium';
    else severity = 'low';
    bars.push({ index: i, value, severity });
  }
  return bars;
}

/* ── custom recharts tooltip ───────────────────────────────── */

function TimelineTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload || {};
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      padding: '6px 10px',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text1)',
    }}>
      <span style={{ color: sevColor(d.severity), fontWeight: 700 }}>
        {(d.severity || '').toUpperCase()}
      </span>
      <span style={{ color: 'var(--text3)', marginLeft: 8 }}>{d.value} events</span>
    </div>
  );
}

/* ── geo dot decoration (pulsing attack origin visual) ─────── */

/* ── Decorative geo positions for the Dashboard mini-map ───── */
/* These fixed positions approximate world hotspot regions.
   The real GeoMap page uses actual lat/lng from the API. */
const DASH_GEO_MARKERS = [
  { lat: 55.7, lng: 37.6,  severity: 'critical' },   // Moscow
  { lat: 31.2, lng: 121.5, severity: 'high' },        // Shanghai
  { lat: -15.8, lng: -47.9, severity: 'medium' },     // Brasilia
  { lat: 33.9, lng: -118.4, severity: 'critical' },   // Los Angeles
  { lat: -33.9, lng: 18.4, severity: 'low' },         // Cape Town
];

/* ================================================================
   DASHBOARD COMPONENT
   ================================================================ */
export default function Dashboard() {
  const navigate = useNavigate();

  /* ── state ── */
  const [stats, setStats] = useState({
    threats_detected: 0,
    brute_force: 0,
    anomaly_score: 0,
    logs_per_min: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [topIPs, setTopIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoTimeline] = useState(generateDemoTimeline);
  const [simulationEnabled, setSimulationEnabled] = useState(null);

  const mountedRef = useRef(true);

  /* ── data fetchers ── */

  const fetchStats = useCallback(async () => {
    try {
      const data = await statsAPI.get();
      if (mountedRef.current && data) {
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error('Failed to load stats');
      }
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { alerts: list = [] } = await alertsAPI.getAll({ per_page: 6 });
      if (mountedRef.current) {
        setAlerts(list);
      }
    } catch (err) {
      if (mountedRef.current) {
        toast.error('Failed to load alerts');
      }
    }
  }, []);

  const fetchTopIPs = useCallback(async () => {
    try {
      const data = await geoAPI.getTopIPs(4);
      if (!mountedRef.current) return;
      // Backend shape after unwrap: { ips: [...] } or possibly a bare array
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.ips) ? data.ips
        : [];
      setTopIPs(list);
    } catch (err) {
      if (mountedRef.current) {
        toast.error('Failed to load top IPs');
      }
    }
  }, []);

  /* ── fetch simulation status ── */
  const fetchSimStatus = useCallback(async () => {
    try {
      const data = await systemAPI.getSimulationStatus();
      if (mountedRef.current) {
        const enabled = typeof data === 'boolean'
          ? data
          : data?.enabled ?? data?.running ?? false;
        setSimulationEnabled(enabled);
      }
    } catch {
      // silently ignore — non-critical indicator
    }
  }, []);

  /* ── effects ── */

  useEffect(() => {
    mountedRef.current = true;

    // initial load
    const init = async () => {
      await Promise.allSettled([fetchStats(), fetchAlerts(), fetchTopIPs()]);
      if (mountedRef.current) setLoading(false);
    };
    init();
    fetchSimStatus();

    // 2-second polling for stats + alerts
    const fast = setInterval(() => {
      fetchStats();
      fetchAlerts();
    }, 2000);

    // 30-second polling for top IPs
    const slow = setInterval(() => {
      fetchTopIPs();
    }, 30000);

    // 10-second polling for simulation status (lightweight, separate)
    const simPoll = setInterval(fetchSimStatus, 10000);

    return () => {
      mountedRef.current = false;
      clearInterval(fast);
      clearInterval(slow);
      clearInterval(simPoll);
    };
  }, [fetchStats, fetchAlerts, fetchTopIPs, fetchSimStatus]);

  /* ── manual refresh handler ── */
  const handleRefresh = () => {
    fetchStats();
    fetchAlerts();
    fetchTopIPs();
    toast.success('Dashboard refreshed');
  };

  /* ── export placeholder ── */
  const handleExport = () => {
    toast('Export coming soon', { icon: '\u{1F4CB}' });
  };

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-dashboard" size={20} />
          Dashboard
        </h1>
        <div className="page-actions">
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      {/* ── Simulation Status Indicator ── */}
      {simulationEnabled !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          padding: '6px 12px',
          background: simulationEnabled
            ? 'rgba(255, 59, 92, 0.06)'
            : 'rgba(0, 232, 135, 0.06)',
          border: `1px solid ${simulationEnabled
            ? 'rgba(255, 59, 92, 0.2)'
            : 'rgba(0, 232, 135, 0.2)'}`,
        }}>
          <span
            className={simulationEnabled ? 'sim-dot-active' : 'sim-dot-quiet'}
            style={{ width: 6, height: 6 }}
          />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            color: simulationEnabled ? 'var(--red)' : 'var(--green)',
          }}>
            {simulationEnabled ? 'Simulation Active' : 'All Systems Normal'}
          </span>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          label="Threats Detected"
          value={safe(stats.threats_detected)}
          color="red"
          meta="Total detected threats"
        />
        <StatCard
          label="Brute Force"
          value={safe(stats.brute_force)}
          color="orange"
          meta="Active brute force attempts"
        />
        <StatCard
          label="Anomaly Score"
          value={safe(stats.anomaly_score)}
          color="cyan"
          meta="Current ML anomaly score"
        />
        <StatCard
          label="Logs / Min"
          value={safe(stats.logs_per_min)}
          color="green"
          meta="Ingestion throughput"
        />
      </div>

      {/* ── Two-Column Grid: Alert Feed + Right Panel ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* ── Left: Live Alert Feed ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" />
              Live Alert Feed
            </span>
            <Button variant="action" size="sm" onClick={() => navigate('/alerts')}>
              View All
            </Button>
          </div>

          {loading && alerts.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 44, marginBottom: 8 }}
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div style={{
              padding: '40px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}>
              You are not under any attack. No alerts to display.
            </div>
          ) : (
            <div>
              {alerts.map((alert, idx) => {
                const {
                  id = idx,
                  name = 'Unknown Alert',
                  severity = 'low',
                  created_at,
                  source_ip,
                  ml_classification,
                } = alert || {};
                const sevKey = SEVERITY_MAP[(severity || '').toLowerCase()] || 'low';

                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: idx < alerts.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                    }}
                  >
                    <Badge severity={sevKey}>
                      {(severity || 'LOW').toUpperCase()}
                    </Badge>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text1)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        gap: 10,
                        marginTop: 2,
                      }}>
                        {source_ip && <span>{source_ip}</span>}
                        {ml_classification && (
                          <span style={{ color: 'var(--cyan)' }}>
                            {ml_classification}
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{
                      fontSize: 11,
                      color: 'var(--text3)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {relativeTime(created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Column: Geo Decoration + Top IPs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pulsing geo dot decoration card */}
          <div className="card" style={{
            position: 'relative',
            height: 140,
            overflow: 'hidden',
            background: 'var(--bg2)',
            borderColor: 'var(--border)',
          }}>
            <div className="card-title" style={{
              position: 'relative',
              zIndex: 2,
              marginBottom: 0,
              fontSize: 10,
            }}>
              Attack Origins
            </div>

            {/* grid pattern background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),'
                + 'linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0,
            }} />

            {/* World map with decorative attack markers */}
            <WorldMapBackground
              attacks={alerts.length > 0 ? DASH_GEO_MARKERS : []}
              compact
            />
          </div>

          {/* Top Offending IPs */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <span className="card-title">Top Offending IPs</span>
            </div>

            {topIPs.length === 0 ? (
              <div style={{
                padding: '20px 0',
                textAlign: 'center',
                color: 'var(--text3)',
                fontSize: 12,
              }}>
                No data
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th style={{ textAlign: 'right' }}>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {topIPs.map((entry, idx) => {
                    const ip = entry?.ip || entry?.source_ip || '\u2014';
                    const count = entry?.count ?? entry?.hits ?? '\u2014';
                    return (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {ip}
                        </td>
                        <td style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--red)',
                          fontWeight: 700,
                        }}>
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Alert Timeline (demo data) ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Alert Timeline</span>
          <span style={{
            fontSize: 10,
            color: 'var(--text3)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Demo Distribution
          </span>
        </div>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoTimeline} barCategoryGap={1}>
              <Tooltip
                content={<TimelineTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" maxBarSize={12}>
                {demoTimeline.map((entry, idx) => (
                  <Cell key={idx} fill={sevColor(entry.severity)} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}