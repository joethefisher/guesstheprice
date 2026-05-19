"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const SLIDER_MIN = 50_000;
const SLIDER_MAX = 20_000_000;
const TICKS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

function valueToPos(v: number) {
  const lmin = Math.log(SLIDER_MIN);
  const lmax = Math.log(SLIDER_MAX);
  return (Math.log(v) - lmin) / (lmax - lmin);
}

function posToValue(p: number) {
  const lmin = Math.log(SLIDER_MIN);
  const lmax = Math.log(SLIDER_MAX);
  return Math.exp(lmin + p * (lmax - lmin));
}

function snapValue(v: number) {
  if (v < 1_000_000) return Math.round(v / 5_000) * 5_000;
  if (v < 5_000_000) return Math.round(v / 25_000) * 25_000;
  return Math.round(v / 100_000) * 100_000;
}

function fmtShort(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  locked?: boolean;
}

export function PriceSlider({ value, onChange, locked = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);

  const pct = valueToPos(Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, value)));

  const updateFromX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const r = trackRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      onChange(snapValue(posToValue(p)));
    },
    [onChange]
  );

  useEffect(() => {
    if (!drag) return;
    const m = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updateFromX(clientX);
    };
    const u = () => setDrag(false);
    window.addEventListener("mousemove", m);
    window.addEventListener("touchmove", m, { passive: true });
    window.addEventListener("mouseup", u);
    window.addEventListener("touchend", u);
    return () => {
      window.removeEventListener("mousemove", m);
      window.removeEventListener("touchmove", m);
      window.removeEventListener("mouseup", u);
      window.removeEventListener("touchend", u);
    };
  }, [drag, updateFromX]);

  return (
    <div
      style={{
        position: "relative",
        padding: "32px 0 0",
        opacity: locked ? 0.55 : 1,
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      {/* Tick labels */}
      <div style={{ position: "relative", height: 16 }}>
        {TICKS.map((t) => (
          <div
            key={t}
            className="tnum"
            style={{
              position: "absolute",
              left: `${valueToPos(t) * 100}%`,
              transform: "translateX(-50%)",
              fontSize: "var(--text-xs)",
              color: "var(--ink-quiet)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {fmtShort(t)}
          </div>
        ))}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={(e) => { setDrag(true); updateFromX(e.clientX); }}
        onTouchStart={(e) => { setDrag(true); updateFromX(e.touches[0].clientX); }}
        style={{
          position: "relative",
          height: 14,
          marginTop: 8,
          background: "var(--cream)",
          borderRadius: 999,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
          cursor: locked ? "default" : "pointer",
        }}
      >
        {/* Gradient hints */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(168,197,218,0.4) 0%, transparent 8%, transparent 92%, rgba(255,92,57,0.35) 100%)",
          }}
        />

        {/* Tick marks */}
        {TICKS.map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              left: `${valueToPos(t) * 100}%`,
              top: 4,
              bottom: 4,
              width: 1.5,
              background: "rgba(26,26,26,0.18)",
              transform: "translateX(-50%)",
              borderRadius: 1,
            }}
          />
        ))}

        {/* Fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct * 100}%`,
            background: "var(--ink)",
            borderRadius: 999,
            transition: drag ? "none" : "width 120ms cubic-bezier(0.32,0.72,0,1)",
          }}
        />

        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `${pct * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--paper)",
            boxShadow: "0 0 0 2px var(--ink), 0 4px 12px rgba(0,0,0,0.18)",
            transition: drag ? "none" : "left 120ms cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6,
              borderRadius: 999,
              background: "var(--accent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
