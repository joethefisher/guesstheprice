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
    <div className="relative w-full h-screen overflow-hidden bg-paper">
      {/* Hero photo */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={photoUrl}
          alt=""
          fill
          priority
          // Lets Vercel's image CDN resize the source (R2 or Unsplash) and serve
          // a per-device-width WebP from the edge — typically 60-80% smaller than
          // the raw source and cached after the first request.
          sizes="100vw"
          quality={80}
          className="object-cover object-center"
          style={{ filter: "saturate(0.78) brightness(0.92)" }}
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
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-9 py-[26px]">
        <Wordmark size={20} />
        <nav className="flex items-center gap-2">
          <button className="btn btn-ghost text-paper-95 text-sm" onClick={onDaily}>
            Daily
          </button>
          <button className="btn btn-ghost text-paper-95 text-sm" onClick={onLeaderboard}>
            Leaderboard
          </button>
          <button className="btn btn-ghost text-paper-95 text-sm" onClick={onSaved}>
            Saved
          </button>
          <UserMenu variant="dark" />
        </nav>
      </header>

      {/* Main composition — sits above bottom strip */}
      <div className="absolute left-0 right-0 top-0 bottom-[96px] z-10 flex items-end px-14 pb-9 text-paper">
        <div className="w-full grid gap-14 items-end" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          {/* Left: headline */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="display m-0 text-paper max-w-[12ch]"
              style={{
                fontSize: "clamp(64px, 8.4vw, 132px)",
                textShadow: "0 2px 30px rgba(0,0,0,0.25)",
              }}
            >
              Guess the <span className="text-accent">price.</span>
            </motion.h1>
          </div>

          {/* Right: subtitle + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col gap-5"
          >
            <p className="text-xl font-bold leading-[1.4] text-paper-95 m-0">
              Real homes. Real prices. How close can you get?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onPlay}
                className="btn btn-primary text-md justify-between px-7 py-4"
              >
                <span>Play 5 rounds</span>
                <span className="opacity-80">→</span>
              </button>
              <button
                onClick={onDaily}
                className="btn text-base px-5 py-3.5 text-paper-95 justify-between bg-[rgba(247,244,238,0.12)] border border-paper-20"
                style={{ backdropFilter: "blur(12px)" }}
              >
                <span className="font-semibold">Daily</span>
                <span className="text-paper-60 font-normal">· today's house</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 h-24 bg-ink-55 border-t border-[rgba(247,244,238,0.08)] grid items-center px-10"
        style={{
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          backdropFilter: "blur(20px) saturate(140%)",
        }}
      >
        {/* Last 24h average accuracy across all players */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow text-paper-40">
            Last 24 hours, around the world
          </div>
          <div className="flex items-center gap-3">
            {accuracyPct != null ? (
              <span className="tnum font-semibold text-paper-95 text-xl">
                {accuracyPct}%
              </span>
            ) : (
              <span className="tnum font-semibold text-paper-60 text-xl">
                —
              </span>
            )}
            {spark ? (
              <svg aria-hidden="true" width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} fill="none">
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
              <span className="text-paper-60 text-sm italic">
                {recentStats.recentCount === 0 ? "Be the first today" : `${recentStats.recentCount} ${recentStats.recentCount === 1 ? "guess" : "guesses"}`}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-[rgba(247,244,238,0.12)] mx-8" />

        {/* Top scorer */}
        <button
          onClick={onLeaderboard}
          className="flex flex-col gap-1 cursor-pointer bg-transparent border-none p-0 text-left"
        >
          <div className="eyebrow text-paper-40">Top scorer</div>
          {topScorer ? (
            <div className="text-paper-95 text-sm font-medium">
              @{topScorer.username}
              <span className="tnum ml-2 text-accent font-bold">{topScorer.score.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-paper-60 text-sm italic">
              Be the first →
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-10 bg-[rgba(247,244,238,0.12)] mx-8" />

        {/* Now showing */}
        <div className="flex flex-col gap-1">
          <div className="eyebrow text-paper-40">Now showing</div>
          <div className="text-paper-95 text-sm font-medium">
            {locationLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
