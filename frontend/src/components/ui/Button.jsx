// Button.jsx — Multi-variant button component
// variant: primary | secondary | danger | action
// size: 'sm' shrinks padding
// loading: shows inline spinner, disables pointer events
// fullWidth: sets width 100%

import Icon from './Icon';

const Spinner = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    style={{
      animation: 'btnSpin 0.7s linear infinite',
      display: 'inline-block',
    }}
    aria-hidden="true"
  >
    <style>{`
      @keyframes btnSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>
    <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
    <path d="M12 3a9 9 0 0 1 9 9" />
  </svg>
);

export function Button({
  variant = 'secondary',
  size,
  icon,
  loading,
  onClick,
  children,
  disabled,
  fullWidth,
  ...rest
}) {
  const classes = ['btn', `btn-${variant}`].join(' ');

  const sizeStyle = size === 'sm'
    ? { padding: '5px 10px', fontSize: '11px' }
    : {};

  const widthStyle = fullWidth ? { width: '100%', justifyContent: 'center' } : {};

  return (
    <button
      className={classes}
      onClick={loading || disabled ? undefined : onClick}
      disabled={!!disabled || !!loading}
      style={{
        ...sizeStyle,
        ...widthStyle,
        pointerEvents: loading ? 'none' : undefined,
      }}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon && <Icon name={icon} size={14} />}
          {children}
        </>
      )}
    </button>
  );
}
