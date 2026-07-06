// Trends.jsx — Attack trends over time with period toggle, bar chart, stats, breakdown
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';

import { trendsAPI } from '../../services/trendsAPI';
import { getErrorMessage } from '../../services/api';

import Icon from '../ui/Icon';
import { StatCard } from '../ui/StatCard';

/* ── helpers ─────────────────────────────────────────────── */

function safe(v) {
  if (v === undefined || v === null || v === '') return '\u2014';
  return v;
}

function TrendsTooltip({ active, payload }) {
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
      <div style={{ color: 'var(--text2)', fontWeight: 600 }}>{d.label || d.name || d.date}</div>
      <div style={{ color: 'var(--cyan)' }}>{d.value ?? d.count ?? 0} events</div>
    </div>
  );
}

/* ================================================================
   TRENDS COMPONENT
   ================================================================ */
export default function Trends() {
  /* ── state ── */
  const [period, setPeriod] = useState('7d');
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trendsData, statsData, breakdownData] = await Promise.allSettled([
        trendsAPI.get(period),
        trendsAPI.getStats(),
        trendsAPI.getBreakdown(),
      ]);

      if (trendsData.status === 'fulfilled') {
        const t = trendsData.value;
        setTrends(Array.isArray(t) ? t : Array.isArray(t?.buckets) ? t.buckets : []);
      }
      if (statsData.status === 'fulfilled') setStats(statsData.value || {});
      if (breakdownData.status === 'fulfilled') {
        const b = breakdownData.value;
        setBreakdown(Array.isArray(b) ? b : Array.isArray(b?.breakdown) ? b.breakdown : []);
      }
    } catch (err) {
      toast.error('Failed to load trends data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── bar color based on value ── */
  const barColor = (val) => {
    if (val > 70) return 'var(--red)';
    if (val > 40) return 'var(--orange)';
    if (val > 20) return 'var(--yellow)';
    return 'var(--cyan)';
  };

  /* ── breakdown max for proportional bars ── */
  const breakdownMax = breakdown.length > 0
    ? Math.max(...breakdown.map((b) => b.count ?? b.value ?? 0))
    : 1;

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-trends" size={20} />
          Trends
        </h1>
        <div className="page-actions">
          <div className="filter-pills">
            <button
              className={`filter-pill${period === '7d' ? ' active' : ''}`}
              onClick={() => setPeriod('7d')}
            >
              7 Days
            </button>
            <button
              className={`filter-pill${period === '30d' ? ' active' : ''}`}
              onClick={() => setPeriod('30d')}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard
          label="Avg Daily"
          value={safe(stats?.avg_daily ?? stats?.average_daily ?? '\u2014')}
          color="cyan"
          meta="Average events per day"
        />
        <StatCard
          label="Peak Hour"
          value={safe(stats?.peak_hour ?? stats?.busiest_hour ?? '\u2014')}
          color="orange"
          meta="Highest traffic hour"
        />
        <StatCard
          label="Top Attack"
          value={safe(stats?.top_attack ?? stats?.most_common ?? '\u2014')}
          color="red"
          meta="Most frequent attack type"
        />
      </div>

      {/* ── Trend Bar Chart ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">
            Event Timeline ({period === '7d' ? '7 Days' : '30 Days'})
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text3)',
          }}>
            {trends.length} buckets
          </span>
        </div>
        {loading && trends.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '90%', height: 160 }} />
          </div>
        ) : trends.length === 0 ? (
          <div style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            No trend data available
          </div>
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} barCategoryGap={period === '7d' ? 4 : 2}>
                <XAxis
                  dataKey={(d) => d.label || d.date || d.name || d.bucket}
                  tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--text3)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<TrendsTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar
                  dataKey={(d) => d.value ?? d.count ?? 0}
                  maxBarSize={period === '7d' ? 32 : 20}
                >
                  {trends.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={barColor(entry.value ?? entry.count ?? 0)}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Attack Type Breakdown ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Attack Type Breakdown</span>
        </div>
        {loading && breakdown.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 36, marginBottom: 10 }} />
            ))}
          </div>
        ) : breakdown.length === 0 ? (
          <div style={{
            padding: '32px 0',
            textAlign: 'center',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            No breakdown data available
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map((item, idx) => {
              const name = item.name || item.type || item.label || item.attack_type || `Type ${idx + 1}`;
              const count = item.count ?? item.value ?? 0;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '6px 0',
                    borderBottom: idx < breakdown.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text1)',
                    minWidth: 140,
                  }}>
                    {name}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 8,
                    background: 'var(--bg1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(count / breakdownMax) * 100}%`,
                      height: '100%',
                      background: 'var(--cyan)',
                      opacity: 0.7,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    minWidth: 40,
                    textAlign: 'right',
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
