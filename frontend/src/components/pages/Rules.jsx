// Rules.jsx — Detection rules table with create, edit, toggle, delete
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { rulesAPI } from '../../services/rulesAPI';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import Icon from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

/* ── constants ─────────────────────────────────────────────── */

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ACTIONS = ['alert', 'block', 'log', 'quarantine', 'notify'];

const EMPTY_FORM = {
  name: '',
  condition: '',
  severity: 'medium',
  action: 'alert',
  description: '',
};

/* ================================================================
   RULES COMPONENT
   ================================================================ */
export default function Rules() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  /* ── state ── */
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch ── */
  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { rules: list = [] } = await rulesAPI.getAll();
      setRules(list);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /* ── toggle ── */
  const toggleRule = async (rule) => {
    const prev = rule.enabled;
    // Optimistic flip
    setRules((r) =>
      r.map((item) =>
        item.id === rule.id ? { ...item, enabled: !prev } : item,
      ),
    );
    try {
      await rulesAPI.patch(rule.id, { enabled: !prev });
      toast.success(`${rule.name} ${!prev ? 'enabled' : 'disabled'}`);
    } catch (err) {
      // Revert
      setRules((r) =>
        r.map((item) =>
          item.id === rule.id ? { ...item, enabled: prev } : item,
        ),
      );
      toast.error(getErrorMessage(err));
    }
  };

  /* ── open create modal ── */
  const openCreate = () => {
    setEditingRule(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  /* ── open edit modal ── */
  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || '',
      condition: rule.condition || '',
      severity: rule.severity || 'medium',
      action: rule.action || 'alert',
      description: rule.description || '',
    });
    setModalOpen(true);
  };

  /* ── close modal ── */
  const closeModal = () => {
    setModalOpen(false);
    setEditingRule(null);
    setForm({ ...EMPTY_FORM });
  };

  /* ── save (create or update) ── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.condition.trim()) {
      toast.error('Name and condition are required');
      return;
    }
    setSaving(true);
    try {
      if (editingRule) {
        // Update
        await rulesAPI.update(editingRule.id, form);
        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id ? { ...r, ...form } : r,
          ),
        );
        toast.success(`Rule "${form.name}" updated`);
      } else {
        // Create
        const res = await rulesAPI.create(form);
        const newRule = res.data?.data || res.data || {};
        setRules((prev) => [newRule, ...prev]);
        toast.success(`Rule "${form.name}" created`);
      }
      closeModal();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── delete (admin only) ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await rulesAPI.remove(deleteTarget.id);
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success(`Rule "${deleteTarget.name}" deleted`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── form field helper ── */
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-rules" size={20} />
          Rules
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text3)',
              marginLeft: 4,
            }}
          >
            ({rules.length})
          </span>
        </h1>
        <div className="page-actions">
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Rule
          </Button>
        </div>
      </div>

      {/* ── Rules Table ── */}
      <div className="card" style={{ padding: 0 }}>
        {loading && rules.length === 0 ? (
          <div style={{ padding: 20 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 44, marginBottom: 8 }}
              />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <EmptyState icon="ic-rules" message="No rules configured" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Condition</th>
                  <th>Severity</th>
                  <th>Action</th>
                  <th>Hits Today</th>
                  <th>Enabled</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    style={{
                      opacity: rule.enabled ? 1 : 0.5,
                    }}
                  >
                    {/* ID */}
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rule.id}
                    </td>

                    {/* Name */}
                    <td
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        maxWidth: 220,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {rule.name}
                    </td>

                    {/* Condition (code pill) */}
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: 'var(--bg2)',
                          border: '1px solid var(--border2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--cyan)',
                          maxWidth: 240,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rule.condition}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td>
                      <Badge severity={(rule.severity || 'low').toLowerCase()}>
                        {(rule.severity || 'LOW').toUpperCase()}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'var(--text2)',
                      }}
                    >
                      {rule.action}
                    </td>

                    {/* Hits Today */}
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text2)',
                      }}
                    >
                      {rule.hits_today ?? 0}
                    </td>

                    {/* Toggle */}
                    <td>
                      <Toggle
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule)}
                      />
                    </td>

                    {/* Edit */}
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Button
                          variant="action"
                          size="sm"
                          onClick={() => openEdit(rule)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
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
          onClick={closeModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-modal-title"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border2)',
              padding: '28px 32px',
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                id="rule-modal-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: 'var(--text1)',
                }}
              >
                {editingRule ? 'Edit Rule' : 'New Rule'}
              </div>
              {/* Delete button inside edit modal (admin only) */}
              {editingRule && isAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    closeModal();
                    setDeleteTarget(editingRule);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="form-label" htmlFor="rule-name">
                Name
              </label>
              <input
                id="rule-name"
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Brute force SSH login"
                autoComplete="off"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="form-label" htmlFor="rule-condition">
                Condition
              </label>
              <input
                id="rule-condition"
                className="form-input form-input-mono"
                type="text"
                value={form.condition}
                onChange={(e) => setField('condition', e.target.value)}
                placeholder="event_type == 'failed_login' AND count > 5"
                autoComplete="off"
              />
            </div>

            {/* Severity + Action row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" htmlFor="rule-severity">
                  Severity
                </label>
                <select
                  id="rule-severity"
                  className="form-input"
                  value={form.severity}
                  onChange={(e) => setField('severity', e.target.value)}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" htmlFor="rule-action">
                  Action
                </label>
                <select
                  id="rule-action"
                  className="form-input"
                  value={form.action}
                  onChange={(e) => setField('action', e.target.value)}
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description (optional) */}
            <div>
              <label className="form-label" htmlFor="rule-description">
                Description
                <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6, textTransform: 'none' }}>
                  optional
                </span>
              </label>
              <textarea
                id="rule-description"
                className="form-input"
                rows={2}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Additional context for this rule"
                style={{ resize: 'vertical', minHeight: 50 }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                paddingTop: 4,
              }}
            >
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={!form.name.trim() || !form.condition.trim()}
              >
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal (admin only) ── */}
      <Modal
        open={!!deleteTarget}
        title="Delete Rule"
        message={
          deleteTarget ? (
            <>
              Permanently delete rule{' '}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--red)',
                  fontWeight: 700,
                }}
              >
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
        danger
        confirmLabel="Delete Rule"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
