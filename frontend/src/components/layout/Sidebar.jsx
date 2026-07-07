// Sidebar.jsx — Collapsible navigation sidebar
// 52px collapsed / 224px expanded, 0.25s transition
// Active route: cyan border-left + cyan text
// Admin-only: Settings is dimmed + lock icon overlay for non-admin users
// ML status footer: static 73% progress bar (real data wired later)

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',  icon: 'ic-dashboard', path: '/' },
      { label: 'Live Logs',  icon: 'ic-logs',      path: '/live-logs' },
      { label: 'Alerts',     icon: 'ic-alerts',    path: '/alerts' },
      { label: 'Geo Map',    icon: 'ic-globe',     path: '/geo-map' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { label: 'ML Engine',  icon: 'ic-cpu',       path: '/ml-engine' },
      { label: 'Anomalies',  icon: 'ic-anomaly',   path: '/anomalies' },
      { label: 'Trends',     icon: 'ic-trends',    path: '/trends' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Sys Health', icon: 'ic-cpu',       path: '/system-health' },
    ],
  },
  {
    label: 'Config',
    items: [
      { label: 'Rules',      icon: 'ic-rules',     path: '/rules' },
      { label: 'Settings',   icon: 'ic-settings',  path: '/settings', adminOnly: true },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'My Account', icon: 'ic-user',      path: '/admin' },
    ],
  },
];

const COLLAPSED_W = 52;
const EXPANDED_W  = 224;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const sidebarWidth = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <aside
      className="sidebar-transition"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        background: 'var(--bg1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        height: '100%',
      }}
    >
      {/* Collapse toggle */}
      <button
        id="sidebar-collapse-btn"
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '40px',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text3)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Icon
          name={collapsed ? 'ic-chevron-right' : 'ic-chevron-left'}
          size={14}
          color="var(--text3)"
        />
      </button>

      {/* Nav sections */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '4px',
        }}
        aria-label="Main navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label (hidden when collapsed) */}
            {!collapsed && (
              <div
                style={{
                  padding: '12px 16px 4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'var(--text3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {section.label}
              </div>
            )}

            {section.items.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              const restricted = item.adminOnly && !isAdmin;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive: na }) =>
                    ['nav-item', (item.path === '/' ? location.pathname === '/' : na) ? 'active' : ''].join(' ').trim()
                  }
                  title={collapsed ? item.label : undefined}
                  style={{
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    paddingLeft: collapsed ? 0 : undefined,
                    opacity: restricted ? 0.45 : 1,
                    position: 'relative',
                  }}
                  onClick={restricted ? (e) => e.preventDefault() : undefined}
                >
                  {/* Icon */}
                  <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                    <Icon name={item.icon} size={15} />
                    {/* Lock overlay for admin-only items */}
                    {item.adminOnly && !isAdmin && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: -3,
                          right: -3,
                          display: 'flex',
                        }}
                      >
                        <Icon name="ic-lock" size={8} color="var(--text3)" />
                      </span>
                    )}
                  </span>

                  {/* Label (hidden when collapsed) */}
                  {!collapsed && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ML status footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: collapsed ? '10px 0' : '12px 16px',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          /* Collapsed: just the cpu icon */
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '32px',
            }}
          >
            <Icon name="ic-cpu" size={14} color="var(--cyan)" />
          </div>
        ) : (
          /* Expanded: label + bar + value */
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: 'var(--text3)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name="ic-cpu" size={11} color="var(--cyan)" />
                ML Engine
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                }}
              >
                73%
              </span>
            </div>
            <div
              style={{
                height: '2px',
                background: 'var(--border2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '73%',
                  height: '100%',
                  background: 'var(--cyan)',
                  boxShadow: '0 0 6px rgba(0,212,255,0.5)',
                }}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
