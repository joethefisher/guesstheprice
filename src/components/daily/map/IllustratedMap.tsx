"use client";

/**
 * IllustratedMap — variant A.
 *
 * Pure SVG, no API calls, paper palette. Two modes:
 *   - "compact" for the preview card thumbnail (no labels, no decoration)
 *   - "full" for the expanded modal (parks, water hint, neighborhood label)
 *
 * The street grid is deterministic per listing — the same listingId always
 * renders the same map. That keeps repeat views stable.
 *
 * Pre-submit: shows a translucent accent circle over the centroid.
 * Revealed:   shows the PriceTag pin at the exact coords.
 */

import type { LatLng } from "@/lib/map";

interface Props {
  listingId: string;
  city: string;
  state: string;
  neighborhood: string | null;
  revealed: boolean;
  /** Required pre-submit; matches the rendered circle position. */
  centroid?: LatLng | null;
  /** Required post-reveal; matches the rendered pin position. */
  exact?: LatLng | null;
  mode: "compact" | "full";
}

// ─── Seeded RNG so each listing renders the same map every time ────────────────

function seedFrom(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return h || 1;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// US coastal states get a water hint along one edge for vibe.
const COASTAL_STATES = new Set([
  "CA", "OR", "WA", "FL", "NY", "NJ", "MA", "RI", "CT", "ME", "NH",
  "MD", "DE", "VA", "NC", "SC", "GA", "AL", "MS", "LA", "TX", "HI",
]);

// ─── Component ────────────────────────────────────────────────────────────────

export function IllustratedMap({
  listingId,
  city,
  state,
  neighborhood,
  revealed,
  mode,
}: Props) {
  const r = rng(seedFrom(listingId));
  const isCompact = mode === "compact";

  // viewBox is 1000×700 — preview thumbnail crops to its container.
  const W = 1000;
  const H = 700;

  // Build a slightly off-orthogonal road grid for character.
  const baseStep = 80 + Math.floor(r() * 40); // 80–120
  const angle = (r() - 0.5) * 0.12; // ±~7° tilt
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Streets every baseStep, plus a few thicker arterials.
  const minorStreets: Array<{ x1: number; y1: number; x2: number; y2: number; weight: number }> = [];
  const arterials: typeof minorStreets = [];

  const span = 1.7;
  for (let i = -W * span; i < W * span; i += baseStep) {
    // Vertical-ish lines
    const isArterial = Math.abs(i / baseStep) % 4 === 0;
    const x1 = i;
    const x2 = i + sin * H * 2;
    const y1 = -H * span;
    const y2 = H * span * 2;
    const target = isArterial ? arterials : minorStreets;
    target.push({ x1, y1, x2, y2, weight: isArterial ? 6 : 3 });
  }
  for (let j = -H * span; j < H * span; j += baseStep) {
    const isArterial = Math.abs(j / baseStep) % 4 === 0;
    const y1 = j;
    const y2 = j + sin * W * 2;
    const x1 = -W * span;
    const x2 = W * span * 2;
    const target = isArterial ? arterials : minorStreets;
    target.push({ x1, y1, x2, y2, weight: isArterial ? 6 : 3 });
  }

  // 2–3 park rectangles, snapped to grid for that "city block" look.
  const parks: Array<{ x: number; y: number; w: number; h: number }> = [];
  const parkCount = 2 + Math.floor(r() * 2);
  for (let i = 0; i < parkCount; i++) {
    const px = Math.floor(r() * (W - 200)) + 50;
    const py = Math.floor(r() * (H - 160)) + 40;
    parks.push({
      x: px,
      y: py,
      w: 90 + Math.floor(r() * 90),
      h: 70 + Math.floor(r() * 60),
    });
  }

  // Coastal hint — translucent water shape along one random edge.
  const showWater = COASTAL_STATES.has(state.toUpperCase()) && !isCompact;
  const waterEdge = Math.floor(r() * 4); // 0 left, 1 right, 2 top, 3 bottom

  // Building dots — tiny chips of color sprinkled inside blocks.
  const dots: Array<{ x: number; y: number; size: number; tone: string }> = [];
  const dotCount = isCompact ? 24 : 56;
  for (let i = 0; i < dotCount; i++) {
    dots.push({
      x: 40 + Math.floor(r() * (W - 80)),
      y: 40 + Math.floor(r() * (H - 80)),
      size: 4 + Math.floor(r() * 6),
      tone: r() > 0.65 ? "#dcd2bd" : "#e6dcc4",
    });
  }

  // Centroid + exact reveal anchor — these are visual; the actual lat/lng
  // are conveyed through props for the Google variant.
  // In illustrated mode we render at a stable position derived from the seed.
  const centerX = 380 + Math.floor(r() * 240);
  const centerY = 260 + Math.floor(r() * 180);

  const labelText = neighborhood
    ? `${neighborhood} · ${city}`
    : `${city}, ${state}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label={`Stylized map of ${labelText}`}
    >
      {/* Paper background */}
      <rect width={W} height={H} fill="#f0e9d8" />

      {/* Block washes — gentle warm rectangles */}
      <g opacity={0.5}>
        {parks.map((_, i) => {
          const px = 80 + (i * 220);
          return (
            <rect
              key={`wash-${i}`}
              x={px}
              y={60 + (i % 2 === 0 ? 30 : 0)}
              width={300}
              height={500}
              fill="#e8e0cd"
              opacity={0.4}
            />
          );
        })}
      </g>

      {/* Water hint (coastal cities, full mode only) */}
      {showWater && (
        <g opacity={0.9}>
          {waterEdge === 0 && <rect x={-20} y={0} width={120} height={H} fill="#cfe1ec" />}
          {waterEdge === 1 && <rect x={W - 110} y={0} width={130} height={H} fill="#cfe1ec" />}
          {waterEdge === 2 && <rect x={0} y={-20} width={W} height={110} fill="#cfe1ec" />}
          {waterEdge === 3 && <rect x={0} y={H - 100} width={W} height={120} fill="#cfe1ec" />}
        </g>
      )}

      {/* Parks */}
      <g opacity={0.85}>
        {parks.map((p, i) => (
          <rect
            key={`park-${i}`}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill="#c8d8b8"
            rx={6}
          />
        ))}
      </g>

      {/* Building dots */}
      <g>
        {dots.map((d, i) => (
          <rect
            key={`dot-${i}`}
            x={d.x}
            y={d.y}
            width={d.size}
            height={d.size}
            fill={d.tone}
            rx={1}
          />
        ))}
      </g>

      {/* Minor streets — white lines */}
      <g stroke="#ffffff" strokeOpacity={0.95} fill="none">
        {minorStreets.map((s, i) => (
          <line key={`mn-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={s.weight} />
        ))}
      </g>

      {/* Arterials — pale yellow */}
      <g stroke="#f5e1a0" fill="none" strokeOpacity={0.9}>
        {arterials.map((s, i) => (
          <line key={`ar-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={s.weight} />
        ))}
      </g>

      {/* Park outlines for crispness */}
      <g fill="none" stroke="#a8bfa0" strokeOpacity={0.55} strokeWidth={1}>
        {parks.map((p, i) => (
          <rect key={`po-${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={6} />
        ))}
      </g>

      {/* Pre-submit: translucent circle. Post-reveal: pin. */}
      {!revealed && (
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r={isCompact ? 80 : 110}
            fill="#FF5C39"
            fillOpacity={0.18}
            stroke="#FF5C39"
            strokeOpacity={0.7}
            strokeWidth={2}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={4}
            fill="#FF5C39"
            opacity={0.9}
          />
        </g>
      )}

      {revealed && (
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Pin shadow */}
          <ellipse cx={0} cy={6} rx={14} ry={4} fill="#1a1a1a" opacity={0.18} />
          {/* Pin body */}
          <path
            d="M0 -36 C 14 -36 22 -28 22 -16 C 22 -4 0 8 0 8 C 0 8 -22 -4 -22 -16 C -22 -28 -14 -36 0 -36 Z"
            fill="#FF5C39"
            stroke="#ffffff"
            strokeWidth={2.5}
          />
          <circle cx={0} cy={-18} r={6} fill="#ffffff" />
        </g>
      )}

      {/* Neighborhood label (full mode only) */}
      {!isCompact && (
        <g>
          <text
            x={centerX}
            y={centerY + (revealed ? 38 : 150)}
            textAnchor="middle"
            fontFamily="var(--mono, monospace)"
            fontSize={13}
            fontWeight={600}
            letterSpacing={1.2}
            fill="#4a4540"
            style={{ textTransform: "uppercase" }}
          >
            {revealed ? "EXACT LOCATION" : "APPROX. AREA"}
          </text>
        </g>
      )}
    </svg>
  );
}
