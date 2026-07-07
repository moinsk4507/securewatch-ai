// LiveLogs.jsx — Real-time log stream via SSE with filtering + pause
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

import { logsAPI } from '../../services/logsAPI';
import Icon from '../ui/Icon';
import { Button } from '../ui/Button';

/* ── constants ─────────────────────────────────────────────── */

const LEVELS = ['INFO', 'WARN', 'ALERT', 'CRIT'];

const LEVEL_COLORS = {
  CRIT: 'var(--red)',
  ALERT: 'var(--orange)',
  WARN: 'var(--yellow)',
  INFO: 'var(--cyan)',
};

const ROW_STYLES = {
  CRIT: {
    borderLeft: '3px solid var(--red)',
    background: 'rgba(255, 59, 92, 0.06)',
  },
  ALERT: {
    borderLeft: '3px solid var(--orange)',
    background: 'rgba(255, 140, 66, 0.06)',
  },
  WARN: {
    borderLeft: '3px solid var(--yellow)',
    background: 'transparent',
  },
  INFO: {
    borderLeft: '3px solid transparent',
    background: 'transparent',
  },
};

/* ================================================================
   LIVELOGS COMPONENT
   ================================================================ */
export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [activeLevels, setActiveLevels] = useState(new Set(LEVELS));
  const [search, setSearch] = useState('');

  const scrollRef = useRef(null);
  const pausedRef = useRef(paused);
  const logsCountRef = useRef(0);

  // Keep pausedRef in sync so SSE handler reads current value
  // without causing the EventSource effect to re-run
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* ── fetch initial logs on mount ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await logsAPI.get();
        if (cancelled) return;
        // Backend returns { logs: [...] }
        const initial = Array.isArray(data) ? data : data?.logs || [];
        setLogs(initial.slice(-12));
      } catch {
        // Silent — stream will populate anyway
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── SSE stream ── */
  useEffect(() => {
    const es = new EventSource(logsAPI.streamUrl());

    es.onmessage = (event) => {
      if (pausedRef.current) return;
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-199), log]);
      } catch {
        // Malformed SSE payload — skip
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, []); // No deps — pausedRef handles paused state

  /* ── auto-scroll on new log entry ── */
  useEffect(() => {
    if (logs.length !== logsCountRef.current) {
      logsCountRef.current = logs.length;
      if (!pausedRef.current && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [logs]);

  /* ── level filter toggle ── */
  const toggleLevel = useCallback((level) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  /* ── filtered logs ── */
  const searchLower = search.toLowerCase();
  const filtered = logs.filter((log) => {
    if (!activeLevels.has(log.level)) return false;
    if (searchLower && !(log.message || '').toLowerCase().includes(searchLower)) return false;
    return true;
  });

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-logs" size={20} />
          Live Logs
        </h1>
        <div className="page-actions">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: paused ? 'var(--yellow)' : 'var(--green)',
            marginRight: 8,
          }}>
            <span className={paused ? '' : 'live-dot'} style={paused ? {
              width: 8,
              height: 8,
              background: 'var(--yellow)',
              display: 'inline-block',
            } : {}} />
            {paused ? 'PAUSED' : 'STREAMING'}
          </span>
          <Button
            variant={paused ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        {/* Level filter pills */}
        <div className="filter-pills">
          {LEVELS.map((level) => (
            <button
              key={level}
              className={`filter-pill${activeLevels.has(level) ? ' active' : ''}`}
              onClick={() => toggleLevel(level)}
              style={activeLevels.has(level) ? {
                borderColor: LEVEL_COLORS[level],
                color: LEVEL_COLORS[level],
                background: `${LEVEL_COLORS[level]}15`,
              } : {}}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Keyword search */}
        <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
          <input
            className="form-input"
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>

        {/* Entry count */}
        <span style={{
          fontSize: 11,
          color: 'var(--text3)',
          fontFamily: 'var(--font-mono)',
          marginLeft: 'auto',
        }}>
          {filtered.length} / {logs.length} entries
        </span>
      </div>

      {/* ── Log stream panel ── */}
      <div
        className="card"
        ref={scrollRef}
        style={{
          padding: 0,
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            {logs.length === 0
              ? 'Waiting for log stream...'
              : 'No logs match current filters'}
          </div>
        ) : (
          filtered.map((log, idx) => {
            const style = ROW_STYLES[log.level] || ROW_STYLES.INFO;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border)',
                  ...style,
                }}
              >
                {/* Timestamp */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {log.time || ''}
                </span>

                {/* Level badge */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  padding: '2px 7px',
                  border: '1px solid',
                  color: LEVEL_COLORS[log.level] || 'var(--text2)',
                  borderColor: `${LEVEL_COLORS[log.level] || 'var(--text2)'}`,
                  background: `${LEVEL_COLORS[log.level] || 'var(--text2)'}15`,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {log.level}
                </span>

                {/* Message */}
                <span style={{
                  fontSize: 13,
                  color: 'var(--text1)',
                  lineHeight: 1.5,
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-word',
                }}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
