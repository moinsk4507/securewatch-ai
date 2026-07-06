// Alerts.jsx — Alert management table with filters, status updates, and IP blocking
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { alertsAPI } from '../../services/alertsAPI';
import { firewallAPI } from '../../services/firewallAPI';
import { getErrorMessage } from '../../services/api';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/* ── constants ─────────────────────────────────────────────── */

const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low'];
const STATUSES = ['all', 'open', 'investigating', 'resolved'];

/** Relative time string: "3m ago", "2h ago", etc. */
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

/* ================================================================
   ALERTS COMPONENT
   ================================================================ */
export default function Alerts() {
  /* ── state ── */
  const [alerts, setAlerts] = useState([]);
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [resolveAllModal, setResolveAllModal] = useState(false);
  const [blockModal, setBlockModal] = useState(null); // { ip, alertName }

  /* ── fetch alerts ── */
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 50 };
      if (severity !== 'all') params.severity = severity;
      if (status !== 'all') params.status = status;

      const { alerts: list = [] } = await alertsAPI.getAll(params);
      setAlerts(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [severity, status]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  /* ── actions ── */

  const handleInvestigate = async (alert) => {
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => a.id === alert.id ? { ...a, status: 'investigating' } : a)
    );
    try {
      await alertsAPI.updateStatus(alert.id, 'investigating');
      toast.success(`Investigating: ${alert.name}`);
    } catch (err) {
      // Rollback
      setAlerts((prev) =>
        prev.map((a) => a.id === alert.id ? { ...a, status: alert.status } : a)
      );
      toast.error(getErrorMessage(err));
    }
  };

  const handleResolve = async (alert) => {
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => a.id === alert.id ? { ...a, status: 'resolved' } : a)
    );
    try {
      await alertsAPI.updateStatus(alert.id, 'resolved');
      toast.success(`Resolved: ${alert.name}`);
    } catch (err) {
      // Rollback
      setAlerts((prev) =>
        prev.map((a) => a.id === alert.id ? { ...a, status: alert.status } : a)
      );
      toast.error(getErrorMessage(err));
    }
  };

  const handleResolveAll = async () => {
    setResolveAllModal(false);
    try {
      await alertsAPI.resolveAll();
      toast.success('All open alerts resolved');
      fetchAlerts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBlockIP = async () => {
    if (!blockModal) return;
    const { ip, alertName } = blockModal;
    setBlockModal(null);
    try {
      await firewallAPI.block(ip, `Blocked via alert: ${alertName}`);
      toast.success(`IP ${ip} blocked`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ── render helpers ── */

  const sevKey = (s) => (s || 'low').toLowerCase();

  const statusDotClass = (s) => {
    const st = (s || 'open').toLowerCase();
    if (st === 'investigating') return 'status-dot status-dot-investigating';
    if (st === 'resolved') return 'status-dot status-dot-resolved';
    return 'status-dot status-dot-open';
  };

  const statusLabel = (s) => {
    const st = (s || 'open').toLowerCase();
    return st.charAt(0).toUpperCase() + st.slice(1);
  };

  const openCount = alerts.filter((a) => a.status === 'open').length;

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-alerts" size={20} />
          Alerts
          {openCount > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--red)',
              marginLeft: 4,
            }}>
              ({openCount} open)
            </span>
          )}
        </h1>
        <div className="page-actions">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setResolveAllModal(true)}
            disabled={openCount === 0}
          >
            Mark All Resolved
          </Button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        {/* Severity pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--text3)',
            marginRight: 4,
          }}>
            Severity
          </span>
          <div className="filter-pills">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                className={`filter-pill${severity === s ? ' active' : ''}`}
                onClick={() => setSeverity(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'var(--text3)',
            marginRight: 4,
          }}>
            Status
          </span>
          <div className="filter-pills">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`filter-pill${status === s ? ' active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alert Table ── */}
      <div className="card" style={{ padding: 0 }}>
        {loading && alerts.length === 0 ? (
          <div style={{ padding: 20 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 44, marginBottom: 8 }}
              />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            No alerts match current filters
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Name</th>
                  <th>Source IP</th>
                  <th>ML Classification</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const sk = sevKey(alert.severity);
                  const isResolved = alert.status === 'resolved';
                  const isInvestigating = alert.status === 'investigating';

                  return (
                    <tr key={alert.id}>
                      {/* Severity badge */}
                      <td>
                        <Badge severity={sk}>
                          {(alert.severity || 'LOW').toUpperCase()}
                        </Badge>
                      </td>

                      {/* Name */}
                      <td style={{
                        fontWeight: 600,
                        fontSize: 13,
                        maxWidth: 280,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {alert.name}
                      </td>

                      {/* Source IP */}
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text2)',
                      }}>
                        {alert.source_ip || '\u2014'}
                      </td>

                      {/* ML Classification */}
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--cyan)',
                      }}>
                        {alert.ml_classification || '\u2014'}
                      </td>

                      {/* Time */}
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        whiteSpace: 'nowrap',
                      }}>
                        {alert.relative_time || relativeTime(alert.created_at)}
                      </td>

                      {/* Status dot */}
                      <td>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span className={statusDotClass(alert.status)} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text2)',
                            textTransform: 'capitalize',
                          }}>
                            {statusLabel(alert.status)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}>
                          {!isInvestigating && !isResolved && (
                            <Button
                              variant="action"
                              size="sm"
                              onClick={() => handleInvestigate(alert)}
                            >
                              Investigate
                            </Button>
                          )}
                          {!isResolved && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResolve(alert)}
                            >
                              Resolve
                            </Button>
                          )}
                          {alert.source_ip && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setBlockModal({
                                ip: alert.source_ip,
                                alertName: alert.name,
                              })}
                            >
                              Block IP
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Resolve All Modal ── */}
      <Modal
        open={resolveAllModal}
        title="Mark All Resolved"
        message={`This will resolve all ${openCount} open alert${openCount !== 1 ? 's' : ''}. This action cannot be undone.`}
        danger
        confirmLabel="Resolve All"
        onConfirm={handleResolveAll}
        onCancel={() => setResolveAllModal(false)}
      />

      {/* ── Block IP Modal ── */}
      <Modal
        open={!!blockModal}
        title="Block IP Address"
        message={
          blockModal ? (
            <>
              Block{' '}
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--red)',
                fontWeight: 700,
              }}>
                {blockModal.ip}
              </span>
              {' '}at the firewall level? This IP will be denied all future connections.
            </>
          ) : ''
        }
        danger
        confirmLabel="Block IP"
        onConfirm={handleBlockIP}
        onCancel={() => setBlockModal(null)}
      />
    </div>
  );
}
