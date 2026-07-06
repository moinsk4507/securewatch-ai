// Icon.jsx — 22 SVG icons for SecureWatch AI
// viewBox="0 0 24 24", fill="none", stroke="currentColor"
// strokeWidth={1.8}, strokeLinecap="square", strokeLinejoin="miter"

const ICONS = {
  'ic-dashboard': (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),

  'ic-logs': (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="14" x2="15" y2="14" />
      <line x1="3" y1="18" x2="12" y2="18" />
    </>
  ),

  'ic-alerts': (
    <>
      <path d="M12 2L2 20h20L12 2z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12" y2="17.5" strokeWidth={2.5} />
    </>
  ),

  'ic-globe': (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </>
  ),

  'ic-cpu': (
    <>
      <rect x="7" y="7" width="10" height="10" />
      <line x1="9" y1="3" x2="9" y2="7" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <line x1="15" y1="3" x2="15" y2="7" />
      <line x1="9" y1="17" x2="9" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="15" y1="17" x2="15" y2="21" />
      <line x1="3" y1="9" x2="7" y2="9" />
      <line x1="3" y1="12" x2="7" y2="12" />
      <line x1="3" y1="15" x2="7" y2="15" />
      <line x1="17" y1="9" x2="21" y2="9" />
      <line x1="17" y1="12" x2="21" y2="12" />
      <line x1="17" y1="15" x2="21" y2="15" />
    </>
  ),

  'ic-anomaly': (
    <>
      <polyline points="2,18 7,10 11,14 15,6 19,10 22,6" />
      <circle cx="19" cy="7" r="2" />
    </>
  ),

  'ic-trends': (
    <>
      <polyline points="3,18 8,12 13,15 18,6" />
      <line x1="18" y1="6" x2="21" y2="3" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <line x1="3" y1="3" x2="3" y2="18" />
    </>
  ),

  'ic-rules': (
    <>
      <rect x="3" y="3" width="18" height="3" />
      <line x1="7" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="21" y2="15" />
      <line x1="7" y1="20" x2="15" y2="20" />
      <line x1="3" y1="10" x2="4" y2="10" />
      <line x1="3" y1="15" x2="4" y2="15" />
      <line x1="3" y1="20" x2="4" y2="20" />
    </>
  ),

  'ic-settings': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),

  'ic-user': (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),

  'ic-eye': (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  'ic-eyeoff': (
    <>
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M6.7 6.7A10.5 10.5 0 0 0 1 12s4 7 11 7a10.5 10.5 0 0 0 5.3-1.7" />
      <path d="M10.5 5.1A10.7 10.7 0 0 1 12 5c7 0 11 7 11 7a17.3 17.3 0 0 1-2.6 3.5" />
      <path d="M14.1 14.1A3 3 0 1 1 9.9 9.9" />
    </>
  ),

  'ic-search': (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </>
  ),

  'ic-lock': (
    <>
      <rect x="5" y="11" width="14" height="11" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),

  'ic-bell': (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),

  'ic-mail': (
    <>
      <rect x="2" y="4" width="20" height="16" />
      <polyline points="2,4 12,13 22,4" />
    </>
  ),

  'ic-check': (
    <>
      <polyline points="4,12 9,17 20,6" />
    </>
  ),

  'ic-x': (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),

  'ic-chevron-left': (
    <>
      <polyline points="15,6 9,12 15,18" />
    </>
  ),

  'ic-chevron-right': (
    <>
      <polyline points="9,6 15,12 9,18" />
    </>
  ),

  'ic-analyst': (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <line x1="16" y1="12" x2="22" y2="12" />
      <line x1="19" y1="9" x2="19" y2="15" />
    </>
  ),

  'ic-admin': (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <polyline points="16,12 18,14 22,10" />
    </>
  ),
};

export default function Icon({ name, size = 16, color = 'currentColor', style = {} }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
