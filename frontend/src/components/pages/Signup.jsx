// Signup.jsx — SecureWatch AI Operator Registration
// Client-side validation mirrors backend RegisterBody exactly:
//   - password >= 12 chars
//   - has uppercase letter
//   - has digit
//   - has special character (!@#$%^&*...)
// These checks run before the API call to prevent confusing 422 errors.

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/authAPI';
import { tokenStorage, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';

// ── Password strength analyser (mirrors backend RegisterBody validation) ──
function analysePassword(pw) {
  const checks = {
    length: pw.length >= 12,
    upper: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let level = 'weak';
  if (passed === 2) level = 'fair';
  if (passed === 3) level = 'good';
  if (passed === 4) level = 'strong';
  return { checks, level, passed };
}

const STRENGTH_META = {
  weak:   { color: 'var(--red)',    label: 'Weak',   width: '25%' },
  fair:   { color: 'var(--orange)', label: 'Fair',   width: '50%' },
  good:   { color: 'var(--yellow)', label: 'Good',   width: '75%' },
  strong: { color: 'var(--green)',  label: 'Strong', width: '100%' },
};

// ── Role card component ──
function RoleCard({ id, name, icon, description, selected, onSelect }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 12px',
        background: selected ? 'rgba(0,212,255,0.06)' : 'var(--bg1)',
        border: selected ? '1px solid var(--cyan)' : '1px solid var(--border2)',
        cursor: 'pointer',
        flex: 1,
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          color: 'var(--cyan)',
        }}>
          <Icon name="ic-check" size={12} />
        </div>
      )}
      <div style={{ color: selected ? 'var(--cyan)' : 'var(--text3)' }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: selected ? 'var(--cyan)' : 'var(--text2)',
      }}>
        {name}
      </div>
      <div style={{
        fontSize: '10px',
        color: 'var(--text3)',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        {description}
      </div>
    </button>
  );
}

export default function Signup() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('analyst');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | taken
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const debounceRef = useRef(null);
  const checkSeqRef = useRef(0);  // sequence counter to discard stale responses

  // ── Debounced email duplicate check ──
  const checkEmail = useCallback((val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Guard: skip check for empty or too-short emails
    if (!val || val.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailStatus('idle');
      return;
    }

    // Immediately clear stale indicator while user is still typing
    setEmailStatus('checking');

    debounceRef.current = setTimeout(async () => {
      const seq = ++checkSeqRef.current;
      try {
        const res = await authAPI.checkEmail(val);
        if (seq !== checkSeqRef.current) return; // stale response — discard
        // Backend returns { exists: true/false }
        setEmailStatus(res.data?.exists ? 'taken' : 'available');
      } catch {
        if (seq !== checkSeqRef.current) return; // stale response — discard
        setEmailStatus('idle');
      }
    }, 500);
  }, []);

  useEffect(() => {
    checkEmail(email);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [email, checkEmail]);

  const strength = password ? analysePassword(password) : null;

  // ── Client-side validation (mirrors backend exactly) ──
  function validate() {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (emailStatus === 'taken') errs.email = 'This email is already registered';
    if (!password) {
      errs.password = 'Password is required';
    } else {
      const { checks } = analysePassword(password);
      if (!checks.length) errs.password = 'Password must be at least 12 characters';
      else if (!checks.upper) errs.password = 'Password must contain an uppercase letter';
      else if (!checks.digit) errs.password = 'Password must contain a digit';
      else if (!checks.special) errs.password = 'Password must contain a special character';
    }
    if (confirmPassword !== password) errs.confirm = 'Passwords do not match';
    if (!agreed) errs.terms = 'You must accept the terms';
    return errs;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await authAPI.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      });
      // Replicate login flow: store token → set user → navigate
      const { token, user } = res.data;
      tokenStorage.set(token, false); // new accounts default to session storage
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const emailIndicator = () => {
    if (emailStatus === 'checking') return { icon: null, color: 'var(--text3)', text: 'Checking...' };
    if (emailStatus === 'available') return { icon: 'ic-check', color: 'var(--green)', text: 'Available' };
    if (emailStatus === 'taken') return { icon: 'ic-x', color: 'var(--red)', text: 'Already registered' };
    return null;
  };

  const indicator = emailIndicator();
  const sm = strength ? STRENGTH_META[strength.level] : null;

  return (
    <div className="auth-page" style={{ padding: '32px 0', alignItems: 'flex-start' }}>
      {/* Scan-line overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.008) 2px, rgba(0,212,255,0.008) 4px)',
        zIndex: 0,
      }} />

      <div
        className="auth-card"
        style={{ maxWidth: '480px', position: 'relative', zIndex: 1, margin: '0 auto' }}
      >
        {/* Logo + Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', justifyContent: 'center' }}>
          <Logo size={32} />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
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
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '2px', height: '16px', background: 'var(--cyan)' }} />
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--text1)',
            }}>
              Create Operator Account
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', paddingLeft: '10px' }}>
            Select your role and complete registration
          </p>
        </div>

        {/* Global Error */}
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
            <span style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role Selector */}
          <div style={{ marginBottom: '20px' }}>
            <div className="form-label" style={{ marginBottom: '8px' }}>Access Role</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <RoleCard
                id="role-analyst"
                name="Analyst"
                icon="ic-analyst"
                description="Monitor threats, manage alerts, create rules"
                selected={role === 'analyst'}
                onSelect={() => setRole('analyst')}
              />
              <RoleCard
                id="role-admin"
                name="Admin"
                icon="ic-admin"
                description="Full access including user management & system config"
                selected={role === 'admin'}
                onSelect={() => setRole('admin')}
              />
            </div>
          </div>

          {/* First + Last Name */}
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label htmlFor="signup-firstname" className="form-label">First Name</label>
              <input
                id="signup-firstname"
                type="text"
                className="form-input"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
              {fieldErrors.firstName && (
                <FieldError msg={fieldErrors.firstName} />
              )}
            </div>
            <div>
              <label htmlFor="signup-lastname" className="form-label">Last Name</label>
              <input
                id="signup-lastname"
                type="text"
                className="form-input"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
              {fieldErrors.lastName && (
                <FieldError msg={fieldErrors.lastName} />
              )}
            </div>
          </div>

          {/* Email with live duplicate check */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-email" className="form-label">Email Address</label>
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
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="jane.doe@securewatch.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: '36px',
                  paddingRight: indicator ? '110px' : '12px',
                  borderColor: emailStatus === 'taken'
                    ? 'rgba(255,59,92,0.5)'
                    : emailStatus === 'available'
                    ? 'rgba(0,232,135,0.5)'
                    : undefined,
                }}
                autoComplete="email"
              />
              {indicator && (
                <span style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: indicator.color,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {indicator.icon && <Icon name={indicator.icon} size={11} color={indicator.color} />}
                  {indicator.text}
                </span>
              )}
            </div>
            {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
          </div>

          {/* Password + Strength meter */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-password" className="form-label">Password</label>
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
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Min 12 chars, UPPER, digit, special"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
                autoComplete="new-password"
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
                }}
              >
                <Icon name={showPassword ? 'ic-eyeoff' : 'ic-eye'} size={15} />
              </button>
            </div>

            {/* Strength meter */}
            {password && strength && sm && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  height: '3px',
                  background: 'var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: sm.width,
                    background: sm.color,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '6px',
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                      { key: 'length', label: '12+ chars' },
                      { key: 'upper', label: 'UPPER' },
                      { key: 'digit', label: 'Digit' },
                      { key: 'special', label: 'Special' },
                    ].map(({ key, label }) => (
                      <span key={key} style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: strength.checks[key] ? 'var(--green)' : 'var(--text3)',
                        textDecoration: strength.checks[key] ? 'none' : 'none',
                        transition: 'color 0.2s',
                      }}>
                        {strength.checks[key] ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: sm.color,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {sm.label}
                  </span>
                </div>
              </div>
            )}
            {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                color: confirmPassword && confirmPassword === password ? 'var(--green)' : 'var(--text3)',
              }}>
                <Icon name={confirmPassword && confirmPassword === password ? 'ic-check' : 'ic-lock'} size={14} />
              </span>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  paddingLeft: '36px',
                  paddingRight: '40px',
                  borderColor: confirmPassword && confirmPassword !== password
                    ? 'rgba(255,59,92,0.5)'
                    : confirmPassword && confirmPassword === password
                    ? 'rgba(0,232,135,0.5)'
                    : undefined,
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide' : 'Show'}
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
                }}
              >
                <Icon name={showConfirm ? 'ic-eyeoff' : 'ic-eye'} size={15} />
              </button>
            </div>
            {fieldErrors.confirm && <FieldError msg={fieldErrors.confirm} />}
          </div>

          {/* Terms */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input
                id="signup-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: 'var(--cyan)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              />
              <label htmlFor="signup-terms" style={{
                fontSize: '12px',
                color: 'var(--text2)',
                cursor: 'pointer',
                lineHeight: 1.5,
              }}>
                I accept the{' '}
                <span style={{ color: 'var(--cyan)' }}>Acceptable Use Policy</span>
                {' '}and acknowledge that all activity within this platform is logged and subject to audit
              </label>
            </div>
            {fieldErrors.terms && <FieldError msg={fieldErrors.terms} />}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
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
                Creating account...
              </>
            ) : (
              <>
                <Icon name="ic-user" size={14} color="#000" />
                Create Account
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>

        {/* Corner accents */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '6px', height: '6px', background: 'var(--cyan)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '6px', background: 'var(--red)' }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Inline field error helper
function FieldError({ msg }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
      fontSize: '11px',
      color: 'var(--red)',
      fontFamily: 'var(--font-mono)',
    }}>
      <Icon name="ic-x" size={10} color="var(--red)" />
      {msg}
    </div>
  );
}
