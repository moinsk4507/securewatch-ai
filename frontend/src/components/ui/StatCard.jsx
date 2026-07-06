// StatCard.jsx — Metric stat card with colored top accent bar
// color: red | orange | cyan | green | purple
// Uses .stat-card + CSS custom property --accent for the top bar color

const COLOR_MAP = {
  red:    'var(--red)',
  orange: 'var(--orange)',
  cyan:   'var(--cyan)',
  green:  'var(--green)',
  yellow: 'var(--yellow)',
  purple: 'var(--purple)',
};

export function StatCard({ label, value, color = 'cyan', meta }) {
  const accent = COLOR_MAP[color] || COLOR_MAP.cyan;
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: accent }}>{value}</div>
      {meta && <div className="stat-card-sub">{meta}</div>}
    </div>
  );
}
