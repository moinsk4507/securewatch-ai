// Topbar.jsx — App top bar
// Logo + wordmark | Live dot | Search (UI only) | Live critical badge | Avatar dropdown

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alertsAPI } from '../../services/alertsAPI';
import { systemAPI } from '../../services/systemAPI';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const POLL_INTERVAL = 10_000; // 10 seconds

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Live critical alert count
  const [criticalCount, setCriticalCount] = useState(null); // null = not yet loaded
  const mountedRef = useRef(true);

  // Simulation status for live dot pulse
  const [simulationEnabled, setSimulationEnabled] = useState(null);

  const fetchCriticalCount = useCallback(async () => {
    try {
      const res = await alertsAPI.getAll({ severity: 'critical', status: 'open' });
      if (mountedRef.current) {
        setCriticalCount(res.total ?? 0);
      }
    } catch {
      // Silently ignore — keep last known count (or null if first fetch)
    }
  }, []);

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
      // silently ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCriticalCount();
    fetchSimStatus();
    const id = setInterval(fetchCriticalCount, POLL_INTERVAL);
    const simId = setInterval(fetchSimStatus, 10000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
      clearInterval(simId);
    };
  }, [fetchCriticalCount, fetchSimStatus]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const initials = getInitials(user?.name || user?.email || 'U');

  // Derived badge state
  const isLoading = criticalCount === null;
  const hasCritical = !isLoading && criticalCount > 0;

  return (
    <header
      style={{
        height: '50px',
        background: 'var(--bg1)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Logo size={28} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text1)',
            whiteSpace: 'nowrap',
          }}
        >
          Secure<span style={{ color: 'var(--cyan)' }}>Watch</span>
        </span>
      </div>

      {/* Live indicator — pulses only when simulation is active */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            background: 'var(--green)',
            flexShrink: 0,
            ...(simulationEnabled
              ? { animation: 'livePulse 1.8s ease-in-out infinite' }
              : {}),
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--green)',
          }}
        >
          {simulationEnabled ? 'LIVE - SIMULATING ATTACK' : 'MONITORING'}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          padding: '0 10px',
          height: '30px',
          width: '220px',
          flexShrink: 0,
        }}
      >
        <Icon name="ic-search" size={13} color="var(--text3)" />
        <input
          type="text"
          placeholder="Search..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text1)',
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            width: '100%',
          }}
          aria-label="Search"
        />
      </div>

      {/* Live critical alerts badge */}
      {isLoading ? (
        /* Skeleton placeholder — same size, no content flash */
        <div
          style={{
            width: '100px',
            height: '30px',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            flexShrink: 0,
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      ) : hasCritical ? (
        /* Red badge — real critical count */
        <button
          id="topbar-critical-badge"
          onClick={() => navigate('/alerts?severity=critical')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,59,92,0.1)',
            border: '1px solid rgba(255,59,92,0.35)',
            color: 'var(--red)',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '0 10px',
            height: '30px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          aria-label={`${criticalCount} critical alert${criticalCount !== 1 ? 's' : ''}`}
        >
          <Icon name="ic-bell" size={13} color="var(--red)" />
          {criticalCount} Critical
        </button>
      ) : (
        /* Green badge — all clear */
        <div
          id="topbar-allclear-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,255,136,0.06)',
            border: '1px solid rgba(0,255,136,0.25)',
            color: 'var(--green)',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '0 10px',
            height: '30px',
            flexShrink: 0,
          }}
          aria-label="No critical alerts"
        >
          <Icon name="ic-bell" size={13} color="var(--green)" />
          All Clear
        </div>
      )}

      {/* Avatar + dropdown */}
      <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          id="topbar-avatar-btn"
          onClick={() => setDropOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={dropOpen}
          style={{
            width: '32px',
            height: '32px',
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            color: 'var(--cyan)',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initials}
        </button>

        {/* Dropdown menu */}
        {dropOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              background: 'var(--card)',
              border: '1px solid var(--border2)',
              minWidth: '160px',
              zIndex: 200,
            }}
          >
            {/* User label */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text3)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || user?.email || 'User'}
            </div>

            {/* My Account */}
            <button
              role="menuitem"
              onClick={() => { setDropOpen(false); navigate('/admin'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text2)',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="ic-user" size={13} />
              My Account
            </button>

            {/* Sign Out */}
            <button
              role="menuitem"
              onClick={() => { setDropOpen(false); handleSignOut(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid var(--border)',
                color: 'var(--red)',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,59,92,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="ic-x" size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
