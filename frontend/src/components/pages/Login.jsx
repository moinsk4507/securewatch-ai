// Login.jsx — SecureWatch AI Operator Login
// Uses useAuth().login(email, password, remember)
// remember=true  → localStorage  (30-day token)
// remember=false → sessionStorage (8-hour token)
// NOTE: "Remember me" only switches storage location.
// The backend issues the same token TTL regardless of this flag.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../services/api';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Scan-line overlay — differentiates from generic login pages */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.008) 2px, rgba(0,212,255,0.008) 4px)',
        zIndex: 0,
      }} />

      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo + Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
          <Logo size={36} />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--text1)',
              lineHeight: 1,
            }}>
              SecureWatch
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--cyan)',
              marginTop: '3px',
            }}>
              AI · Threat Intelligence
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <div style={{ width: '2px', height: '18px', background: 'var(--cyan)' }} />
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--text1)',
            }}>
              Operator Login
            </h1>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--text3)',
            letterSpacing: '0.3px',
            paddingLeft: '10px',
          }}>
            Authenticate to access the monitoring console
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(255,59,92,0.08)',
            border: '1px solid rgba(255,59,92,0.3)',
            marginBottom: '20px',
          }}>
            <Icon name="ic-x" size={14} color="var(--red)" />
            <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                color: 'var(--text3)',
              }}>
                <Icon name="ic-mail" size={14} />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="operator@securewatch.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '36px' }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="login-password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                color: 'var(--text3)',
              }}>
                <Icon name="ic-lock" size={14} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text3)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
              >
                <Icon name={showPassword ? 'ic-eyeoff' : 'ic-eye'} size={15} />
              </button>
            </div>
          </div>

          {/* Remember Me */}
          {/* NOTE: This only switches storage (localStorage vs sessionStorage).
              Backend token TTL is fixed — this does NOT extend session server-side. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <input
              id="login-remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{
                width: '14px',
                height: '14px',
                accentColor: 'var(--cyan)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <label
              htmlFor="login-remember"
              style={{
                fontSize: '12px',
                color: 'var(--text2)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Remember me on this device
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email || !password}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '13px' }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(0,0,0,0.3)',
                  borderTopColor: '#000',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Authenticating...
              </>
            ) : (
              <>
                <Icon name="ic-lock" size={14} color="#000" />
                Authenticate
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text3)',
        }}>
          Need access?{' '}
          <Link to="/signup" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
            Request an account
          </Link>
        </div>

        {/* Corner accent — matches logo aesthetic */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '6px',
          height: '6px',
          background: 'var(--cyan)',
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '6px',
          height: '6px',
          background: 'var(--red)',
        }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
