"use client";

import { useEffect, useState } from "react";
import { getTodayET, formatCountdown } from "@/lib/daily/service";

// ─── DailyBadge ───────────────────────────────────────────────────────────────

interface DailyBadgeProps {
  dailyNumber: number;
  size?: "sm" | "md" | "lg";
  subtle?: boolean;
}

export function DailyBadge({ dailyNumber, size = "md", subtle = false }: DailyBadgeProps) {
  const big = size === "lg";
  const small = size === "sm";
  const padding = big ? "8px 14px" : small ? "4px 9px" : "5px 11px";
  const fontSize = big ? 12 : small ? 9 : 10;
  const iconSize = big ? 16 : small ? 10 : 12;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding,
        borderRadius: 999,
        background: subtle ? "rgba(255,214,107,0.18)" : "var(--gold)",
        color: subtle ? "var(--gold)" : "#15110d",
        boxShadow: subtle
          ? "inset 0 0 0 1px rgba(200,163,72,0.45)"
          : "0 4px 14px -6px rgba(200,163,72,0.7)",
        flexShrink: 0,
      }}
    >
      <svg aria-hidden="true" width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0l2 5.5h6L11 9l2 6-5-3.5L3 15l2-6-5-3.5h6z" />
      </svg>
      <span
        className="caption"
        style={{ fontSize, letterSpacing: "0.16em", fontWeight: 700 }}
      >
        DAILY · #{dailyNumber}
      </span>
    </div>
  );
}

// ─── NextDailyCountdown ───────────────────────────────────────────────────────

interface NextDailyCountdownProps {
  size?: number;
  color?: string;
}

export function NextDailyCountdown({
  size = 28,
  color = "var(--ink)",
}: NextDailyCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    function compute() {
      const now = new Date();
      const todayET = getTodayET();
      // Get next midnight ET by parsing today's ET date + 1 day
      const todayDate = new Date(todayET + "T00:00:00Z");
      const tomorrowDate = new Date(todayDate.getTime() + 86_400_000);

      // Compute the actual UTC time of tomorrow's ET midnight
      // We use the real ET offset by comparing local time to ET
      const etNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
      );
      const etMidnight = new Date(etNow);
      etMidnight.setHours(24, 0, 0, 0);

      // Offset between local system time and ET
      const etOffsetMs = now.getTime() - etNow.getTime();
      const nextMidnightUTC = etMidnight.getTime() + etOffsetMs;

      const diff = Math.max(0, Math.floor((nextMidnightUTC - now.getTime()) / 1000));
      setSecondsLeft(diff);
    }

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);

  const { h, m, s } = formatCountdown(secondsLeft);
  const colonSize = size * 0.7;

  return (
    <span className="countdown" style={{ fontSize: size, color }}>
      <span>{h}</span>
      <span style={{ opacity: 0.4, fontSize: colonSize }}>:</span>
      <span>{m}</span>
      <span style={{ opacity: 0.4, fontSize: colonSize }}>:</span>
      <span>{s}</span>
    </span>
  );
}

// ─── Stage background primitives ─────────────────────────────────────────────

export function StageBackground({ soft = false }: { soft?: boolean }) {
  return <div className={soft ? "stage-bg-soft" : "stage-bg"} />;
}

export function SpotlightCones() {
  return (
    <>
      <div className="spotlight-l" />
      <div className="spotlight-r" />
      <div className="spotlight" />
    </>
  );
}

export function GrainOverlay({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <div
      className="grain"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none", zIndex: 2 }}
    />
  );
}

// ─── Bulbs row ────────────────────────────────────────────────────────────────

export function BulbRow({ count = 14 }: { count?: number }) {
  return (
    <div className="bulbs">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

// ─── Dark ghost button (for dark-bg screens) ──────────────────────────────────

export function GhostButton({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      className="btn"
      onClick={onClick}
      style={{
        background: "rgba(247,244,238,0.08)",
        color: "var(--paper)",
        boxShadow: "inset 0 0 0 1.5px rgba(247,244,238,0.4)",
        padding: "16px 22px",
        fontSize: "var(--text-sm)",
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Dark close/icon button ───────────────────────────────────────────────────

export function DarkIconButton({ onClick, label = "Close" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      className="btn btn-icon"
      onClick={onClick}
      aria-label={label}
      style={{
        background: "rgba(247,244,238,0.08)",
        color: "var(--paper)",
        boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)",
      }}
    >
      <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 5l14 14M19 5L5 19" />
      </svg>
    </button>
  );
}
