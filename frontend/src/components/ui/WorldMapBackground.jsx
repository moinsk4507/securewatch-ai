// WorldMapBackground.jsx — Real world map using react-simple-maps with attack dot markers
// Projection is computed from actual container dimensions via ResizeObserver + d3-geo fitSize.
// No hardcoded scale numbers anywhere — the map fills its container mathematically.

import { Component, useEffect, useRef, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { geoEqualEarth } from 'd3-geo';
import { feature } from 'topojson-client';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/** Severity level to CSS variable color */
const SEVERITY_COLORS = {
  critical: 'var(--red)',
  high:     'var(--orange)',
  medium:   'var(--yellow)',
  low:      'var(--green)',
};

/** Error boundary — catches fetch/render failures in Geographies */
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text3)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          Map data unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Build a geoEqualEarth projection that mathematically fits the world geometry
 * into [width, height] using d3-geo's fitSize. Returns a configured d3 projection
 * function which react-simple-maps v3 accepts directly via its `projection` prop.
 *
 * @param {number} width
 * @param {number} height
 * @param {object|null} worldFeature  — GeoJSON FeatureCollection for fitSize reference
 * @returns {function} configured d3 projection
 */
function buildFittedProjection(width, height, worldFeature) {
  const proj = geoEqualEarth();

  if (worldFeature) {
    // fitSize scales and centers the projection so the geometry fills [width, height].
    // This is the only mathematically correct way — no guessing.
    proj.fitSize([width, height], worldFeature);
  } else {
    // Fallback before topology loads: center manually, translate to canvas centre.
    proj.translate([width / 2, height / 2]);
  }

  return proj;
}

/**
 * WorldMapBackground — renders a real world map with optional attack markers.
 * The projection auto-fits the actual rendered container via ResizeObserver.
 *
 * @param {Object[]} attacks  - Array of attack objects with lat, lng, severity, etc.
 * @param {boolean}  compact  - Marker size hint: true → smaller dots.
 * @param {Function} isRecent - Optional fn(attack) → bool to control pulse ring.
 */
export default function WorldMapBackground({
  attacks = [],
  compact = false,
  isRecent,
}) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [worldFeature, setWorldFeature] = useState(null);

  // ── 1. Measure the real container with ResizeObserver ─────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setContainerSize(prev =>
          prev.width === width && prev.height === height ? prev : { width, height }
        );
      }
    };

    // Measure immediately and then on every resize.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── 2. Fetch topology once and convert to GeoJSON for fitSize ────────────
  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then(r => r.json())
      .then(topology => {
        if (!cancelled) {
          // topojson-client converts the packed topology into a GeoJSON FeatureCollection
          // that d3-geo's fitSize can use as its extent reference.
          const fc = feature(topology, topology.objects.countries);
          setWorldFeature(fc);
        }
      })
      .catch(() => {
        // If fetch fails, worldFeature stays null and fallback projection is used.
      });
    return () => { cancelled = true; };
  }, []);

  // ── 3. Build the fitted projection whenever size or topology changes ──────
  const { width, height } = containerSize;
  const projection =
    width > 0 && height > 0
      ? buildFittedProjection(width, height, worldFeature)
      : null;

  const dotRadius = compact ? 3.5 : 5;

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <MapErrorBoundary>
        {projection && (
          <ComposableMap
            // Passing a d3 function directly: react-simple-maps v3 short-circuits
            // its own projection math and uses ours as-is (see makeProjection in src).
            projection={projection}
            width={width}
            height={height}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              filter: 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.35))',
            }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={-1}
                    style={{
                      default: {
                        fill: 'rgba(0, 212, 255, 0.04)',
                        stroke: 'rgba(0, 212, 255, 0.55)',
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                      hover: {
                        fill: 'rgba(0, 212, 255, 0.08)',
                        stroke: 'rgba(0, 212, 255, 0.7)',
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                      pressed: {
                        fill: 'rgba(0, 212, 255, 0.04)',
                        stroke: 'rgba(0, 212, 255, 0.55)',
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Attack origin markers — rendered inside ComposableMap for correct projection */}
            {attacks.map((attack, i) => {
              const lat = attack.lat ?? attack.latitude;
              const lng = attack.lng ?? attack.longitude;
              if (lat == null || lng == null) return null;

              const sev   = (attack.severity || '').toLowerCase();
              const color = SEVERITY_COLORS[sev] || 'var(--cyan)';
              const recent = typeof isRecent === 'function' ? isRecent(attack) : true;

              return (
                <Marker key={i} coordinates={[lng, lat]}>
                  {/* Static dot */}
                  <circle
                    r={dotRadius}
                    fill={color}
                    opacity={recent ? 0.9 : 0.5}
                    style={{
                      filter: sev === 'critical'
                        ? 'drop-shadow(0 0 4px currentColor)'
                        : 'none',
                    }}
                  />
                  {/* Pulsing ring — only for recent attacks */}
                  {recent && (
                    <circle
                      r={dotRadius}
                      fill={color}
                      opacity={0}
                      className="geo-pulse-ring"
                    />
                  )}
                </Marker>
              );
            })}
          </ComposableMap>
        )}
      </MapErrorBoundary>
    </div>
  );
}
