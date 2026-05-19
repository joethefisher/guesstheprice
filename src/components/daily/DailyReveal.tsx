"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Confetti } from "@/components/Confetti";
import { Icon } from "@/components/Icons";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
  GhostButton,
} from "./DailyShared";
import type { DailyResult } from "@/lib/daily/service";
import type { ListingPublic } from "@/lib/game";

interface Props {
  result: DailyResult;
  listing: ListingPublic;
  dailyNumber: number;
  newStreak: number;
  onShare: () => void;
  onContinue: () => void;
  onExit: () => void;
}

function useNumberTicker(target: number, delay: number, duration = 1200) {
  const [current, setCurrent] = useState(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const from = target * 0.85;

      function step() {
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setCurrent(Math.round(from + (target - from) * eased));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      }

      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, delay, duration]);

  return current;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDiff(diff: number): string {
  const sign = diff >= 0 ? "+" : "−";
  const abs = Math.abs(diff);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${abs}`;
}

function reactionLabel(accuracy: number): string {
  if (accuracy >= 95) return "BULLSEYE";
  if (accuracy >= 90) return "SO CLOSE";
  if (accuracy >= 80) return "SOLID";
  if (accuracy >= 70) return "BALLPARK";
  if (accuracy >= 60) return "NOT BAD";
  return "WIDE OF THE MARK";
}

function reactionHeadline(guess: number, actual: number, accuracy: number): string {
  const diff = guess - actual;
  const diffStr = formatDiff(diff);
  if (accuracy >= 95) return "Practically perfect.";
  if (diff > 0) return `You over-guessed by ${formatDiff(Math.abs(diff))}.`;
  return `You under-guessed by ${formatDiff(Math.abs(diff))}.`;
}

export function DailyReveal({
  result,
  listing,
  dailyNumber,
  newStreak,
  onShare,
  onContinue,
  onExit,
}: Props) {
  const [stampVisible, setStampVisible] = useState(false);
  const [actualVisible, setActualVisible] = useState(false);
  const [shake, setShake] = useState(false);

  const tickedActual = useNumberTicker(result.actual, actualVisible ? 0 : 99999, 1200);

  useEffect(() => {
    // Stamp at 700ms after mount
    const t1 = setTimeout(() => setStampVisible(true), 700);
    // Actual at 1100ms
    const t2 = setTimeout(() => setActualVisible(true), 1100);
    // Camera shake if accuracy < 60
    const t3 = setTimeout(() => {
      if (result.accuracy < 60) setShake(true);
    }, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [result.accuracy]);

  const fireConfetti = result.accuracy >= 90;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <StageBackground />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {fireConfetti && <Confetti fire count={80} />}

      {/* Top label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute", top: 40, left: 0, right: 0, zIndex: 4,
          textAlign: "center",
        }}
      >
        <div className="eyebrow" style={{ color: "var(--spot)", letterSpacing: "0.3em", fontSize: "var(--text-xs)" }}>
          THE REVEAL · DAILY #{dailyNumber}
        </div>
      </motion.div>

      <div style={{
        position: "absolute", inset: 0, zIndex: 5,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "100px 56px 36px", color: "var(--paper)",
      }}>
        {/* Three-column: YOUR GUESS | SOLD | ACTUAL */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 40,
          alignItems: "center", marginBottom: 32,
        }}>
          {/* YOUR GUESS */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: "right" }}
          >
            <div className="eyebrow" style={{
              marginBottom: 12, color: "var(--paper-mute)", letterSpacing: "0.22em",
            }}>
              YOUR GUESS
            </div>
            <div className="display tnum" style={{
              fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--paper-mute)",
              letterSpacing: "-0.025em",
            }}>
              {formatPrice(result.guess)}
            </div>
          </motion.div>

          {/* SOLD stamp */}
          <motion.div
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={stampVisible
              ? { scale: 1, rotate: -8, opacity: 1 }
              : { scale: 0, rotate: -30, opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 500, damping: 12 }}
            style={{
              animation: shake ? "cameraShake 0.4s ease-in-out" : undefined,
            }}
          >
            <div className="sold-stamp" style={{ fontSize: "var(--text-xl)", color: "var(--accent)" }}>
              Sold
            </div>
          </motion.div>

          {/* ACTUAL */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={actualVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow" style={{
              marginBottom: 12, color: "var(--spot)", letterSpacing: "0.22em",
            }}>
              ACTUAL PRICE
            </div>
            <motion.div
              animate={actualVisible && tickedActual >= result.actual
                ? { scale: [1, 1.05, 1] }
                : {}}
              transition={{ duration: 0.3, delay: 1.3 }}
              className="display tnum"
              style={{
                fontSize: "var(--text-display-xl)", lineHeight: 1, color: "var(--spot)",
                letterSpacing: "-0.03em",
                textShadow: "0 0 60px rgba(255,214,107,0.4)",
              }}
            >
              {formatPrice(tickedActual)}
            </motion.div>
          </motion.div>
        </div>

        {/* Reaction line */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.6 }}
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <div style={{
            display: "inline-block",
            padding: "6px 14px", borderRadius: 999,
            background: "var(--accent)", color: "#fff",
            fontSize: "var(--text-xs)", fontWeight: 800, letterSpacing: "0.18em", marginBottom: 14,
          }}>
            {reactionLabel(result.accuracy)}
          </div>
          <div className="display" style={{
            fontSize: "var(--text-3xl)", lineHeight: 1, color: "var(--paper)",
          }}>
            {reactionHeadline(result.guess, result.actual, result.accuracy)}
          </div>
        </motion.div>

        {/* Metric row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.8 }}
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1,
            background: "rgba(247,244,238,0.1)", borderRadius: 14,
            overflow: "hidden", maxWidth: "var(--w-wide)", margin: "0 auto", width: "100%",
          }}
        >
          {[
            { label: "Accuracy", value: `${result.accuracy}%`, tone: "var(--spot)" },
            { label: "Score today", value: `+${result.accuracy}`, tone: "var(--paper)" },
            { label: "New streak", value: String(newStreak), sub: "day streak 🔥", tone: "var(--accent)" },
            {
              label: "Off by",
              value: formatDiff(result.guess - result.actual),
              tone: Math.abs(result.guess - result.actual) / result.actual < 0.1
                ? "var(--spot)"
                : "var(--paper)",
            },
          ].map((m, i) => (
            <div key={i} style={{
              background: "rgba(15,17,13,0.7)",
              padding: "20px 18px", textAlign: "center",
            }}>
              <div className="eyebrow" style={{
                color: "var(--paper-quiet)", marginBottom: 8, fontSize: "var(--text-xs)",
              }}>
                {m.label}
              </div>
              <div className="display tnum" style={{
                fontSize: "var(--text-2xl)", lineHeight: 1, color: m.tone, letterSpacing: "-0.025em",
              }}>
                {m.value}
              </div>
              {m.sub && (
                <div style={{ color: "var(--paper-quiet)", fontSize: "var(--text-xs)", marginTop: 4 }}>
                  {m.sub}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div className="flex justify-center gap-3 mt-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 2.0 }}
 
        >
          <button
            className="btn btn-primary"
            onClick={onShare}
            style={{ padding: "18px 32px", fontSize: "var(--text-base)", borderRadius: 14 }}
          >
            <Icon.Share size={16} /> Share my result
          </button>
          <GhostButton onClick={onContinue} style={{ padding: "18px 24px" }}>
            See full stats
          </GhostButton>
          <button
            onClick={onExit}
            style={{
              background: "transparent", color: "var(--paper-default)",
              padding: "18px 18px", fontSize: "var(--text-sm)", borderRadius: 14,
              border: "none", cursor: "pointer",
            }}
          >
            Practice rounds →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
