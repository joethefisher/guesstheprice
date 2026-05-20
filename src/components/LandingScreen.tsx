"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Wordmark } from "./Wordmark";
import { UserMenu } from "./UserMenu";
import type { RecentStats } from "@/app/page";

const FALLBACK_HERO_URL =
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=2400&q=85";

const SPARK_W = 120;
const SPARK_H = 28;

/**
 * Project an array of 7 daily accuracies (0..1, null for empty days) to an
 * SVG polyline points string spanning a 120×28 viewBox. Empty days hold the
 * previous point's value so the line doesn't dive to zero on a quiet day.
 */
function buildSparkline(series: RecentStats["last7Days"]): { line: string; tail: string } | null {
  const valid = series.some((d) => d.accuracy != null);
  if (!valid) return null;
  let last = 0.5; // sensible default until we see real data
  const xs = series.map((_, i) => (i / (series.length - 1)) * SPARK_W);
  const ys = series.map((d) => {
    if (d.accuracy != null) last = d.accuracy;
    // Higher accuracy = closer to top (lower y). Map [0,1] → [SPARK_H, 0].
    return SPARK_H - last * SPARK_H;
  });
  const line = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  // Last two segments get the accent stroke — same visual rhythm as the prior static spark.
  const tail = xs.slice(-3).map((x, i) => `${x.toFixed(1)},${ys[ys.length - 3 + i].toFixed(1)}`).join(" ");
  return { line, tail };
}

interface HeroLocation {
  neighborhood: string | null;
  city: string;
  state: string;
}

interface TopScorer {
  username: string;
  score: number;
}

interface Props {
  heroPhotoUrl: string | null;
  heroLocation: HeroLocation | null;
  topScorer: TopScorer | null;
  recentStats: RecentStats;
  onPlay: () => void;
  onDaily: () => void;
  onLeaderboard: () => void;
  onSaved: () => void;
}

export function LandingScreen({ heroPhotoUrl, heroLocation, topScorer, recentStats, onPlay, onDaily, onLeaderboard, onSaved }: Props) {
  const photoUrl = heroPhotoUrl ?? FALLBACK_HERO_URL;
  const locationLabel = heroLocation
    ? [heroLocation.neighborhood, heroLocation.city, heroLocation.state].filter(Boolean).join(", ")
    : "Carbon Beach · Malibu, CA";

  const accuracyPct = recentStats.recentAccuracy != null
    ? Math.round(recentStats.recentAccuracy * 100)
    : null;
  const spark = buildSparkline(recentStats.last7Days);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "var(--paper)" }}>
      {/* Hero photo */}
      <div className="absolute inset-0" style={{ overflow: "hidden" }}>
        <Image
          src={photoUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center",
            filter: "saturate(0.78) brightness(0.92)",
          }}
        />
      </div>

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
        className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center"
        style={{ padding: "26px 36px" }}
      >
        <Wordmark size={20} />
        <nav className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={onDaily} style={{ color: "var(--paper-strong)", fontSize: "var(--text-sm)" }}>
            Daily
          </button>
          <button className="btn btn-ghost" onClick={onLeaderboard} style={{ color: "var(--paper-strong)", fontSize: "var(--text-sm)" }}>
            Leaderboard
          </button>
          <button className="btn btn-ghost" onClick={onSaved} style={{ color: "var(--paper-strong)", fontSize: "var(--text-sm)" }}>
            Saved
          </button>
          <UserMenu variant="dark" />
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
            <p style={{ fontSize: "var(--text-xl)", fontWeight: 700, lineHeight: 1.4, color: "var(--paper-strong)", margin: 0 }}>
              Real homes. Real prices. How close can you get?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onPlay}
                className="btn btn-primary"
                style={{ fontSize: "var(--text-md)", padding: "18px 28px", justifyContent: "space-between" }}
              >
                <span>Play 5 rounds</span>
                <span style={{ opacity: 0.8 }}>→</span>
              </button>
              <button
                onClick={onDaily}
                className="btn"
                style={{
                  fontSize: "var(--text-base)",
                  padding: "14px 20px",
                  background: "rgba(247,244,238,0.12)",
                  backdropFilter: "blur(12px)",
                  color: "var(--paper-strong)",
                  border: "1px solid rgba(247,244,238,0.20)",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 600 }}>Daily</span>
                <span style={{ color: "var(--paper-mute)", fontWeight: 400 }}>· today's house</span>
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
        {/* Last 24h average accuracy across all players */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow" style={{ color: "var(--paper-quiet)" }}>
            Last 24 hours, around the world
          </div>
          <div className="flex items-center gap-3">
            {accuracyPct != null ? (
              <span className="tnum font-semibold" style={{ color: "var(--paper-strong)", fontSize: "var(--text-xl)" }}>
                {accuracyPct}%
              </span>
            ) : (
              <span className="tnum font-semibold" style={{ color: "var(--paper-mute)", fontSize: "var(--text-xl)" }}>
                —
              </span>
            )}
            {spark ? (
              <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} fill="none">
                <polyline
                  points={spark.line}
                  stroke="var(--paper-quiet)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  points={spark.tail}
                  stroke="var(--accent)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <span style={{ color: "var(--paper-mute)", fontSize: "var(--text-sm)", fontStyle: "italic" }}>
                {recentStats.recentCount === 0 ? "Be the first today" : `${recentStats.recentCount} ${recentStats.recentCount === 1 ? "guess" : "guesses"}`}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: "rgba(247,244,238,0.12)", margin: "0 32px" }} />

        {/* Top scorer */}
        <button
          onClick={onLeaderboard}
          className="flex flex-col gap-1"
          style={{ cursor: "pointer", background: "transparent", border: "none", padding: 0, textAlign: "left" }}
        >
          <div className="eyebrow" style={{ color: "var(--paper-quiet)" }}>Top scorer</div>
          {topScorer ? (
            <div style={{ color: "var(--paper-strong)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
              @{topScorer.username}
              <span className="tnum ml-2" style={{ color: "var(--accent)", fontWeight: 700 }}>{topScorer.score.toLocaleString()}</span>
            </div>
          ) : (
            <div style={{ color: "var(--paper-mute)", fontSize: "var(--text-sm)", fontStyle: "italic" }}>
              Be the first →
            </div>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 40, background: "rgba(247,244,238,0.12)", margin: "0 32px" }} />

        {/* Now showing */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow" style={{ color: "var(--paper-quiet)" }}>Now showing</div>
          <div style={{ color: "var(--paper-strong)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
            {locationLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
