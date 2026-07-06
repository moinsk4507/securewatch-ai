// MLEngine.jsx — ML model metrics, confidence bars, scatter chart, config, retrain
import { useState, useEffect, useCallback } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ZAxis,
} from 'recharts';
import toast from 'react-hot-toast';

import { mlAPI } from '../../services/mlAPI';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import Icon from '../ui/Icon';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';

/* ── helpers ─────────────────────────────────────────────── */

function safe(v) {
  if (v === undefined || v === null || v === '') return '\u2014';
  return v;
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload || {};
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      padding: '6px 10px',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text1)',
    }}>
      <div style={{ color: d.is_anomaly ? 'var(--red)' : 'var(--cyan)', fontWeight: 700 }}>
        {d.is_anomaly ? 'ANOMALY' : 'NORMAL'}
      </div>
      <div style={{ color: 'var(--text3)' }}>
        Score: {typeof d.y === 'number' ? d.y.toFixed(4) : d.y}
      </div>
    </div>
  );
}

/* ================================================================
   MLENGINE COMPONENT
   ================================================================ */
export default function MLEngine() {
  const { user } = useAuth();

  /* ── state ── */
  const [metrics, setMetrics] = useState(null);
  const [classification, setClassification] = useState([]);
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, classData, scoresData, configData] = await Promise.allSettled([
        mlAPI.getMetrics(),
        mlAPI.getClassification(),
        mlAPI.getScores(),
        mlAPI.getConfig(),
      ]);

      if (metricsData.status === 'fulfilled') setMetrics(metricsData.value || {});
      if (classData.status === 'fulfilled') {
        const c = classData.value;
        setClassification(Array.isArray(c) ? c : Array.isArray(c?.classifications) ? c.classifications : []);
      }
      if (scoresData.status === 'fulfilled') {
        const s = scoresData.value;
        setScores(Array.isArray(s) ? s : Array.isArray(s?.scores) ? s.scores : []);
      }
      if (configData.status === 'fulfilled') setConfig(configData.value || {});
    } catch (err) {
      toast.error('Failed to load ML engine data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── retrain ── */
  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await mlAPI.retrain();
      toast.success('Model retraining initiated');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRetraining(false);
    }
  };

  /* ── config entries ── */
  const configEntries = config
    ? Object.entries(config).filter(([k]) => !k.startsWith('_'))
    : [];

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-cpu" size={20} />
          ML Engine
        </h1>
        <div className="page-actions">
          {user?.role === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              loading={retraining}
              onClick={handleRetrain}
            >
              Retrain Model
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          label="Accuracy"
          value={safe(metrics?.accuracy ? `${(metrics.accuracy * 100).toFixed(1)}%` : '\u2014')}
          color="cyan"
          meta="Model accuracy"
        />
        <StatCard
          label="Precision"
          value={safe(metrics?.precision ? `${(metrics.precision * 100).toFixed(1)}%` : '\u2014')}
          color="green"
          meta="Positive prediction rate"
        />
        <StatCard
          label="Recall"
          value={safe(metrics?.recall ? `${(metrics.recall * 100).toFixed(1)}%` : '\u2014')}
          color="purple"
          meta="Detection rate"
        />
        <StatCard
          label="Contamination"
          value={safe(metrics?.contamination
            ? `${(metrics.contamination * 100).toFixed(2)}%`
            : (metrics?.contamination_rate ? `${(metrics.contamination_rate * 100).toFixed(2)}%` : '\u2014')
          )}
          color="red"
          meta="Anomaly ratio"
        />
      </div>

      {/* ── Two column: Classification + Scatter ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* ── Classification Confidence Bars ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Classification Confidence</span>
          </div>
          {classification.length === 0 ? (
            <div style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}>
              No classification data
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {classification.map((item, idx) => {
                const name = item.name || item.label || item.type || `Class ${idx + 1}`;
                const pct = item.percentage ?? item.confidence ?? item.score ?? 0;
                const barPct = Math.min(Math.max(pct, 0), 1);
                return (
                  <div key={idx}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      marginBottom: 4,
                    }}>
                      <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{name}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--cyan)',
                        fontWeight: 700,
                      }}>
                        {(barPct * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      background: 'var(--bg1)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${barPct * 100}%`,
                        height: '100%',
                        background: barPct > 0.7
                          ? 'var(--red)'
                          : barPct > 0.4
                            ? 'var(--orange)'
                            : 'var(--cyan)',
                        opacity: 0.8,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Score Scatter Chart ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Anomaly Scores</span>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text3)',
            }}>
              {scores.filter((s) => s.is_anomaly).length} anomalies
            </span>
          </div>
          {scores.length === 0 ? (
            <div style={{
              padding: '48px 0',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: 13,
            }}>
              No score data available
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <XAxis
                    dataKey="x"
                    type="number"
                    hide
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text3)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <ZAxis range={[16, 16]} />
                  <Tooltip
                    content={<ScatterTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  {/* Normal points */}
                  <Scatter
                    data={scores.filter((s) => !s.is_anomaly)}
                    fill="var(--cyan)"
                    fillOpacity={0.45}
                    shape="circle"
                  />
                  {/* Anomaly points */}
                  <Scatter
                    data={scores.filter((s) => s.is_anomaly)}
                    fill="var(--red)"
                    fillOpacity={1}
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Model Config ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Model Configuration</span>
        </div>
        {configEntries.length === 0 ? (
          <div style={{
            padding: '20px 0',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            No configuration data
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}>
            {configEntries.map(([key, value]) => (
              <div key={key} style={{
                padding: '10px 14px',
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: 'var(--text3)',
                  marginBottom: 4,
                }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--cyan)',
                  fontWeight: 600,
                }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
