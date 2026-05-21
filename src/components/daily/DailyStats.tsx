"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
  DailyBadge,
  NextDailyCountdown,
  DarkIconButton,
} from "./DailyShared";
import type { DailyStorage, AccuracyBucket } from "@/lib/daily/service";

interface Props {
  storage: DailyStorage;
  dailyNumber: number;
  onExit: () => void;
}

const DISTRIBUTION_BUCKETS: AccuracyBucket[] = ["90+", "80", "70", "60", "50", "<50"];

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function cellColor(v: number | null): string {
  if (v == null) return "rgba(247,244,238,0.06)";
  if (v >= 90) return "var(--emerald)";
  if (v >= 80) return "#4A6741";   // --moss
  if (v >= 70) return "var(--accent)";
  if (v >= 60) return "var(--gold)";
  return "rgba(247,244,238,0.15)";
}

export function DailyStats({ storage, dailyNumber, onExit }: Props) {
  const history = storage.history;
  const dist = storage.distribution;

  const maxDist = Math.max(1, ...DISTRIBUTION_BUCKETS.map((b) => dist[b] ?? 0));

  // Build SVG trend line from history
  const trendPoints = useMemo(() => {
    const pts = history
      .map((v, i) => ({ x: (i / Math.max(1, history.length - 1)) * 400, y: 80 - ((v ?? 50) / 100) * 70 }));
    const d = pts.map((p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)).join(" ");
    return d;
  }, [history]);

  // Best and hardest day from history
  const playedHistory = history.map((v, i) => ({ v, i })).filter((e) => e.v !== null) as { v: number; i: number }[];
  const bestDay = playedHistory.length ? playedHistory.reduce((a, b) => (b.v > a.v ? b : a)) : null;
  const hardestDay = playedHistory.length ? playedHistory.reduce((a, b) => (b.v < a.v ? b : a)) : null;

  // Avg accuracy
  const avgAccuracy = playedHistory.length
    ? Math.round(playedHistory.reduce((sum, e) => sum + e.v, 0) / playedHistory.length)
    : 0;

  return (
    <div className="relative w-full h-full overflow-hidden text-paper">
      <StageBackground soft />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-9 py-[26px]">
        <div className="flex items-center gap-3.5">
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
            <Wordmark size={18} />
          </div>
          <div className="w-px h-[18px] bg-paper-20" />
          <DailyBadge dailyNumber={dailyNumber} subtle />
        </div>
        <DarkIconButton onClick={onExit} />
      </header>

      {/* Two-column body */}
      <div className="absolute top-[88px] left-14 right-14 bottom-6 z-[3] grid gap-12 overflow-y-auto" style={{ gridTemplateColumns: "1.1fr 1.4fr" }}>
        {/* LEFT — stats hero */}
        <div className="flex flex-col">
          <motion.div {...fadeUp(0)}>
            <div className="eyebrow mb-4 text-paper-60">
              Your daily statistics
            </div>
          </motion.div>

          {/* 2×2 hero numbers */}
          <motion.div
            {...fadeUp(1)}
            className="grid grid-cols-2 gap-6 pb-6 border-b border-[rgba(247,244,238,0.1)] mb-6"
          >
            <div>
              <div className="display tnum text-display-xl leading-none text-accent tracking-[-0.03em]">
                {storage.currentStreak}
              </div>
              <div className="eyebrow mt-1.5 text-paper-60">
                CURRENT STREAK 🔥
              </div>
            </div>
            <div>
              <div className="display tnum text-display-xl leading-none text-spot tracking-[-0.03em]">
                {storage.bestStreak}
              </div>
              <div className="eyebrow mt-1.5 text-paper-60">
                BEST STREAK
              </div>
            </div>
            <div>
              <div className="display tnum text-display-l leading-none text-paper tracking-[-0.025em]">
                {storage.played}
              </div>
              <div className="eyebrow mt-1.5 text-paper-60">
                PLAYED
              </div>
            </div>
            <div>
              <div className="display tnum text-display-l leading-none text-paper tracking-[-0.025em]">
                {avgAccuracy}<span className="text-2xl text-paper-40">%</span>
              </div>
              <div className="eyebrow mt-1.5 text-paper-60">
                AVG ACCURACY
              </div>
            </div>
          </motion.div>

          {/* Distribution */}
          <motion.div {...fadeUp(2)}>
            <div className="eyebrow mb-3 text-paper-60">
              Accuracy distribution · last {storage.played}
            </div>
            <div className="grid gap-1">
              {DISTRIBUTION_BUCKETS.map((bucket) => {
                const count = dist[bucket] ?? 0;
                const w = `${Math.max(8, (count / maxDist) * 100)}%`;
                const isLast = bucket === distribution_highlight(storage);
                return (
                  <div key={bucket} className="dist-row">
                    <span className="text-right text-paper-60">{bucket}</span>
                    <div className="relative h-full rounded-[3px] bg-paper-08">
                      <div className="dist-bar" style={{
                        width: w,
                        background: isLast ? "var(--accent)" : "rgba(247,244,238,0.5)",
                        color: isLast ? "var(--paper)" : "var(--ink)",
                        boxShadow: isLast ? "0 2px 12px -4px var(--accent)" : "none",
                      }}>
                        {count > 0 ? count : ""}
                      </div>
                    </div>
                    <span className={`text-right text-xs ${isLast ? "text-accent" : "text-paper-40"}`}>
                      {isLast ? "← you" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Countdown card */}
          <motion.div {...fadeUp(3)} className="mt-auto pt-6">
            <div className="p-[18px] rounded-3 bg-paper-08 flex items-center justify-between" style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
              <div>
                <div className="eyebrow mb-1 text-paper-60">
                  NEXT DAILY
                </div>
                <NextDailyCountdown size={26} color="var(--spot)" />
              </div>
              <div className="text-xs text-paper-60 text-right max-w-[160px]">
                Resets at midnight Eastern.<br />Miss it and your streak goes to zero.
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — calendar */}
        <div className="flex flex-col">
          <motion.div className="mb-4" {...fadeUp(1)}>
            <div className="flex justify-between items-baseline">
              <div>
                <div className="eyebrow mb-1 text-paper-60">
                  Five-week heatmap
                </div>
                <div className="display text-xl italic text-paper">
                  Last 35 days
                </div>
              </div>
            </div>
          </motion.div>

          {/* Day-of-week headers */}
          <motion.div {...fadeUp(2)}>
            <div className="grid grid-cols-7 gap-[6px] mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs text-paper-40 font-mono font-bold tracking-[0.1em]">
                  {d}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="grid grid-cols-7 gap-[6px] mb-[18px]">
              {history.map((v, i) => {
                const isToday = i === history.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.015, duration: 0.3 }}
                    className="heatcell"
                    style={{
                      background: cellColor(v),
                      boxShadow: isToday ? "0 0 0 2px var(--spot)" : "none",
                      color: v == null ? "rgba(247,244,238,0.3)" : "rgba(247,244,238,0.9)",
                    }}
                    title={v != null ? `${v}%` : "Missed"}
                  >
                    <div className="absolute top-[3px] left-1 text-xs opacity-50">
                      {i + 1}
                    </div>
                    <div className="tnum text-xs font-bold">
                      {v == null ? "·" : v}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-paper-60 mb-[18px]">
              <span>Missed</span>
              <div className="flex gap-[3px]">
                {([null, 55, 65, 75, 85, 95] as (number | null)[]).map((v, i) => (
                  <div key={i} className="w-3.5 h-3.5 rounded-[3px]" style={{ background: cellColor(v) }} />
                ))}
              </div>
              <span>Better →</span>
              <span className="ml-auto flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-transparent" style={{ boxShadow: "0 0 0 2px var(--spot)" }} />
                Today
              </span>
            </div>
          </motion.div>

          {/* Accuracy trend chart */}
          <motion.div className="mb-3.5" {...fadeUp(3)}>
            <div className="p-[18px] rounded-3 bg-paper-08" style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
              <div className="flex justify-between mb-2.5">
                <div className="eyebrow text-paper-60">Accuracy trend</div>
              </div>
              <svg aria-hidden="true" viewBox="0 0 400 80" width="100%" height="60">
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--spot)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--spot)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${trendPoints} L400,80 L0,80 Z`}
                  fill="url(#trendGrad)"
                />
                <path
                  d={trendPoints}
                  stroke="var(--spot)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>

          {/* Best / hardest day */}
          <motion.div {...fadeUp(4)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2 bg-paper-08" style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
                <div className="eyebrow text-xs text-paper-60">
                  HARDEST DAY
                </div>
                <div className="font-display italic text-md text-paper mt-1">
                  {hardestDay ? `Day ${hardestDay.i + 1}` : "—"}
                </div>
                {hardestDay && (
                  <div className="text-xs text-paper-60 tnum">
                    {hardestDay.v}% accuracy
                  </div>
                )}
              </div>
              <div className="p-3.5 rounded-2 bg-paper-08" style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}>
                <div className="eyebrow text-xs text-paper-60">
                  BEST DAY
                </div>
                <div className="font-display italic text-md text-paper mt-1">
                  {bestDay ? `Day ${bestDay.i + 1}` : "—"}
                </div>
                {bestDay && (
                  <div className="text-xs text-paper-60 tnum">
                    {bestDay.v}% accuracy
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Returns the bucket corresponding to the last played result, for distribution highlight
function distribution_highlight(storage: DailyStorage): AccuracyBucket | null {
  if (!storage.lastResult) return null;
  return storage.lastResult.bucket;
}
