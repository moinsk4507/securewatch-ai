// Modal.jsx — Confirmation modal with optional typed-confirm gate
// Props:
//   open             — boolean, controls visibility
//   title            — string
//   message          — string or ReactNode
//   danger           — boolean, styles confirm button as danger
//   onConfirm        — function
//   onCancel         — function
//   confirmLabel     — string (default: 'Confirm')
//   requireTypedConfirm — string; if set, user must type this exactly to confirm

import { useEffect, useState, useRef } from 'react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  message,
  danger,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  requireTypedConfirm,
}) {
  const [typedValue, setTypedValue] = useState('');
  const inputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  // Reset typed value when modal opens
  useEffect(() => {
    if (open) {
      setTypedValue('');
      if (requireTypedConfirm) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [open, requireTypedConfirm]);

  if (!open) return null;

  const confirmDisabled = requireTypedConfirm
    ? typedValue !== requireTypedConfirm
    : false;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(6, 11, 17, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          background: 'var(--card)',
          border: `1px solid ${danger ? 'rgba(255,59,92,0.4)' : 'var(--border2)'}`,
          padding: '28px 32px',
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div
          id="modal-title"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: danger ? 'var(--red)' : 'var(--text1)',
          }}
        >
          {title}
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text2)',
              lineHeight: 1.6,
            }}
          >
            {message}
          </div>
        )}

        {/* Typed confirm input */}
        {requireTypedConfirm && (
          <div>
            <label
              htmlFor="modal-confirm-input"
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--text3)',
                marginBottom: '6px',
              }}
            >
              Type <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                {requireTypedConfirm}
              </span> to confirm
            </label>
            <input
              id="modal-confirm-input"
              ref={inputRef}
              type="text"
              className="form-input form-input-mono"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              style={{
                borderColor: typedValue && typedValue !== requireTypedConfirm
                  ? 'rgba(255,59,92,0.5)'
                  : undefined,
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
