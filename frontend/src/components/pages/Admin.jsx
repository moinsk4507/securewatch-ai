// Admin.jsx — User profile, stats, activity, permissions
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { userAPI } from '../../services/userAPI';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/* ── helpers ─────────────────────────────────────────────── */

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.max(0, Math.floor(diff / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_ICON = {
  login: 'ic-user',
  logout: 'ic-user',
  create_rule: 'ic-rules',
  rule_created: 'ic-rules',
  update_rule: 'ic-rules',
  delete_rule: 'ic-rules',
  alert_resolved: 'ic-check',
  alert_investigated: 'ic-search',
  resolve_alert: 'ic-check',
  investigate_alert: 'ic-search',
  block_ip: 'ic-lock',
  ip_blocked: 'ic-lock',
  export: 'ic-trends',
  settings: 'ic-settings',
  settings_changed: 'ic-settings',
  ml_retrain: 'ic-cpu',
  retrain: 'ic-cpu',
  signup: 'ic-user',
};

function iconForAction(type) {
  return ACTIVITY_ICON[type] || 'ic-bell';
}

/* ================================================================
   ADMIN COMPONENT
   ================================================================ */
export default function Admin() {
  const navigate = useNavigate();
  const { user: authUser, setUser, logout } = useAuth();

  /* ── state ── */
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* modals */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  const mountedRef = useRef(true);

  /* ── fetch ── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, st, act, perms] = await Promise.allSettled([
        userAPI.getProfile(),
        userAPI.getStats(),
        userAPI.getActivity(),
        userAPI.getPermissions(),
      ]);
      if (!mountedRef.current) return;
      if (prof.status === 'fulfilled') setProfile(prof.value);
      if (st.status === 'fulfilled') setStats(st.value);
      if (act.status === 'fulfilled') setActivities(Array.isArray(act.value) ? act.value : []);
      if (perms.status === 'fulfilled') setPermissions(Array.isArray(perms.value) ? perms.value : []);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [fetchAll]);

  /* ── sign out ── */

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  /* ── edit profile ── */

  const openEditModal = () => {
    setEditName(profile?.name || '');
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      const updated = await userAPI.updateProfile({ name: editName });
      setProfile((prev) => ({ ...prev, name: editName }));
      if (authUser) setUser({ ...authUser, name: editName });
      toast.success('Profile updated');
      setEditModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ── change password ── */

  const handleChangePassword = async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) {
      toast.error('All fields are required');
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwNew.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await userAPI.changePassword(pwCurrent, pwNew);
      toast.success('Password changed');
      setPwModalOpen(false);
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ── profile card data ── */
  const displayName = profile?.name || authUser?.name || 'User';
  const email = profile?.email || authUser?.email || '';
  const role = profile?.role || authUser?.role || 'viewer';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* stats with defensive defaults */
  const alertsReviewed = stats?.alerts_reviewed ?? stats?.alertsResolved ?? stats?.alerts_resolved ?? 0;
  const rulesCreated = stats?.rules_created ?? stats?.rulesCreated ?? 0;
  const uptime = stats?.uptime ?? stats?.uptime_days ?? '—';
  const daysActive = stats?.days_active ?? stats?.daysActive ?? stats?.active_days ?? 0;

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-admin" size={20} />
          Admin
        </h1>
        <div className="page-actions">
          <Button variant="danger" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* ── Profile + Stats Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Profile</span>
          </div>

          {loading && !profile ? (
            <div>
              <div className="skeleton" style={{ height: 80, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32 }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                {/* Avatar circle */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 0,
                    background: 'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--bg0)',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: 'var(--text1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--cyan)',
                      fontWeight: 700,
                      marginTop: 1,
                    }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text3)',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {email}
                  </div>
                </div>
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <Badge severity="low">Active</Badge>
                <Badge severity={role === 'admin' ? 'critical' : 'high'}>{role}</Badge>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={openEditModal}>
                  Edit Profile
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPwModalOpen(true)}>
                  Change Password
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 0 }}>
          <StatCard
            label="Alerts Reviewed"
            value={loading ? '\u2014' : alertsReviewed}
            color="cyan"
            meta="Total reviewed"
          />
          <StatCard
            label="Rules Created"
            value={loading ? '\u2014' : rulesCreated}
            color="green"
            meta="Active rules"
          />
          <StatCard
            label="Uptime"
            value={loading ? '\u2014' : String(uptime)}
            color="purple"
            meta="System uptime"
          />
          <StatCard
            label="Days Active"
            value={loading ? '\u2014' : daysActive}
            color="orange"
            meta="Account age"
          />
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
        </div>

        {loading && activities.length === 0 ? (
          <div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 36, marginBottom: 6 }} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}
          >
            No recent activity
          </div>
        ) : (
          <div>
            {activities.map((act, idx) => {
              const actionText = act.action || act.action_text || act.description || 'Unknown action';
              const timestamp = act.created_at || act.timestamp;
              return (
                <div
                  key={act.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: idx < activities.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                  }}
                >
                  <Icon
                    name={iconForAction(act.action_type || act.type)}
                    size={14}
                    color="var(--text3)"
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: 'var(--text1)',
                    }}
                  >
                    {actionText}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {relativeTime(timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Permissions ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Permissions</span>
        </div>

        {loading && permissions.length === 0 ? (
          <div>
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : permissions.length === 0 ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}
          >
            No permissions data
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
            }}
          >
            {permissions.map((perm, idx) => {
              const permName = perm.name || perm.permission || perm.label || `Permission ${idx + 1}`;
              const allowed = perm.allowed ?? perm.granted ?? perm.enabled ?? false;
              return (
                <div
                  key={perm.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 4px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <Icon
                    name={allowed ? 'ic-check' : 'ic-x'}
                    size={14}
                    color={allowed ? 'var(--green)' : 'var(--red)'}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text2)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {permName.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal
        open={editModalOpen}
        title="Edit Profile"
        message={
          <div>
            <label className="form-label" htmlFor="admin-edit-name">
              Name
            </label>
            <input
              id="admin-edit-name"
              className="form-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>
        }
        confirmLabel="Save Changes"
        onConfirm={handleSaveProfile}
        onCancel={() => setEditModalOpen(false)}
      />

      {/* ── Change Password Modal ── */}
      <Modal
        open={pwModalOpen}
        title="Change Password"
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label" htmlFor="admin-pw-current">
                Current Password
              </label>
              <input
                id="admin-pw-current"
                className="form-input"
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="admin-pw-new">
                New Password
              </label>
              <input
                id="admin-pw-new"
                className="form-input"
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="admin-pw-confirm">
                Confirm New Password
              </label>
              <input
                id="admin-pw-confirm"
                className="form-input"
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                style={{
                  borderColor: pwConfirm && pwNew !== pwConfirm
                    ? 'rgba(255,59,92,0.5)'
                    : undefined,
                }}
              />
            </div>
          </div>
        }
        confirmLabel="Change Password"
        onConfirm={handleChangePassword}
        onCancel={() => {
          setPwModalOpen(false);
          setPwCurrent('');
          setPwNew('');
          setPwConfirm('');
        }}
      />
    </div>
  );
}
