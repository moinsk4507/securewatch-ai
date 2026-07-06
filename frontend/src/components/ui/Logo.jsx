// Logo.jsx — SecureWatch AI geometric mark
// Sharp geometric: outer square, inner diamond, crosshair, 4 corner accents

export default function Logo({ size = 28 }) {
  // Scale all geometry relative to size
  const s = size;
  const half = s / 2;
  // Corner square size: 5/36 of full size
  const cs = Math.round((5 / 36) * s);

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 36 36"
      fill="none"
      aria-label="SecureWatch AI logo"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {/* Outer square */}
      <rect x="1" y="1" width="34" height="34" stroke="#00D4FF" strokeWidth="1.5" fill="none" />

      {/* Inner diamond (rotated 45°) */}
      <rect
        x="9"
        y="9"
        width="18"
        height="18"
        stroke="#00D4FF"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(45 18 18)"
      />

      {/* Crosshair — horizontal */}
      <line x1="1" y1="18" x2="35" y2="18" stroke="#00D4FF" strokeWidth="1.2" />
      {/* Crosshair — vertical */}
      <line x1="18" y1="1" x2="18" y2="35" stroke="#00D4FF" strokeWidth="1.2" />

      {/* TL corner — cyan */}
      <rect x="1" y="1" width="5" height="5" fill="#00D4FF" />

      {/* TR corner — red */}
      <rect x="30" y="1" width="5" height="5" fill="#FF3B5C" />

      {/* BL corner — red */}
      <rect x="1" y="30" width="5" height="5" fill="#FF3B5C" />

      {/* BR corner — cyan */}
      <rect x="30" y="30" width="5" height="5" fill="#00D4FF" />
    </svg>
  );
}
