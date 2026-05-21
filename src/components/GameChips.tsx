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
    <div className="flex items-center gap-2 text-ink">
      <span className="text-ink-mute">
        <IconComp size={16} />
      </span>
      <span className="tnum font-semibold text-base">{value}</span>
      <span className="text-sm text-ink-mute tracking-[0.02em]">{label}</span>
    </div>
  );
}

export function StreakFlame({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-[6px] tnum rounded-pill bg-cream text-accent font-bold text-sm px-[11px] py-[5px]">
      <span className="inline-flex animate-flame-flicker">
        <Icon.Flame size={14} />
      </span>
      {count}
    </div>
  );
}

export function RoundPill({ current, total }: { current: number; total: number }) {
  return (
    <div className="caption tnum inline-flex items-center gap-2 rounded-pill bg-ink-06 text-ink text-xs font-bold tracking-[0.1em] px-3 py-[6px]">
      ROUND <span>{String(current).padStart(2, "0")}</span>
      <span className="opacity-40">/</span>
      <span className="opacity-[0.55]">{String(total).padStart(2, "0")}</span>
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
      className={`inline-flex items-center gap-[6px] tnum rounded-pill font-bold text-sm px-[11px] py-[5px] ${
        isGoated ? "bg-[rgba(255,92,57,0.12)]" : "bg-cream"
      }`}
      style={{
        color: flameColor,
        animation: "comboPulse 200ms ease-out 1",
      }}
    >
      <span
        className="inline-flex relative animate-flame-flicker"
        style={{
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

      <span className="display text-sm">×{multiplier.toFixed(1)}</span>
    </div>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { label: string; bg: string }> = {
    expert:   { label: "Bullseye",  bg: "bg-moss" },
    nailed:   { label: "Nailed it", bg: "bg-moss" },
    solid:    { label: "Solid",     bg: "bg-moss" },
    ballpark: { label: "Ballpark",  bg: "bg-gold" },
    off:      { label: "Off",       bg: "bg-flag" },
    yikes:    { label: "Yikes",     bg: "bg-flag" },
  };
  const c = cfg[tier] ?? cfg.off;
  return (
    <div className={`caption rounded-pill text-white text-xs font-bold tracking-[0.12em] px-3 py-[5px] ${c.bg}`}>
      {c.label}
    </div>
  );
}
