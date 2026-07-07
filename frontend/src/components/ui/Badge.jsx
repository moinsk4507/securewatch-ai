// Badge.jsx — Severity badge component
// severity: critical | high | medium | low | info
// Maps to .badge-critical, .badge-high, .badge-medium, .badge-low, .badge-info

export function Badge({ severity, children }) {
  const cls = severity ? `badge badge-${severity}` : 'badge';
  return <span className={cls}>{children}</span>;
}
