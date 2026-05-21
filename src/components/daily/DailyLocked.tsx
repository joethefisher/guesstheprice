"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
  NextDailyCountdown,
  DarkIconButton,
} from "./DailyShared";
import { MapExpandedModal } from "./map/MapExpandedModal";
import type { DailyResult, DailyStorage } from "@/lib/daily/service";
import type { ListingPublic } from "@/lib/game";

interface Props {
  result: DailyResult | null;
  storage: DailyStorage;
  dailyNumber: number;
  listing: ListingPublic | null;
  onPractice: () => void;
  onStats: () => void;
  onExit: () => void;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function DailyLocked({
  result,
  storage,
  dailyNumber,
  listing,
  onPractice,
  onStats,
  onExit,
}: Props) {
  // Prefer the live listing's R2-mirrored URL; fall back to stored source URL
  const photoUrl = listing?.photos?.[0]?.url || result?.photoUrl || null;
  const [mapOpen, setMapOpen] = useState(false);
  const canShowMap = !!(listing?.map && result);

  return (
    <div className="relative w-full h-full overflow-hidden text-paper">
      <StageBackground soft />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-9 py-[26px]">
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <Wordmark size={18} />
        </div>
        <DarkIconButton onClick={onExit} />
      </header>

      {/* Two-column grid */}
      <div className="absolute inset-0 z-[3] grid grid-cols-2 gap-[70px] items-center pt-[100px] px-20 pb-[60px]">
        {/* LEFT — message */}
        <div>
          {/* Done pill */}
          <motion.div
            custom={0} variants={fadeUpVariant} initial="hidden" animate="show"
            className="inline-flex items-center gap-2.5 mb-[22px] px-3 py-1.5 rounded-pill text-sm font-bold tracking-[0.08em] text-emerald"
            style={{
              background: "rgba(46,111,74,0.22)",
              boxShadow: "inset 0 0 0 1px rgba(46,111,74,0.4)",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l4 4 10-10" />
            </svg>
            DONE FOR TODAY
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1} variants={fadeUpVariant} initial="hidden" animate="show"
            className="display m-0 text-display-xl leading-[0.95] tracking-[-0.03em]"
          >
            See you<br />
            <span className="text-spot italic">tomorrow.</span>
          </motion.h1>

          {/* Body copy */}
          <motion.p
            custom={2} variants={fadeUpVariant} initial="hidden" animate="show"
            className="text-md leading-[1.55] text-paper-80 max-w-[40ch] mt-[22px] mb-7"
          >
            You played today's house. The next one drops at midnight Eastern — same time as the rest of the world.
          </motion.p>

          {/* Countdown card */}
          <motion.div
            custom={3} variants={fadeUpVariant} initial="hidden" animate="show"
            className="py-[22px] px-6 rounded-4 bg-paper-08 flex items-center justify-between mb-[22px]"
            style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)" }}
          >
            <div>
              <div className="eyebrow text-paper-60 mb-1.5">
                NEXT HOUSE IN
              </div>
              <NextDailyCountdown size={40} color="var(--spot)" />
            </div>
            <button
              className="btn px-4 py-3 text-sm rounded-[10px] bg-[rgba(247,244,238,0.1)] text-paper"
              style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.25)" }}
            >
              Notify me
            </button>
          </motion.div>

          {/* Buttons */}
          <motion.div className="flex gap-3"
            custom={4} variants={fadeUpVariant} initial="hidden" animate="show"
          >
            <button
              className="btn btn-primary py-4 px-[22px] text-sm rounded-2"
              onClick={onPractice}
            >
              Play practice rounds
            </button>
            <button
              className="btn py-4 px-[22px] text-sm rounded-2 bg-[rgba(247,244,238,0.08)] text-paper"
              onClick={onStats}
              style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)" }}
            >
              See your stats
            </button>
          </motion.div>
        </div>

        {/* RIGHT — today's locked card */}
        <motion.div
          custom={1} variants={fadeUpVariant} initial="hidden" animate="show"
        >
          <div className="eyebrow mb-3.5 text-paper-60">
            Today's result · #{dailyNumber}
          </div>

          {/* Photo card */}
          <div
            className="relative aspect-[4/3] rounded-4 overflow-hidden bg-paper-08 mb-4"
            style={{ boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(247,244,238,0.1)" }}
          >
            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)" }}
            />
            {/* PLAYED badge */}
            <div className="absolute top-[18px] right-[18px] px-3 py-1.5 rounded-pill bg-paper text-ink text-xs font-bold tracking-[0.1em] flex items-center gap-1.5">
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              PLAYED
            </div>
            {result && (
              <div className="absolute bottom-[18px] left-5 right-5 text-paper">
                <div className="display text-lg italic mb-1">
                  {result.streetAddress}
                </div>
                <div className="text-sm opacity-85">
                  {result.city}, {result.state}
                </div>
              </div>
            )}
          </div>

          {/* Quick stat tiles */}
          {result ? (
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { l: "YOUR GUESS", v: formatPrice(result.guess) },
                { l: "ACTUAL", v: formatPrice(result.actual), accent: true },
                { l: "ACCURACY", v: `${result.accuracy}%` },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2 bg-paper-08"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}
                >
                  <div className="eyebrow text-xs mb-1 text-paper-60">
                    {s.l}
                  </div>
                  <div className={`display tnum text-lg italic ${s.accent ? "text-spot" : "text-paper"}`}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-3.5 rounded-2 bg-paper-08 text-paper-40 text-sm"
              style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}
            >
              Result details unavailable
            </div>
          )}

          {/* Streak summary */}
          {storage.currentStreak > 0 && (
            <div className="mt-3.5 py-2.5 px-3.5 rounded-[10px] bg-[rgba(255,92,57,0.12)] flex items-center gap-2 text-accent text-sm font-bold">
              🔥 {storage.currentStreak} day streak
              {storage.bestStreak > storage.currentStreak && (
                <span className="text-paper-40 font-normal text-sm">
                  · best: {storage.bestStreak}
                </span>
              )}
            </div>
          )}

          {/* View map link — opens the revealed-mode modal */}
          {canShowMap && (
            <button
              onClick={() => setMapOpen(true)}
              className="btn mt-3.5 w-full py-3 px-3.5 text-sm rounded-[10px] bg-paper-08 text-paper flex items-center justify-between gap-2 cursor-pointer"
              style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.18)" }}
            >
              <span className="flex items-center gap-2">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                View map of today's house
              </span>
              <span className="opacity-[0.55] text-sm">↗</span>
            </button>
          )}
        </motion.div>
      </div>

      {/* Map modal — revealed mode */}
      {mapOpen && canShowMap && listing && result && listing.map && (
        <MapExpandedModal
          listingId={listing.id}
          city={listing.city}
          state={listing.state}
          neighborhood={listing.neighborhood}
          map={listing.map}
          revealed
          exact={result.exact ?? null}
          streetAddress={result.streetAddress}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
