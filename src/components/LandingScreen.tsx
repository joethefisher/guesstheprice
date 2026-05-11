"use client";

import { motion } from "framer-motion";
import { Wordmark } from "./Wordmark";

const FALLBACK_HERO_URL =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=2400&q=85";

const SPARKLINE_POINTS = "0,24 12,18 24,20 36,10 48,14 60,6 72,12 84,4 96,8 108,2 120,8";

interface HeroLocation {
  neighborhood: string | null;
  city: string;
  state: string;
}

interface Props {
  listingCount: number;
  heroPhotoUrl: string | null;
  heroLocation: HeroLocation | null;
  onPlay: () => void;
}

export function LandingScreen({ listingCount, heroPhotoUrl, heroLocation, onPlay }: Props) {
  const photoUrl = heroPhotoUrl ?? FALLBACK_HERO_URL;
  const locationLabel = heroLocation
    ? [heroLocation.neighborhood, heroLocation.city, heroLocation.state].filter(Boolean).join(", ")
    : "Carbon Beach · Malibu, CA";

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Hero photo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(0.78) brightness(0.92)",
        }}
      />

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(247,244,238,0.6) 0%, rgba(247,244,238,0.15) 28%, rgba(26,26,26,0.35) 65%, rgba(26,26,26,0.7) 100%)",
        }}
      />

      {/* Grain */}
      <div className="grain absolute inset-0" />

      {/* Top nav */}
      <header
        className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center"
        style={{ padding: "26px 36px" }}
      >
        <Wordmark size={20} />
        <nav className="flex items-center gap-2">
          <button className="btn btn-ghost" style={{ color: "var(--paper)", fontSize: 14 }}>
            Daily
          </button>
          <button className="btn btn-ghost" style={{ color: "var(--paper)", fontSize: 14 }}>
            Saved
          </button>
          <button className="btn btn-ghost" style={{ color: "var(--paper)", fontSize: 14 }}>
            Stats
          </button>
          <button className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            Sign in
          </button>
        </nav>
      </header>

      {/* Main composition — sits above bottom strip */}
      <div
        className="absolute left-0 right-0 top-0 bottom-[96px] z-10 flex items-end"
        style={{ padding: "0 56px 36px", color: "var(--paper)" }}
      >
        <div
          className="w-full grid gap-14 items-end"
          style={{ gridTemplateColumns: "1.5fr 1fr" }}
        >
          {/* Left: headline */}
          <div>
            <div
              className="eyebrow mb-4"
              style={{ color: "rgba(247,244,238,0.75)" }}
            >
              Real homes · Real prices
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="display m-0"
              style={{
                fontSize: "clamp(64px, 8.4vw, 132px)",
                color: "var(--paper)",
                textShadow: "0 2px 30px rgba(0,0,0,0.25)",
                maxWidth: "12ch",
              }}
            >
              Guess the{" "}
              <span style={{ color: "var(--accent)" }}>price.</span>
            </motion.h1>
          </div>

          {/* Right: subtitle + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col gap-5"
          >
            <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(247,244,238,0.85)", margin: 0, maxWidth: "28ch" }}>
              {listingCount.toLocaleString()} homes. One question. How close can you get?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onPlay}
                className="btn btn-primary"
                style={{ fontSize: 16, padding: "18px 28px", justifyContent: "space-between" }}
              >
                <span>Play 5 rounds</span>
                <span style={{ opacity: 0.8 }}>→</span>
              </button>
              <button
                className="btn"
                style={{
                  fontSize: 14,
                  padding: "14px 20px",
                  background: "rgba(247,244,238,0.12)",
                  backdropFilter: "blur(12px)",
                  color: "var(--paper)",
                  border: "1px solid rgba(247,244,238,0.2)",
                  borderRadius: 14,
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 600 }}>Daily</span>
                <span style={{ opacity: 0.65, fontWeight: 400 }}>· May 9</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          height: 96,
          background: "rgba(26,26,26,0.55)",
          backdropFilter: "blur(20px) saturate(140%)",
          borderTop: "1px solid rgba(247,244,238,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          alignItems: "center",
          padding: "0 40px",
          gap: 0,
        }}
      >
        {/* Today stat */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow" style={{ color: "rgba(247,244,238,0.5)" }}>
            Today, around the world
          </div>
          <div className="flex items-center gap-3">
            <span className="tnum font-semibold" style={{ color: "var(--paper)", fontSize: 22 }}>73%</span>
            <svg width={120} height={28} viewBox="0 0 120 28" fill="none">
              <polyline
                points={SPARKLINE_POINTS}
                stroke="rgba(247,244,238,0.45)"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <polyline
                points={SPARKLINE_POINTS.split(" ").slice(-4).join(" ")}
                stroke="var(--accent)"
                strokeWidth="2"
                fill="none"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: "rgba(247,244,238,0.12)", margin: "0 32px" }} />

        {/* Top scorer */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow" style={{ color: "rgba(247,244,238,0.5)" }}>Top scorer</div>
          <div style={{ color: "var(--paper)", fontSize: 14, fontWeight: 500 }}>
            @margaux_b
            <span className="tnum ml-2" style={{ color: "var(--accent)", fontWeight: 700 }}>947/1000</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: "rgba(247,244,238,0.12)", margin: "0 32px" }} />

        {/* Now showing */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow" style={{ color: "rgba(247,244,238,0.5)" }}>Now showing</div>
          <div style={{ color: "var(--paper)", fontSize: 14, fontWeight: 500 }}>
            {locationLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
