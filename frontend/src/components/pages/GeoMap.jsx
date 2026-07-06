// GeoMap.jsx — Attack origin map with stats, pulsing dots, and country breakdown
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { geoAPI } from '../../services/geoAPI';
import { getErrorMessage } from '../../services/api';

import Icon from '../ui/Icon';
import { StatCard } from '../ui/StatCard';
import WorldMapBackground from '../ui/WorldMapBackground';

/* ── helpers ─────────────────────────────────────────────── */

/** Returns true when the attack timestamp is within the last 5 minutes */
function isRecent(attack) {
  const ts = attack.timestamp ?? attack.created_at ?? attack.time;
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() < 5 * 60 * 1000;
}

/* ================================================================
   GEOMAP COMPONENT
   ================================================================ */
export default function GeoMap() {
  /* ── state ── */
  const [stats,   setStats]   = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── fetch ── */
  const fetchStats = useCallback(async () => {
    try {
      const data = await geoAPI.getStats();
      setStats(data || {});
    } catch (err) {
      toast.error('Failed to load geo stats');
    }
  }, []);

  const fetchAttacks = useCallback(async () => {
    try {
      const data = await geoAPI.getAttacks();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.attacks)
          ? data.attacks
          : [];
      setAttacks(list);
    } catch (err) {
      toast.error('Failed to load attack data');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([fetchStats(), fetchAttacks()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchAttacks]);

  /* ── derived data ── */
  const hasAttacks = attacks.length > 0;

  // Country breakdown aggregated from attack records
  const countryMap = {};
  attacks.forEach((a) => {
    const country = a.country || a.country_name || 'Unknown';
    const count   = a.count ?? a.hits ?? 1;
    countryMap[country] = (countryMap[country] || 0) + count;
  });
  const countryBreakdown = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const totalAttacks = countryBreakdown.reduce((s, c) => s + c.count, 0);

  // Stat values — show 0 when no attacks, real values otherwise
  const statCountries = hasAttacks
    ? (stats?.countries ?? countryBreakdown.length)
    : 0;
  const statActiveIPs = hasAttacks
    ? (stats?.active_ips ?? stats?.total_ips ?? 0)
    : 0;
  const statTorExits  = hasAttacks
    ? (stats?.tor_exits  ?? stats?.tor  ?? 0)
    : 0;
  const statBotnets   = hasAttacks
    ? (stats?.botnets    ?? stats?.botnet_count ?? 0)
    : 0;

  const noThreatMeta = 'No threats detected';

  /* ── render ── */
  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">
          <Icon name="ic-globe" size={20} />
          Geo Map
        </h1>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          label="Countries"
          value={statCountries}
          color="cyan"
          meta={hasAttacks ? 'Affected countries' : noThreatMeta}
        />
        <StatCard
          label="Active IPs"
          value={statActiveIPs}
          color="purple"
          meta={hasAttacks ? 'Unique source addresses' : noThreatMeta}
        />
        <StatCard
          label="Tor Exits"
          value={statTorExits}
          color="orange"
          meta={hasAttacks ? 'Tor exit nodes' : noThreatMeta}
        />
        <StatCard
          label="Botnets"
          value={statBotnets}
          color="red"
          meta={hasAttacks ? 'Detected botnet clusters' : noThreatMeta}
        />
      </div>

      {/* ── Map Container ── */}
      <div className="card" style={{
        position:    'relative',
        height:       360,
        overflow:    'hidden',
        background:  'var(--bg2)',
        borderColor: 'var(--border)',
        marginBottom: 20,
      }}>
        {/* Grid overlay */}
        <div style={{
          position:        'absolute',
          inset:            0,
          backgroundImage:
            'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),'
            + 'linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          zIndex: 0,
        }} />

        {/* World map with attack markers — react-simple-maps */}
        <WorldMapBackground attacks={attacks} isRecent={isRecent} />

        {/* Empty state overlay — shown when no attacks */}
        {!loading && !hasAttacks && (
          <div style={{
            position:       'absolute',
            inset:           0,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:             8,
            pointerEvents:  'none',
            zIndex: 2,
          }}>
            <Icon name="ic-shield" size={28} style={{ opacity: 0.3 }} />
            <span style={{
              color:      'var(--text3)',
              fontSize:    13,
              fontFamily: 'var(--font-mono)',
              textAlign:  'center',
            }}>
              No attack origins detected.
              <br />
              Your system has no attack history.
            </span>
          </div>
        )}
      </div>

      {/* ── Country Breakdown Table ── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
          <span className="card-title">Country Breakdown</span>
          <span style={{
            fontSize:   10,
            fontFamily: 'var(--font-mono)',
            color:      'var(--text3)',
          }}>
            {attacks.length} attacks
          </span>
        </div>

        {countryBreakdown.length === 0 ? (
          <div style={{
            padding:   '32px 0',
            textAlign: 'center',
            color:     'var(--text3)',
            fontSize:   13,
          }}>
            No countries with attack history
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {countryBreakdown.map(({ country, count }) => (
                <tr key={country}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{country}</td>
                  <td style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   12,
                    color:      'var(--text2)',
                  }}>
                    {count}
                  </td>
                  <td style={{ width: '40%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        flex:       1,
                        height:     6,
                        background: 'var(--bg1)',
                        overflow:   'hidden',
                      }}>
                        <div style={{
                          width:      `${totalAttacks > 0 ? (count / totalAttacks) * 100 : 0}%`,
                          height:     '100%',
                          background: 'var(--red)',
                          opacity:     0.7,
                        }} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize:   10,
                        color:      'var(--text3)',
                        minWidth:   32,
                        textAlign:  'right',
                      }}>
                        {totalAttacks > 0 ? Math.round((count / totalAttacks) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
