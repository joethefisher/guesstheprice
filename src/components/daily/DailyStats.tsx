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
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", color: "var(--paper)" }}>
      <StageBackground soft />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {/* Header */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "26px 36px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
            <Wordmark size={18} />
          </div>
          <div style={{ width: 1, height: 18, background: "rgba(247,244,238,0.2)" }} />
          <DailyBadge dailyNumber={dailyNumber} subtle />
        </div>
        <DarkIconButton onClick={onExit} />
      </header>

      {/* Two-column body */}
      <div style={{
        position: "absolute",
        top: 88, left: 56, right: 56, bottom: 24,
        display: "grid",
        gridTemplateColumns: "1.1fr 1.4fr",
        gap: 48, zIndex: 3,
        overflowY: "auto",
      }}>
        {/* LEFT — stats hero */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <motion.div {...fadeUp(0)}>
            <div className="eyebrow" style={{ marginBottom: 16, color: "var(--paper-mute)" }}>
              Your daily statistics
            </div>
          </motion.div>

          {/* 2×2 hero numbers */}
          <motion.div
            {...fadeUp(1)}
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
              paddingBottom: 24, borderBottom: "1px solid rgba(247,244,238,0.1)", marginBottom: 24,
            }}
          >
            <div>
              <div className="display tnum" style={{ fontSize: "var(--text-display-xl)", lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.03em" }}>
                {storage.currentStreak}
              </div>
              <div className="eyebrow" style={{ marginTop: 6, color: "var(--paper-mute)" }}>
                CURRENT STREAK 🔥
              </div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: "var(--text-display-xl)", lineHeight: 1, color: "var(--spot)", letterSpacing: "-0.03em" }}>
                {storage.bestStreak}
              </div>
              <div className="eyebrow" style={{ marginTop: 6, color: "var(--paper-mute)" }}>
                BEST STREAK
              </div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--paper)", letterSpacing: "-0.025em" }}>
                {storage.played}
              </div>
              <div className="eyebrow" style={{ marginTop: 6, color: "var(--paper-mute)" }}>
                PLAYED
              </div>
            </div>
            <div>
              <div className="display tnum" style={{ fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--paper)", letterSpacing: "-0.025em" }}>
                {avgAccuracy}<span style={{ fontSize: "var(--text-2xl)", color: "var(--paper-quiet)" }}>%</span>
              </div>
              <div className="eyebrow" style={{ marginTop: 6, color: "var(--paper-mute)" }}>
                AVG ACCURACY
              </div>
            </div>
          </motion.div>

          {/* Distribution */}
          <motion.div {...fadeUp(2)}>
            <div className="eyebrow" style={{ marginBottom: 12, color: "var(--paper-mute)" }}>
              Accuracy distribution · last {storage.played}
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {DISTRIBUTION_BUCKETS.map((bucket) => {
                const count = dist[bucket] ?? 0;
                const w = `${Math.max(8, (count / maxDist) * 100)}%`;
                const isLast = bucket === distribution_highlight(storage);
                return (
                  <div key={bucket} className="dist-row">
                    <span style={{ color: "var(--paper-mute)", textAlign: "right" }}>{bucket}</span>
                    <div style={{ position: "relative", height: "100%", background: "rgba(247,244,238,0.08)", borderRadius: 3 }}>
                      <div className="dist-bar" style={{
                        width: w,
                        background: isLast ? "var(--accent)" : "rgba(247,244,238,0.5)",
                        color: isLast ? "var(--paper)" : "var(--ink)",
                        boxShadow: isLast ? "0 2px 12px -4px var(--accent)" : "none",
                      }}>
                        {count > 0 ? count : ""}
                      </div>
                    </div>
                    <span style={{ color: isLast ? "var(--accent)" : "rgba(247,244,238,0.4)", textAlign: "right", fontSize: "var(--text-xs)" }}>
                      {isLast ? "← you" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Countdown card */}
          <motion.div
            {...fadeUp(3)}
            style={{ marginTop: "auto", paddingTop: 24 }}
          >
            <div style={{
              padding: 18, borderRadius: 14,
              background: "rgba(247,244,238,0.06)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4, color: "var(--paper-mute)" }}>
                  NEXT DAILY
                </div>
                <NextDailyCountdown size={26} color="var(--spot)" />
              </div>
              <div style={{
                fontSize: "var(--text-xs)", color: "var(--paper-mute)",
                textAlign: "right", maxWidth: 160,
              }}>
                Resets at midnight Eastern.<br />Miss it and your streak goes to zero.
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — calendar */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <motion.div {...fadeUp(1)} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4, color: "var(--paper-mute)" }}>
                  Five-week heatmap
                </div>
                <div className="display" style={{ fontSize: "var(--text-xl)", fontStyle: "italic", color: "var(--paper)" }}>
                  Last 35 days
                </div>
              </div>
            </div>
          </motion.div>

          {/* Day-of-week headers */}
          <motion.div {...fadeUp(2)}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8,
            }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} style={{
                  textAlign: "center", fontSize: "var(--text-xs)",
                  color: "var(--paper-quiet)",
                  fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.1em",
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 18,
            }}>
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
                    <div style={{
                      fontSize: "var(--text-xs)", opacity: 0.5,
                      position: "absolute", top: 3, left: 4,
                    }}>
                      {i + 1}
                    </div>
                    <div className="tnum" style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
                      {v == null ? "·" : v}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: "var(--text-xs)", color: "var(--paper-mute)", marginBottom: 18,
            }}>
              <span>Missed</span>
              <div style={{ display: "flex", gap: 3 }}>
                {([null, 55, 65, 75, 85, 95] as (number | null)[]).map((v, i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: 3, background: cellColor(v),
                  }} />
                ))}
              </div>
              <span>Better →</span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, boxShadow: "0 0 0 2px var(--spot)", background: "transparent" }} />
                Today
              </span>
            </div>
          </motion.div>

          {/* Accuracy trend chart */}
          <motion.div {...fadeUp(3)} style={{ marginBottom: 14 }}>
            <div style={{
              padding: 18, borderRadius: 14,
              background: "rgba(247,244,238,0.06)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="eyebrow" style={{ color: "var(--paper-mute)" }}>Accuracy trend</div>
              </div>
              <svg viewBox="0 0 400 80" width="100%" height="60">
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{
                padding: 14, borderRadius: 12,
                background: "rgba(247,244,238,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              }}>
                <div className="eyebrow" style={{ fontSize: "var(--text-xs)", color: "var(--paper-mute)" }}>
                  HARDEST DAY
                </div>
                <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: "var(--text-md)", color: "var(--paper)", marginTop: 4 }}>
                  {hardestDay ? `Day ${hardestDay.i + 1}` : "—"}
                </div>
                {hardestDay && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--paper-mute)" }} className="tnum">
                    {hardestDay.v}% accuracy
                  </div>
                )}
              </div>
              <div style={{
                padding: 14, borderRadius: 12,
                background: "rgba(247,244,238,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              }}>
                <div className="eyebrow" style={{ fontSize: "var(--text-xs)", color: "var(--paper-mute)" }}>
                  BEST DAY
                </div>
                <div style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: "var(--text-md)", color: "var(--paper)", marginTop: 4 }}>
                  {bestDay ? `Day ${bestDay.i + 1}` : "—"}
                </div>
                {bestDay && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--paper-mute)" }} className="tnum">
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
