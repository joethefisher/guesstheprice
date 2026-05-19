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
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: "var(--paper)", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        flex: "0 0 auto", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "18px 28px", zIndex: 5,
        borderBottom: "1px solid var(--rule)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Wordmark size={17} />
          <div style={{ width: 1, height: 18, background: "var(--rule)" }} />
          <DailyBadge dailyNumber={dailyNumber} />
          <span className="tnum" style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)" }}>
            {formatDateLabel(dateET)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {currentStreak > 0 && (
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(255,92,57,0.1)", color: "var(--accent)",
              fontSize: "var(--text-sm)", fontWeight: 700,
            }}>
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
      <div style={{
        flex: "1 1 auto", display: "grid",
        gridTemplateColumns: "minmax(0, 1.55fr) minmax(380px, 1fr)",
        padding: "0 28px 28px", minHeight: 0, gap: 28, overflow: "hidden",
      }}>
        {/* Photo */}
        <div style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          boxShadow: "0 10px 36px -16px rgba(0,0,0,0.35)",
          marginTop: 28,
        }}>
          <PhotoCarousel photos={listing.photos} />

          {/* ONE GUESS badge overlay */}
          <div style={{
            position: "absolute", top: 16, left: 16, zIndex: 3,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(15,17,13,0.78)", color: "var(--paper)",
            backdropFilter: "blur(10px)",
            boxShadow: "inset 0 0 0 1px rgba(255,214,107,0.4)",
          }}>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="var(--spot)">
              <path d="M8 0l2 5.5h6L11 9l2 6-5-3.5L3 15l2-6-5-3.5h6z" />
            </svg>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em" }}>
              ONE GUESS · NO DO-OVERS
            </span>
          </div>

          {/* Bottom info */}
          <div style={{
            position: "absolute", bottom: 18, left: 18, right: 18, zIndex: 3,
            color: "var(--paper)",
          }}>
            <div className="eyebrow" style={{ color: "var(--paper-mute)", marginBottom: 4 }}>
              {listing.city}, {listing.state}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{
          paddingTop: 28, display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}>
          {/* Property info */}
          <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: "1px solid var(--rule)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div className="eyebrow">Listed in {listing.city}</div>
              <YearSoldPill year={listing.yearSold} />
            </div>
            <h2 className="h3" style={{ marginBottom: 8, color: "var(--ink)" }}>
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
              <span style={{ color: "var(--ink-mute)" }}>{listing.city}, {listing.state}</span>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", marginTop: 12 }}>
              {listing.beds && <Stat icon={Icon.Bed} label="bd" value={listing.beds} />}
              {listing.baths && <Stat icon={Icon.Bath} label="ba" value={listing.baths} />}
              {listing.sqft && <Stat icon={Icon.Sqft} label="sqft" value={listing.sqft.toLocaleString()} />}
              {listing.yearBuilt && <Stat icon={Icon.Year} label="built" value={listing.yearBuilt} />}
            </div>
          </div>

          {/* Guess display */}
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Your <span style={{ color: "var(--accent)", fontWeight: 700 }}>only</span> guess
          </div>
          <div className="display tnum" style={{
            fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--ink)",
            letterSpacing: "-0.03em",
          }}>
            ${guess.toLocaleString()}
          </div>

          {/* Slider */}
          <div style={{ marginTop: 18 }}>
            <PriceSlider value={guess} onChange={handleSlider} />
          </div>

          {/* Warning banner */}
          <div style={{
            marginTop: 20, padding: "12px 14px", borderRadius: 10,
            background: "rgba(200,163,72,0.12)", color: "#7a6020",
            fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: 10,
            boxShadow: "inset 0 0 0 1px rgba(200,163,72,0.3)",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l11 19H1L12 2zm0 5l-7 12h14L12 7zm-1 4h2v4h-2zm0 5h2v2h-2z" />
            </svg>
            <span>Lock it in carefully — there's no second try until tomorrow.</span>
          </div>

          {/* Neighborhood map preview — sits between warning + CTA per spec */}
          {listing.map && (
            <div style={{ marginTop: 14 }}>
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
            <div style={{ marginTop: 8, color: "var(--accent)", fontSize: "var(--text-sm)" }}>{error}</div>
          )}

          {/* Submit CTA */}
          <div style={{ marginTop: "auto", paddingTop: 22 }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "22px", fontSize: "var(--text-md)", borderRadius: 14,
                boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 14px 32px -10px rgba(255,92,57,0.6)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
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
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(26,26,26,0.7)",
        backdropFilter: "blur(12px)",
        display: "grid", placeItems: "center",
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "var(--paper)", borderRadius: 20, padding: "32px 36px",
          width: 440, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <h2 className="h2" style={{ marginBottom: 12 }}>
          Forfeit today's house?
        </h2>
        <p className="body" style={{ color: "var(--ink-mute)", marginBottom: 28 }}>
          Your streak will reset to zero. You won't be able to play today's house again.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Keep playing
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              flex: 1, background: "#C8472D", color: "#fff",
              boxShadow: "none",
            }}
          >
            Yes, forfeit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
