// SystemHealth.jsx — System health dashboard with auto-refreshing metrics
import { useState, useEffect, useRef, useCallback } from 'react';

import { systemAPI } from '../../services/systemAPI';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';

/* ── helpers ─────────────────────────────────────────────── */

function toGB(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return null;
  return (bytes / (1024 ** 3)).toFixed(1);
}

function toMB(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return null;
  return (bytes / (1024 ** 2)).toFixed(1);
}

function safe(v, suffix = '') {
  if (v === null || v === undefined || v === 0) return '\u2014';
  return `${v}${suffix}`;
}

function healthColor(score) {
  if (score === null || score === undefined) return 'var(--text3)';
  if (score >= 80) return 'var(--green)';
  if (score >= 50) return 'var(--orange)';
  return 'var(--red)';
}

function healthLabel(score) {
  if (score === null || score === undefined) return 'Unknown';
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Critical';
}

function statusColor(status) {
  if (!status) return 'var(--text3)';
  const s = status.toLowerCase();
  if (s === 'healthy') return 'var(--green)';
  if (s === 'warning') return 'var(--orange)';
  if (s === 'critical') return 'var(--red)';
  return 'var(--text3)';
}

// Map health status string to StatCard color prop name
function healthColorName(score) {
  if (score === null || score === undefined) return 'cyan';
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

function levelToSeverity(level) {
  const l = (level || '').toLowerCase();
  if (l === 'error' || l === 'critical' || l === 'crit') return 'critical';
  if (l === 'warning' || l === 'warn' || l === 'alert') return 'high';
  if (l === 'info') return 'info';
  return 'low';
}

/* ================================================================
   SYSTEM HEALTH COMPONENT
   ================================================================ */
export default function SystemHealth() {
  /* ── state ── */
  const [metrics, setMetrics]           = useState(null);
  const [health, setHealth]             = useState(null);
  const [processes, setProcesses]       = useState([]);
  const [processError, setProcessError] = useState(false);   // BUG 1.2
  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);

  const mountedRef = useRef(true);

  /* ── data fetchers ── */

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await systemAPI.getMetrics();
      if (mountedRef.current && data) setMetrics(data);
    } catch {
      // swallow polling errors silently
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await systemAPI.getHealth();
      if (mountedRef.current && data) setHealth(data);
    } catch {
      // swallow polling errors silently
    }
  }, []);

  /* ── BUG 1.2 FIX ──────────────────────────────────────────────
     Wrap fetch in try/catch. On error:
       - Do NOT clear the existing process list (keep last-good data)
       - Set processError=true so we show a calm "retrying" banner
     On success:
       - Clear processError flag, update list
  ─────────────────────────────────────────────────────────────── */
  const fetchProcesses = useCallback(async () => {
    try {
      const data = await systemAPI.getProcesses(10);
      if (mountedRef.current) {
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.processes) ? data.processes
          : [];
        setProcesses(list);
        setProcessError(false);
      }
    } catch {
      // On failure: keep the last successfully loaded list, just flag the error
      if (mountedRef.current) setProcessError(true);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await systemAPI.getLogs(20);
      if (mountedRef.current && data) {
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.logs) ? data.logs
          : [];
        setLogs(list);
      }
    } catch {
      // swallow polling errors silently
    }
  }, []);

  /* ── mount + polling ── */

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      await Promise.allSettled([
        fetchMetrics(),
        fetchHealth(),
        fetchProcesses(),
        fetchLogs(),
      ]);
      if (mountedRef.current) setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchHealth();
      fetchProcesses();
      fetchLogs();
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchMetrics, fetchHealth, fetchProcesses, fetchLogs]);

  /* ── derived values ── */

  // Backend shape:
  //   cpu:  { percent, count, freq_current, freq_max }
  //   ram:  { total_gb, used_gb, available_gb, percent }
  //   disk: { total_gb, used_gb, free_gb, percent }
  //   net:  { bytes_sent_mb, bytes_recv_mb, packets_sent, packets_recv }
  const cpuPct    = metrics?.cpu?.percent ?? null;
  const ramUsed   = metrics?.ram?.used_gb ?? null;
  const ramTotal  = metrics?.ram?.total_gb ?? null;
  const diskUsed  = metrics?.disk?.used_gb ?? null;
  const diskTotal = metrics?.disk?.total_gb ?? null;
  const netSent   = metrics?.network?.bytes_sent_mb ?? null;
  const netRecv   = metrics?.network?.bytes_recv_mb ?? null;

  // Health: { score, status, cpu_ok, ram_ok, disk_ok }
  const healthScore  = health?.score ?? null;
  const healthStatus = health?.status ?? null;

  // Format RAM / Disk / Network (values already in GB/MB from backend)
  const ramDisplay  = ramUsed !== null || ramTotal !== null
    ? `${ramUsed ?? '\u2014'} / ${ramTotal ?? '\u2014'} GB`
    : '\u2014';
  const diskDisplay = diskUsed !== null || diskTotal !== null
    ? `${diskUsed ?? '\u2014'} / ${diskTotal ?? '\u2014'} GB`
    : '\u2014';
  const netDisplay  = netSent !== null || netRecv !== null
    ? `${netSent ?? '\u2014'} / ${netRecv ?? '\u2014'} MB`
    : '\u2014';

  /* ── BUG 1.3 FIX ──────────────────────────────────────────────
     Filter logs: only render entries with real, non-empty message text.
     Empty/null/whitespace-only messages (e.g. heartbeat INFO pings)
     are dropped here before rendering.
  ─────────────────────────────────────────────────────────────── */
  const visibleLogs = logs.filter((log) => {
    const msg = log?.message ?? log?.msg ?? '';
    return typeof msg === 'string' && msg.trim().length > 0;
  });

  /* ── render ── */

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-cpu" size={20} />
          System Health
        </h1>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text3)',
            letterSpacing: '0.3px',
          }}
        >
          Refreshing every 5s
        </span>
      </div>

      {/* ── BUG 1.1 FIX ───────────────────────────────────────────
          Health Score is now the 5th StatCard in the same row,
          eliminating the separate card and its empty vertical space.
          We use a 5-column inline grid instead of .grid-4.
      ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="CPU"
          value={safe(cpuPct, '%')}
          color="cyan"
          meta="Current processor load"
        />
        <StatCard
          label="RAM"
          value={ramDisplay}
          color="orange"
          meta="Used / Total"
        />
        <StatCard
          label="Disk"
          value={diskDisplay}
          color="yellow"
          meta="Used / Total"
        />
        <StatCard
          label="Network"
          value={netDisplay}
          color="green"
          meta="Sent / Received"
        />
        {/* 5th card: Health Score — color driven by score thresholds */}
        <StatCard
          label="Health Score"
          value={healthScore !== null && healthScore !== 0 ? String(healthScore) : '\u2014'}
          color={healthColorName(healthScore)}
          meta={(healthStatus || healthLabel(healthScore)).toUpperCase()}
        />
      </div>

      {/* ── Top Processes ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Top Processes</span>
          {/* BUG 1.2: Show retrying notice inline in the header when errored */}
          {processError && (
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--orange)',
                letterSpacing: '0.3px',
              }}
            >
              Unable to load process data. Retrying&hellip;
            </span>
          )}
        </div>

        {loading && processes.length === 0 ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 28, marginBottom: 4 }} />
            ))}
          </div>
        ) : processes.length === 0 && !processError ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}
          >
            No process data available
          </div>
        ) : processes.length === 0 && processError ? (
          /* BUG 1.2: No prior data + error → calm fallback, never a raw crash */
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}
          >
            Unable to load process data. Retrying&hellip;
          </div>
        ) : (
          /* Has data (possibly stale while retrying) — always show the table */
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>PID</th>
                <th>Name</th>
                <th style={{ textAlign: 'right', width: 80 }}>CPU%</th>
                <th style={{ textAlign: 'right', width: 80 }}>RAM%</th>
                <th style={{ textAlign: 'center', width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc, idx) => {
                const pid    = proc?.pid ?? '\u2014';
                const name   = proc?.name ?? 'Unknown';
                const cpuPct = proc?.cpu_percent ?? proc?.cpu ?? null;
                const memPct = proc?.memory_percent ?? proc?.memory ?? null;
                const status = proc?.status ?? '\u2014';
                return (
                  <tr key={proc?.pid || idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
                      {pid}
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {safe(cpuPct, '%')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {safe(memPct, '%')}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 11 }}>
                      <Badge severity={status === 'running' ? 'low' : 'high'}>
                        {status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Security Logs ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Security Logs</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
            }}
          >
            Last {visibleLogs.length} entries
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 28, marginBottom: 4 }} />
            ))}
          </div>
        ) : visibleLogs.length === 0 ? (
          /* BUG 1.3: After filtering, zero entries with real content → clean empty state */
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}
          >
            No security events found
          </div>
        ) : (
          <div>
            {visibleLogs.map((log, idx) => {
              const level     = log?.level ?? log?.severity ?? 'info';
              const message   = log?.message ?? log?.msg ?? '';
              const timestamp = log?.timestamp ?? log?.created_at ?? '';
              return (
                <div
                  key={log?.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: idx < visibleLogs.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                    fontSize: 12,
                  }}
                >
                  {/* BUG 1.3: Badge + message text always rendered side by side */}
                  <Badge severity={levelToSeverity(level)}>
                    {level.toUpperCase()}
                  </Badge>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {message}
                  </span>
                  {timestamp && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text3)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {timestamp}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
