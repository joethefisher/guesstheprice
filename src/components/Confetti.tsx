"use client";

import { useMemo } from "react";

const PALETTE = ["#FF5C39", "#4A6741", "#A8C5DA", "#C8A348", "#1A1A1A", "#EDE6D6"];

export function Confetti({ count = 80, fire = false }: { count?: number; fire?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.2,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 8,
        color: PALETTE[i % PALETTE.length],
        shape: i % 3,
      })),
    [count]
  );

  if (!fire) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 60,
      }}
      aria-hidden
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.shape === 1 ? p.size * 0.4 : p.size,
            background: p.color,
            borderRadius: p.shape === 2 ? "50%" : 1,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  );
}
