// Toggle.jsx — On/off toggle switch
// Uses .toggle-wrap / .toggle-slider / .toggle-slider.active from index.css
// The toggle thumb uses border-radius: 50% — the single CSS exception allowed

export function Toggle({ checked, onChange, disabled }) {
  return (
    <label
      className="toggle-wrap"
      style={{
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <input
        type="checkbox"
        className="toggle-input"
        checked={!!checked}
        onChange={disabled ? undefined : onChange}
        disabled={!!disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <span className={`toggle-slider${checked ? ' active' : ''}`} />
    </label>
  );
}
