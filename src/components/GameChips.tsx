"use client";

import { Icon } from "./Icons";
import { comboMultiplier } from "@/lib/game";

export function Stat({
  icon: IconComp,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
      <span style={{ color: "var(--ink-mute)" }}>
        <IconComp size={16} />
      </span>
      <span className="tnum font-semibold text-base">{value}</span>
      <span className="text-sm" style={{ color: "var(--ink-mute)", letterSpacing: "0.02em" }}>
        {label}
      </span>
    </div>
  );
}

export function StreakFlame({ count }: { count: number }) {
  return (
    <div
      className="inline-flex items-center gap-[6px] tnum"
      style={{
        padding: "5px 11px",
        borderRadius: 999,
        background: "var(--cream)",
        color: "var(--accent)",
        fontWeight: 700,
        fontSize: "var(--text-sm)",
      }}
    >
      <span style={{ animation: "flameFlicker 1.2s ease-in-out infinite", display: "inline-flex" }}>
        <Icon.Flame size={14} />
      </span>
      {count}
    </div>
  );
}

export function RoundPill({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="caption tnum inline-flex items-center gap-2"
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(26,26,26,0.06)",
        color: "var(--ink)",
        fontSize: "var(--text-xs)",
        fontWeight: 700,
        letterSpacing: "0.1em",
      }}
    >
      ROUND{" "}
      <span>{String(current).padStart(2, "0")}</span>
      <span style={{ opacity: 0.4 }}>/</span>
      <span style={{ opacity: 0.55 }}>{String(total).padStart(2, "0")}</span>
    </div>
  );
}

export function ComboFlame({ combo }: { combo: number }) {
  if (combo < 2) return null;

  const isOnFire = combo >= 3;
  const isUnreal = combo >= 5;
  const isGoated = combo >= 7;

  const multiplier = comboMultiplier(combo);
  const flameColor = combo < 3 ? "var(--gold)" : "var(--accent)";
  const flameScale = isGoated ? 1.6 : isUnreal ? 1.5 : isOnFire ? 1.4 : 1.2;

  return (
    <div
      className="inline-flex items-center gap-[6px] tnum"
      style={{
        padding: "5px 11px",
        borderRadius: 999,
        background: isGoated ? "rgba(255,92,57,0.12)" : "var(--cream)",
        color: flameColor,
        fontWeight: 700,
        fontSize: "var(--text-sm)",
        animation: "comboPulse 200ms ease-out 1",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          position: "relative",
          animation: "flameFlicker 1.2s ease-in-out infinite",
          transform: `scale(${flameScale})`,
          transformOrigin: "center bottom",
          filter: isOnFire ? "drop-shadow(0 0 6px var(--accent))" : undefined,
        }}
      >
        <Icon.Flame size={14} />

        {/* Ember sparks for UNREAL (×2.0) and GOATED (×3.0) */}
        {isUnreal && (
          <>
            <span style={{ position: "absolute", top: -1, left: "25%", width: 3, height: 3, borderRadius: "50%", background: "var(--gold)", animation: "emberFloat 0.9s ease-out infinite" }} />
            <span style={{ position: "absolute", top: -1, left: "55%", width: 2, height: 2, borderRadius: "50%", background: "var(--accent)", animation: "emberFloat 0.9s ease-out 0.3s infinite" }} />
            <span style={{ position: "absolute", top: -1, left: "40%", width: 2, height: 2, borderRadius: "50%", background: "var(--gold)", animation: "emberFloat 0.9s ease-out 0.6s infinite" }} />
          </>
        )}

        {/* Rotating ring of fire for GOATED (×3.0) */}
        {isGoated && (
          <span style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1.5px dashed var(--accent)",
            opacity: 0.55,
            animation: "ringRotate 2s linear infinite",
          }} />
        )}
      </span>

      <span className="display" style={{ fontSize: "var(--text-sm)" }}>
        ×{multiplier.toFixed(1)}
      </span>
    </div>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    expert:   { label: "Bullseye",  bg: "var(--moss)", color: "#fff" },
    nailed:   { label: "Nailed it", bg: "var(--moss)", color: "#fff" },
    solid:    { label: "Solid",     bg: "var(--moss)", color: "#fff" },
    ballpark: { label: "Ballpark",  bg: "var(--gold)", color: "#fff" },
    off:      { label: "Off",       bg: "var(--flag)", color: "#fff" },
    yikes:    { label: "Yikes",     bg: "var(--flag)", color: "#fff" },
  };
  const c = cfg[tier] ?? cfg.off;
  return (
    <div
      className="caption"
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: "var(--text-xs)",
        fontWeight: 700,
        letterSpacing: "0.12em",
      }}
    >
      {c.label}
    </div>
  );
}
