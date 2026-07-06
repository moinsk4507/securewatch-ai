// EmptyState.jsx — Centred empty state with icon + muted message
// Used when lists, tables, or data views have no results

import Icon from './Icon';

export function EmptyState({ icon, message }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '48px 24px',
        color: 'var(--text3)',
      }}
    >
      {icon && <Icon name={icon} size={36} color="var(--text3)" />}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {message}
      </span>
    </div>
  );
}
