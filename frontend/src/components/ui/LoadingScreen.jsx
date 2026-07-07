// LoadingScreen.jsx — Full-viewport loading screen
// Shows Logo centred with animated progress bar underneath

import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <style>{`
        @keyframes loadingFill {
          0%   { width: 0%; }
          60%  { width: 75%; }
          80%  { width: 88%; }
          100% { width: 100%; }
        }
        .loading-bar-fill {
          height: 100%;
          background: var(--cyan);
          animation: loadingFill 2s ease-in-out forwards;
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
        }
      `}</style>

      {/* Logo */}
      <Logo size={56} />

      {/* Wordmark */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--text2)',
          marginTop: '-8px',
        }}
      >
        Secure<span style={{ color: 'var(--cyan)' }}>Watch</span> AI
      </div>

      {/* Progress bar */}
      <div
        className="loading-bar-track"
        style={{
          width: '180px',
          height: '2px',
          background: 'var(--border2)',
          overflow: 'hidden',
          marginTop: '8px',
        }}
      >
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}
