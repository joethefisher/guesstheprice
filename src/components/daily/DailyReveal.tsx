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
import { useSavedHomes } from "@/lib/saved-homes-client";
import type { DailyResult } from "@/lib/daily/service";
import type { ListingPublic, AccuracyTier } from "@/lib/game";

function tierFromAccuracy(accuracy: number): AccuracyTier {
  if (accuracy >= 95) return "expert";
  if (accuracy >= 90) return "nailed";
  if (accuracy >= 80) return "solid";
  if (accuracy >= 70) return "ballpark";
  if (accuracy >= 60) return "off";
  return "yikes";
}

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

  const { homes: savedHomes, add: addSavedHome, remove: removeSavedHome } = useSavedHomes();
  const isAlreadySaved = savedHomes.some((s) => s.listingId === listing.id);

  // On mount: if this listing was saved pre-reveal (score fields null) upgrade
  // it with the now-known guess/accuracy/tier. The hook's `add` is idempotent
  // on listingId — re-adding replaces the entry; for signed-in users the
  // server upsert preserves the row id.
  useEffect(() => {
    const existing = savedHomes.find((s) => s.listingId === listing.id);
    if (!existing || existing.actualPrice !== null) return;
    addSavedHome({
      ...existing,
      guess: result.guess,
      actualPrice: result.actual,
      tier: tierFromAccuracy(result.accuracy),
      accuracy: result.accuracy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, result.guess, result.actual, result.accuracy, savedHomes.length]);

  function handleSaveToggle() {
    if (isAlreadySaved) {
      removeSavedHome(listing.id);
      return;
    }
    addSavedHome({
      listingId: listing.id,
      neighborhood: listing.neighborhood,
      city: listing.city,
      state: listing.state,
      photoUrl: listing.photos[0]?.url ?? "",
      guess: result.guess,
      actualPrice: result.actual,
      tier: tierFromAccuracy(result.accuracy),
      accuracy: result.accuracy,
      savedAt: Date.now(),
    });
  }

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
    <div className="relative w-full h-full overflow-hidden">
      <StageBackground />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {fireConfetti && <Confetti fire count={80} />}

      {/* Top label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute top-10 left-0 right-0 z-[4] text-center"
      >
        <div className="eyebrow text-spot tracking-[0.3em] text-xs">
          THE REVEAL · DAILY #{dailyNumber}
        </div>
      </motion.div>

      <div className="absolute inset-0 z-[5] flex flex-col justify-center pt-[100px] px-14 pb-9 text-paper">
        {/* Three-column: YOUR GUESS | SOLD | ACTUAL */}
        <div
          className="grid gap-10 items-center mb-8"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          {/* YOUR GUESS */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-right"
          >
            <div className="eyebrow mb-3 text-paper-60 tracking-[0.22em]">
              YOUR GUESS
            </div>
            <div className="display tnum text-display-l leading-none text-paper-60 tracking-[-0.025em]">
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
            style={{ animation: shake ? "cameraShake 0.4s ease-in-out" : undefined }}
          >
            <div className="sold-stamp text-xl text-accent">
              Sold
            </div>
          </motion.div>

          {/* ACTUAL */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={actualVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow mb-3 text-spot tracking-[0.22em]">
              ACTUAL PRICE
            </div>
            <motion.div
              animate={actualVisible && tickedActual >= result.actual
                ? { scale: [1, 1.05, 1] }
                : {}}
              transition={{ duration: 0.3, delay: 1.3 }}
              className="display tnum text-display-xl leading-none text-spot tracking-[-0.03em]"
              style={{ textShadow: "0 0 60px rgba(255,214,107,0.4)" }}
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
          className="text-center mb-7"
        >
          <div className="inline-block px-3.5 py-1.5 rounded-pill bg-accent text-white text-xs font-extrabold tracking-[0.18em] mb-3.5">
            {reactionLabel(result.accuracy)}
          </div>
          <div className="display text-3xl leading-none text-paper">
            {reactionHeadline(result.guess, result.actual, result.accuracy)}
          </div>
        </motion.div>

        {/* Metric row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.8 }}
          className="grid grid-cols-4 gap-px bg-[rgba(247,244,238,0.1)] rounded-3 overflow-hidden max-w-wide mx-auto w-full"
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
            <div key={i} className="py-5 px-[18px] text-center" style={{ background: "rgba(15,17,13,0.7)" }}>
              <div className="eyebrow text-paper-40 mb-2 text-xs">
                {m.label}
              </div>
              <div className="display tnum text-2xl leading-none tracking-[-0.025em]" style={{ color: m.tone }}>
                {m.value}
              </div>
              {m.sub && (
                <div className="text-paper-40 text-xs mt-1">
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
            className="btn btn-primary py-[18px] px-8 text-base rounded-3"
            onClick={onShare}
          >
            <Icon.Share size={16} /> Share my result
          </button>
          <GhostButton onClick={onContinue} style={{ padding: "18px 24px" }}>
            See full stats
          </GhostButton>
          <button
            onClick={handleSaveToggle}
            className="bg-transparent text-paper-80 py-[18px] px-[18px] text-sm rounded-3 border-none cursor-pointer flex items-center gap-2"
            aria-label={isAlreadySaved ? "Remove saved home" : "Save this home"}
          >
            <Icon.Heart size={14} filled={isAlreadySaved} />
            {isAlreadySaved ? "Saved" : "Save this home"}
          </button>
          <button
            onClick={onExit}
            className="bg-transparent text-paper-80 py-[18px] px-[18px] text-sm rounded-3 border-none cursor-pointer"
          >
            Practice rounds →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
