"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { PriceSlider } from "@/components/PriceSlider";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Stat } from "@/components/GameChips";
import { YearSoldPill } from "@/components/YearSoldPill";
import { Icon } from "@/components/Icons";
import { DailyBadge } from "./DailyShared";
import { MapPreviewCard } from "./map/MapPreviewCard";
import type { ListingPublic } from "@/lib/game";

interface Props {
  listing: ListingPublic;
  dailyNumber: number;
  dateET: string;
  currentStreak: number;
  onSubmit: (
    guess: number,
    scoreResponse: {
      actualPrice: number;
      score: number;
      errorPct: number;
      streetAddress: string;
      exact?: { lat: number; lng: number } | null;
    }
  ) => void;
  onExit: () => void;
}

function formatDateLabel(dateET: string): string {
  if (!dateET) return "";
  const d = new Date(dateET + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function DailyPlay({
  listing,
  dailyNumber,
  dateET,
  currentStreak,
  onSubmit,
  onExit,
}: Props) {
  const [guess, setGuess] = useState(500_000);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForfeit, setShowForfeit] = useState(false);

  const handleSlider = useCallback((v: number) => {
    setGuess(v);
    setHasInteracted(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, guess }),
      });
      if (!res.ok) throw new Error("score error");
      const data = await res.json();
      onSubmit(guess, data);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }, [listing.id, guess, submitting, onSubmit]);

  return (
    <div className="relative w-full h-full bg-paper overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-7 py-[18px] z-[5] border-b border-rule">
        <div className="flex items-center gap-3.5">
          <Wordmark size={17} />
          <div className="w-px h-[18px] bg-rule" />
          <DailyBadge dailyNumber={dailyNumber} />
          <span className="tnum text-sm text-ink-mute">
            {formatDateLabel(dateET)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {currentStreak > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-[rgba(255,92,57,0.1)] text-accent text-sm font-bold">
              <Icon.Flame size={13} />
              <span className="tnum">{currentStreak} day streak</span>
            </span>
          )}
          <button
            className="btn btn-icon"
            onClick={() => setShowForfeit(true)}
            aria-label="Exit"
          >
            <Icon.X size={16} />
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div
        className="flex-1 grid px-7 pb-7 min-h-0 gap-7 overflow-hidden"
        style={{ gridTemplateColumns: "minmax(0, 1.55fr) minmax(380px, 1fr)" }}
      >
        {/* Photo */}
        <div className="relative rounded-5 overflow-hidden shadow-photo mt-7">
          <PhotoCarousel photos={listing.photos} />

          {/* ONE GUESS badge overlay */}
          <div
            className="absolute top-4 left-4 z-[3] flex items-center gap-2 px-3.5 py-2 rounded-pill text-paper"
            style={{
              background: "rgba(15,17,13,0.78)",
              backdropFilter: "blur(10px)",
              boxShadow: "inset 0 0 0 1px rgba(255,214,107,0.4)",
            }}
          >
            <svg aria-hidden="true" width={12} height={12} viewBox="0 0 16 16" fill="var(--spot)">
              <path d="M8 0l2 5.5h6L11 9l2 6-5-3.5L3 15l2-6-5-3.5h6z" />
            </svg>
            <span className="text-xs font-bold tracking-[0.1em]">
              ONE GUESS · NO DO-OVERS
            </span>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-[18px] left-[18px] right-[18px] z-[3] text-paper">
            <div className="eyebrow text-paper-60 mb-1">
              {listing.city}, {listing.state}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="pt-7 flex flex-col overflow-y-auto">
          {/* Property info */}
          <div className="pb-[18px] mb-[18px] border-b border-rule">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="eyebrow">Listed in {listing.city}</div>
              <YearSoldPill year={listing.yearSold} />
            </div>
            <h2 className="h3 mb-2 text-ink">
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
              <span className="text-ink-mute">{listing.city}, {listing.state}</span>
            </h2>
            <div className="flex flex-wrap gap-x-[18px] gap-y-2.5 mt-3">
              {listing.beds && <Stat icon={Icon.Bed} label="bd" value={listing.beds} />}
              {listing.baths && <Stat icon={Icon.Bath} label="ba" value={listing.baths} />}
              {listing.sqft && <Stat icon={Icon.Sqft} label="sqft" value={listing.sqft.toLocaleString()} />}
              {listing.yearBuilt && <Stat icon={Icon.Year} label="built" value={listing.yearBuilt} />}
            </div>
          </div>

          {/* Guess display */}
          <div className="eyebrow mb-1.5">
            Your <span className="text-accent font-bold">only</span> guess
          </div>
          <div className="display tnum text-display-l leading-none text-ink tracking-[-0.03em]">
            ${guess.toLocaleString()}
          </div>

          {/* Slider */}
          <div className="mt-[18px]">
            <PriceSlider value={guess} onChange={handleSlider} />
          </div>

          {/* Warning banner */}
          <div
            className="mt-5 px-3.5 py-3 rounded-[10px] text-sm flex items-center gap-2.5"
            style={{
              background: "rgba(200,163,72,0.12)",
              color: "#7a6020",
              boxShadow: "inset 0 0 0 1px rgba(200,163,72,0.3)",
            }}
          >
            <svg aria-hidden="true" width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l11 19H1L12 2zm0 5l-7 12h14L12 7zm-1 4h2v4h-2zm0 5h2v2h-2z" />
            </svg>
            <span>Lock it in carefully — there's no second try until tomorrow.</span>
          </div>

          {/* Neighborhood map preview — sits between warning + CTA per spec */}
          {listing.map && (
            <div className="mt-3.5">
              <MapPreviewCard
                listingId={listing.id}
                city={listing.city}
                state={listing.state}
                neighborhood={listing.neighborhood}
                map={listing.map}
                revealed={false}
              />
            </div>
          )}

          {error && (
            <div className="mt-2 text-accent text-sm">{error}</div>
          )}

          {/* Submit CTA */}
          <div className="mt-auto pt-[22px]">
            <button
              className="btn btn-primary w-full p-[22px] text-md rounded-3 flex items-center justify-between"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 32px -10px rgba(255,92,57,0.6)" }}
            >
              <span>{submitting ? "Locking in…" : "Lock in my final answer"}</span>
              {!submitting && <Icon.Arrow size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Forfeit confirm modal */}
      <AnimatePresence>
        {showForfeit && (
          <ForfeitModal
            onCancel={() => setShowForfeit(false)}
            onConfirm={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ForfeitModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 grid place-items-center bg-ink-70"
      style={{ backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-paper rounded-6 px-9 py-8 w-[440px] shadow-modal text-center"
      >
        <h2 className="h2 mb-3">
          Forfeit today's house?
        </h2>
        <p className="body text-ink-mute mb-7">
          Your streak will reset to zero. You won't be able to play today's house again.
        </p>
        <div className="flex gap-2.5">
          <button
            className="btn btn-secondary flex-1"
            onClick={onCancel}
          >
            Keep playing
          </button>
          <button
            className="btn flex-1 bg-flag text-white shadow-none"
            onClick={onConfirm}
          >
            Yes, forfeit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
