// Anomalies.jsx — ML anomaly detection results with hero card and action table
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { mlAPI } from '../../services/mlAPI';
import { alertsAPI } from '../../services/alertsAPI';
import { firewallAPI } from '../../services/firewallAPI';
import { getErrorMessage } from '../../services/api';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/* ── helpers ─────────────────────────────────────────────── */

function ifScoreColor(score) {
  if (score == null) return 'var(--text3)';
  if (score < -0.8) return 'var(--red)';
  if (score < -0.6) return 'var(--orange)';
  return 'var(--yellow)';
}

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

function safe(v) {
  if (v === undefined || v === null || v === '') return '\u2014';
  return v;
}

/* ================================================================
   ANOMALIES COMPONENT
   ================================================================ */
export default function Anomalies() {
  /* ── state ── */
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [blockModal, setBlockModal] = useState(null);

  /* ── fetch ── */
  const fetchAnomalies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mlAPI.getAnomalies();
      const list = Array.isArray(data) ? data : Array.isArray(data?.anomalies) ? data.anomalies : [];

      // Sort by if_score ascending (worst first)
      const sorted = [...list].sort((a, b) => {
        const sa = a.if_score ?? a.score ?? 0;
        const sb = b.if_score ?? b.score ?? 0;
        return sa - sb;
      });

      setAnomalies(sorted);
    } catch (err) {
      toast.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  /* ── hero card (worst) ── */
  const worst = anomalies.length > 0 ? anomalies[0] : null;

  /* ── rest of anomalies ── */
  const rest = anomalies.length > 1 ? anomalies.slice(1) : [];

  /* ── actions ── */
  const handleInvestigate = async (anomaly) => {
    try {
      await alertsAPI.updateStatus(anomaly.id, 'investigating');
      toast.success(`Investigating: ${anomaly.ip || anomaly.source_ip || 'unknown'}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBlockIP = async () => {
    if (!blockModal) return;
    const { ip, reason } = blockModal;
    setBlockModal(null);
    try {
      await firewallAPI.block(ip, reason);
      toast.success(`IP ${ip} blocked`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-anomaly" size={20} />
          Anomalies
        </h1>
        <div className="page-actions">
          <Button variant="secondary" size="sm" onClick={fetchAnomalies}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Hero Card (Worst Score) ── */}
      {worst ? (
        <div className="card" style={{
          marginBottom: 20,
          borderColor: 'rgba(255, 59, 92, 0.3)',
          background: 'rgba(255, 59, 92, 0.04)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--red)',
                marginBottom: 8,
              }}>
                Worst Anomaly
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--red)',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {(worst.if_score ?? worst.score ?? 0).toFixed(4)}
              </div>
              <div style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--text1)',
                  fontWeight: 600,
                }}>
                  {worst.ip || worst.source_ip || '\u2014'}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text2)',
                }}>
                  {worst.type || worst.attack_type || worst.classification || '\u2014'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text3)',
                }}>
                  {relativeTime(worst.timestamp || worst.time || worst.created_at)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Button
                variant="action"
                size="sm"
                onClick={() => handleInvestigate(worst)}
              >
                Investigate
              </Button>
              {(worst.ip || worst.source_ip) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setBlockModal({
                    ip: worst.ip || worst.source_ip,
                    reason: `Anomaly block: ${worst.type || 'suspicious activity'}`,
                  })}
                >
                  Block IP
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="card" style={{
            marginBottom: 20,
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            No anomalies detected
          </div>
        )
      )}

      {/* ── Remaining Anomalies Table ── */}
      {rest.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
            <span className="card-title">
              All Anomalies ({anomalies.length})
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IF Score</th>
                  <th>IP Address</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((anomaly, idx) => {
                  const score = anomaly.if_score ?? anomaly.score ?? 0;
                  const ip = anomaly.ip || anomaly.source_ip || '\u2014';
                  const type = anomaly.type || anomaly.attack_type || anomaly.classification || '\u2014';
                  return (
                    <tr key={anomaly.id ?? idx}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: ifScoreColor(score),
                        }}>
                          {typeof score === 'number' ? score.toFixed(4) : safe(score)}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text2)',
                      }}>
                        {ip}
                      </td>
                      <td style={{
                        fontSize: 12,
                        color: 'var(--text1)',
                      }}>
                        {type}
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        whiteSpace: 'nowrap',
                      }}>
                        {relativeTime(anomaly.timestamp || anomaly.time || anomaly.created_at)}
                      </td>
                      <td>
                        <div style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}>
                          <Button
                            variant="action"
                            size="sm"
                            onClick={() => handleInvestigate(anomaly)}
                          >
                            Investigate
                          </Button>
                          {ip !== '\u2014' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setBlockModal({
                                ip,
                                reason: `Anomaly block: ${type}`,
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
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="card" style={{ padding: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 44, marginBottom: 8 }}
            />
          ))}
        </div>
      )}

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
