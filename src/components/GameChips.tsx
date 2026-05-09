"use client";

import { Icon } from "./Icons";

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
      <span className="tnum font-semibold text-[15px]">{value}</span>
      <span className="text-[12px]" style={{ color: "var(--ink-mute)", letterSpacing: "0.02em" }}>
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
        fontSize: 13,
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
        fontSize: 11,
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
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
      }}
    >
      {c.label}
    </div>
  );
}
