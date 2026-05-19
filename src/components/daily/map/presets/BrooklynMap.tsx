"use client";

/**
 * Brooklyn preset — strict orthogonal grid, no tilt. BK's character is the
 * relentless rectangular street grid; the generic procedural renderer
 * adds a ±7° tilt that doesn't match. A larger central park stands in
 * for Prospect Park.
 */

import type { PresetProps } from "./types";

export function BrooklynMap({ listingId, revealed, mode }: PresetProps) {
  const isCompact = mode === "compact";
  const W = 1000;
  const H = 700;

  // Stable centroid position per listing for the halo / pin
  let seed = 0;
  for (let i = 0; i < listingId.length; i++) seed = (seed * 31 + listingId.charCodeAt(i)) | 0;
  const centerX = 360 + Math.abs(seed % 280);
  const centerY = 240 + Math.abs((seed >> 5) % 200);

  // Strict grid — no tilt
  const minorStep = 60;
  const arterialStep = 240; // every 4th line is an arterial
  const minor: number[] = [];
  const arterials: number[] = [];
  for (let x = 0; x <= W; x += minorStep) (x % arterialStep === 0 ? arterials : minor).push(x);
  const minorY: number[] = [];
  const arterialY: number[] = [];
  for (let y = 0; y <= H; y += minorStep) (y % arterialStep === 0 ? arterialY : minorY).push(y);

  // Prospect Park stand-in
  const parkX = 580, parkY = 280, parkW = 200, parkH = 220;

  // East River hint along left edge
  const showWater = !isCompact;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label="Stylized Brooklyn map">
      <rect width={W} height={H} fill="#f0e9d8" />
      {showWater && <rect x={0} y={0} width={70} height={H} fill="#cfe1ec" opacity={0.9} />}

      {/* Block shading */}
      <g opacity={0.35}>
        {[120, 360, 600, 840].map((x) => (
          <rect key={x} x={x} y={60} width={120} height={580} fill="#e8e0cd" />
        ))}
      </g>

      {/* Park */}
      <rect x={parkX} y={parkY} width={parkW} height={parkH} fill="#c8d8b8" rx={4} />
      <rect x={parkX} y={parkY} width={parkW} height={parkH} fill="none" stroke="#a8bfa0" strokeOpacity={0.55} strokeWidth={1} rx={4} />

      {/* Minor streets */}
      <g stroke="#ffffff" strokeOpacity={0.95} strokeWidth={3} fill="none">
        {minor.map((x) => <line key={`vmn-${x}`} x1={x} y1={0} x2={x} y2={H} />)}
        {minorY.map((y) => <line key={`hmn-${y}`} x1={70} y1={y} x2={W} y2={y} />)}
      </g>

      {/* Arterials */}
      <g stroke="#f5e1a0" strokeOpacity={0.9} strokeWidth={6} fill="none">
        {arterials.map((x) => <line key={`var-${x}`} x1={x} y1={0} x2={x} y2={H} />)}
        {arterialY.map((y) => <line key={`har-${y}`} x1={70} y1={y} x2={W} y2={y} />)}
      </g>

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
