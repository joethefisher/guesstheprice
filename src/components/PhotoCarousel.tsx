"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icons";

interface Photo {
  url: string;
  caption?: string | null;
  thumbnailUrl?: string | null;
}

interface Props {
  photos: Photo[];
  overlayCount?: number;
  bandColor?: string;
  onIndexChange?: (idx: number) => void;
}

export function PhotoCarousel({ photos, overlayCount, bandColor = "#bfae93", onIndexChange }: Props) {
  const [idx, setIdx] = useState(0);
  const total = photos.length;

  const go = useCallback(
    (dir: number) => {
      setIdx((i) => {
        const next = (i + dir + total) % total;
        onIndexChange?.(next);
        return next;
      });
    },
    [total, onIndexChange]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  if (!photos.length) {
    return (
      <div className="w-full h-full grid place-items-center" style={{ background: bandColor, color: "var(--ink-mute)" }}>
        No photos
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: bandColor, borderRadius: "inherit" }}
    >
      {/* Photo crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${photos[idx].url})` }}
        />
      </AnimatePresence>

      {/* Legibility gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 60%, rgba(0,0,0,.5) 100%)",
        }}
      />

      {/* Arrow nav */}
      <button
        onClick={() => go(-1)}
        aria-label="Previous photo"
        className="btn-icon absolute top-1/2 -translate-y-1/2"
        style={{ left: 14, color: "var(--ink)", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
      >
        <Icon.Arrow dir="left" size={20} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next photo"
        className="btn-icon absolute top-1/2 -translate-y-1/2"
        style={{ right: 14, color: "var(--ink)", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
      >
        <Icon.Arrow size={20} />
      </button>

      {/* Counter */}
      <div
        className="tnum absolute top-4 right-4 text-sm font-semibold"
        style={{
          background: "rgba(26,26,26,0.72)",
          color: "var(--paper)",
          padding: "6px 12px",
          borderRadius: 999,
          backdropFilter: "blur(8px)",
          letterSpacing: "0.02em",
        }}
      >
        {idx + 1} <span style={{ opacity: 0.55 }}>/</span> {overlayCount ?? total}
      </div>

      {/* Dot pagination */}
      <div
        className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex gap-[6px]"
        style={{
          padding: "6px 10px",
          background: "rgba(26,26,26,0.4)",
          borderRadius: 999,
          backdropFilter: "blur(8px)",
        }}
      >
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); onIndexChange?.(i); }}
            aria-label={`Photo ${i + 1}`}
            style={{
              width: i === idx ? 22 : 6,
              height: 6,
              borderRadius: 4,
              background: i === idx ? "var(--paper)" : "rgba(247,244,238,0.5)",
              transition: "all 280ms cubic-bezier(0.32,0.72,0,1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
