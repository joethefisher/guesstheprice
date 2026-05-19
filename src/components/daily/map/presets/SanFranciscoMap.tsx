"use client";

/**
 * San Francisco preset — peninsula shape with water on three sides
 * (Pacific west, Bay east, Golden Gate north). A diagonal "Market Street"
 * splits the city's two grids — a hallmark of SF's layout.
 */

import type { PresetProps } from "./types";

export function SanFranciscoMap({ listingId, revealed, mode }: PresetProps) {
  const isCompact = mode === "compact";
  const W = 1000;
  const H = 700;

  let seed = 0;
  for (let i = 0; i < listingId.length; i++) seed = (seed * 31 + listingId.charCodeAt(i)) | 0;
  const centerX = 400 + Math.abs(seed % 280);
  const centerY = 220 + Math.abs((seed >> 5) % 200);

  // The peninsula land mass — leave water around the edges (full mode only)
  const waterBand = isCompact ? 0 : 60;

  // Two grid systems split by a diagonal "Market Street"
  const upperLines: Array<{ x1: number; y1: number; x2: number; y2: number; arterial?: boolean }> = [];
  for (let i = 0; i < 16; i++) {
    const x = waterBand + i * 60;
    upperLines.push({ x1: x, y1: waterBand, x2: x + 80, y2: H - waterBand, arterial: i % 4 === 0 });
  }
  for (let i = 0; i < 12; i++) {
    const y = waterBand + i * 60;
    upperLines.push({ x1: waterBand, y1: y, x2: W - waterBand, y2: y - 40, arterial: i % 4 === 0 });
  }

  // Golden Gate Park stand-in
  const parkX = 180, parkY = 280, parkW = 280, parkH = 110;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label="Stylized San Francisco map">
      {/* Water everywhere first */}
      <rect width={W} height={H} fill="#cfe1ec" />
      {/* Peninsula */}
      <rect x={waterBand} y={waterBand} width={W - waterBand * 2} height={H - waterBand * 2} fill="#f0e9d8" rx={isCompact ? 0 : 16} />

      {/* Block shading */}
      <g opacity={0.35}>
        {[100, 300, 520, 740].map((x) => (
          <rect key={x} x={x} y={waterBand + 30} width={120} height={H - waterBand * 2 - 60} fill="#e8e0cd" />
        ))}
      </g>

      {/* Golden Gate Park */}
      <rect x={parkX} y={parkY} width={parkW} height={parkH} fill="#c8d8b8" rx={4} />
      <rect x={parkX} y={parkY} width={parkW} height={parkH} fill="none" stroke="#a8bfa0" strokeOpacity={0.55} strokeWidth={1} rx={4} />

      {/* Minor streets */}
      <g stroke="#ffffff" strokeOpacity={0.95} fill="none">
        {upperLines.filter((l) => !l.arterial).map((l, i) => (
          <line key={`mn-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={3} />
        ))}
      </g>

      {/* Arterials */}
      <g stroke="#f5e1a0" strokeOpacity={0.9} fill="none">
        {upperLines.filter((l) => l.arterial).map((l, i) => (
          <line key={`ar-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={6} />
        ))}
      </g>

      {/* Diagonal "Market Street" */}
      <line x1={waterBand + 100} y1={H - waterBand - 40} x2={W - waterBand - 100} y2={waterBand + 220} stroke="#f5e1a0" strokeWidth={9} strokeOpacity={0.85} />

      {/* Centroid halo or pin */}
      {!revealed && (
        <>
          <circle cx={centerX} cy={centerY} r={isCompact ? 80 : 110} fill="#FF5C39" fillOpacity={0.18} stroke="#FF5C39" strokeOpacity={0.7} strokeWidth={2} />
          <circle cx={centerX} cy={centerY} r={4} fill="#FF5C39" opacity={0.9} />
        </>
      )}
      {revealed && (
        <g transform={`translate(${centerX}, ${centerY})`}>
          <ellipse cx={0} cy={6} rx={14} ry={4} fill="#1a1a1a" opacity={0.18} />
          <path d="M0 -36 C 14 -36 22 -28 22 -16 C 22 -4 0 8 0 8 C 0 8 -22 -4 -22 -16 C -22 -28 -14 -36 0 -36 Z" fill="#FF5C39" stroke="#fff" strokeWidth={2.5} />
          <circle cx={0} cy={-18} r={6} fill="#fff" />
        </g>
      )}

      {!isCompact && (
        <text x={centerX} y={centerY + (revealed ? 38 : 150)} textAnchor="middle" fontFamily="var(--mono, monospace)" fontSize={13} fontWeight={600} letterSpacing={1.2} fill="#4a4540" style={{ textTransform: "uppercase" }}>
          {revealed ? "EXACT LOCATION" : "NEIGHBORHOOD"}
        </text>
      )}
    </svg>
  );
}
