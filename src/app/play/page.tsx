"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PriceSlider } from "@/components/PriceSlider";
import { RevealOverlay } from "@/components/RevealOverlay";
import { Wordmark } from "@/components/Wordmark";
import { RoundPill, StreakFlame, Stat } from "@/components/GameChips";
import { Icon } from "@/components/Icons";
import {
  formatPrice,
  type ListingPublic,
  type RoundResult,
  type SavedHome,
} from "@/lib/game";

const TOTAL_ROUNDS = 10;

type GuessTab = "slider" | "type";
type PlayTab = "photos" | "floorplan";

export default function PlayPage() {
  const router = useRouter();

  // Game state
  const [roundIdx, setRoundIdx] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [savedHomes, setSavedHomes] = useState<SavedHome[]>([]);

  // Round state
  const [listing, setListing] = useState<ListingPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState(500_000);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<RoundResult | null>(null);
  const [guessTab, setGuessTab] = useState<GuessTab>("slider");
  const [playTab, setPlayTab] = useState<PlayTab>("photos");
  const [typeInput, setTypeInput] = useState("");

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const s = localStorage.getItem("pricetag_streak");
    if (s) setStreak(parseInt(s, 10));
    const saved = localStorage.getItem("pricetag_saved");
    if (saved) setSavedHomes(JSON.parse(saved));
  }, []);

  const fetchListing = useCallback(
    async (exclude: string[]) => {
      setLoading(true);
      setReveal(null);
      setHasInteracted(false);
      setGuess(500_000);
      setTypeInput("");
      setPlayTab("photos");
      try {
        const qs = exclude.length ? `?exclude=${exclude.join(",")}` : "";
        const res = await fetch(`/api/listings${qs}`);
        if (!res.ok) throw new Error("no listing");
        const data = await res.json();
        setListing(data);
        setUsedIds((prev) => [...prev, data.id]);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchListing([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!listing || submitting || !hasInteracted) return;
    setSubmitting(true);
    try {
      const finalGuess =
        guessTab === "type" ? parsePrice(typeInput) ?? guess : guess;
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, guess: finalGuess }),
      });
      const data = await res.json();
      const result: RoundResult = {
        listing,
        guess: finalGuess,
        score: data.score,
        tier: data.tier,
        errorPct: data.errorPct,
        errorDollars: data.errorDollars,
        actualPrice: data.actualPrice,
        streetAddress: data.streetAddress,
        reaction: data.reaction,
      };
      setReveal(result);
      setHistory((prev) => [...prev, result]);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    const nextRound = roundIdx + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("pricetag_streak", String(newStreak));
      const finalHistory = history;
      router.push(
        `/play/summary?data=${encodeURIComponent(
          JSON.stringify({ history: finalHistory, streak: newStreak })
        )}`
      );
      return;
    }
    setRoundIdx(nextRound);
    fetchListing(usedIds);
  }

  function handleSave(home: SavedHome) {
    const updated = [
      home,
      ...savedHomes.filter((s) => s.listingId !== home.listingId),
    ];
    setSavedHomes(updated);
    localStorage.setItem("pricetag_saved", JSON.stringify(updated));
  }

  function handleSkip() {
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      router.push("/");
      return;
    }
    setRoundIdx((i) => i + 1);
    fetchListing(usedIds);
  }

  const displayGuess =
    guessTab === "type" ? parsePrice(typeInput) ?? guess : guess;
  const isAlreadySaved = listing
    ? savedHomes.some((s) => s.listingId === listing.id)
    : false;

  if (loading) return <PlaySkeleton />;
  if (!listing) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--paper)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-7 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <div className="flex items-center gap-4">
          <Wordmark size={18} />
          <RoundPill current={roundIdx + 1} total={TOTAL_ROUNDS} />
          {streak > 0 && <StreakFlame count={streak} />}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-icon" aria-label="Save home">
            <Icon.Heart size={18} />
          </button>
          <button
            className="btn-icon"
            aria-label="Exit game"
            onClick={() => router.push("/")}
          >
            <Icon.X size={18} />
          </button>
        </div>
      </header>

      {/* Two-column game layout */}
      <main
        className="flex-1 grid"
        style={{ gridTemplateColumns: "1.55fr 1fr" }}
      >
        {/* Photo column */}
        <div className="relative" style={{ padding: 28 }}>
          {/* Tab group overlay */}
          <div
            className="absolute top-[42px] left-[42px] z-10 flex"
            style={{
              background: "rgba(247,244,238,0.88)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {(["photos", "floorplan"] as PlayTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setPlayTab(tab)}
                className="caption"
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  background:
                    playTab === tab ? "var(--ink)" : "transparent",
                  color:
                    playTab === tab ? "var(--paper)" : "var(--ink-mute)",
                  transition: "all 200ms cubic-bezier(0.32,0.72,0,1)",
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {tab === "photos" ? "Photos" : "Floor plan"}
              </button>
            ))}
          </div>

          <div style={{ height: "100%", borderRadius: 18, overflow: "hidden" }}>
            {playTab === "photos" ? (
              <PhotoCarousel photos={listing.photos} />
            ) : (
              <FloorPlanPlaceholder />
            )}
          </div>
        </div>

        {/* Guess panel */}
        <div
          className="flex flex-col"
          style={{
            padding: "28px 32px 28px 0",
            borderLeft: "1px solid var(--rule)",
          }}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{ paddingLeft: 28 }}
          >
            <div className="eyebrow mb-2">Listed in {listing.city}</div>
            <h2
              className="display m-0 mb-4"
              style={{ fontSize: 26, lineHeight: 1.15 }}
            >
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
              {listing.city}, {listing.state}
            </h2>

            {/* Property stats */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
              <Stat
                icon={Icon.Bed}
                label="beds"
                value={listing.beds === 0 ? "Studio" : listing.beds}
              />
              <Stat icon={Icon.Bath} label="baths" value={listing.baths} />
              {listing.sqft && (
                <Stat
                  icon={Icon.Sqft}
                  label="sqft"
                  value={listing.sqft.toLocaleString()}
                />
              )}
              {listing.yearBuilt && (
                <Stat icon={Icon.Year} label="built" value={listing.yearBuilt} />
              )}
              {listing.lotSqft && (
                <Stat
                  icon={Icon.Lot}
                  label="lot sqft"
                  value={listing.lotSqft.toLocaleString()}
                />
              )}
            </div>

            <hr className="hairline mb-5" />

            {/* Guess display */}
            <div className="eyebrow mb-2">Your guess</div>
            <div
              className="display tnum mb-4"
              style={{
                fontSize: 56,
                color: hasInteracted ? "var(--ink)" : "var(--ink-quiet)",
                lineHeight: 1,
                transition: "color 200ms ease",
              }}
            >
              {hasInteracted ? formatPrice(displayGuess) : "$———"}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 mb-4">
              {(["slider", "type"] as GuessTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGuessTab(tab)}
                  className="caption"
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    background:
                      guessTab === tab
                        ? "var(--ink)"
                        : "rgba(26,26,26,0.06)",
                    color:
                      guessTab === tab ? "var(--paper)" : "var(--ink-mute)",
                    transition: "all 200ms cubic-bezier(0.32,0.72,0,1)",
                    cursor: "pointer",
                  }}
                >
                  {tab === "slider" ? "Slider" : "Type a number"}
                </button>
              ))}
            </div>

            {guessTab === "slider" ? (
              <PriceSlider
                value={guess}
                onChange={(v) => {
                  setGuess(v);
                  setHasInteracted(true);
                }}
                locked={submitting}
              />
            ) : (
              <input
                type="text"
                inputMode="numeric"
                value={typeInput}
                onChange={(e) => {
                  setTypeInput(e.target.value);
                  if (parsePrice(e.target.value)) setHasInteracted(true);
                }}
                placeholder="Enter price (e.g. 1250000)"
                aria-label="Enter your price guess"
                className="tnum"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid var(--rule)",
                  background: "var(--paper)",
                  fontSize: 18,
                  fontWeight: 600,
                  outline: "none",
                  marginTop: 8,
                }}
              />
            )}
          </div>

          {/* CTA row */}
          <div
            className="flex flex-col gap-3 mt-6"
            style={{ paddingLeft: 28 }}
          >
            <button
              onClick={handleSubmit}
              disabled={!hasInteracted || submitting}
              className="btn btn-primary"
              style={{ fontSize: 16, justifyContent: "space-between" }}
            >
              <span>{submitting ? "Scoring…" : "Lock it in"}</span>
              <span>→</span>
            </button>
            <button
              onClick={handleSkip}
              className="btn btn-secondary"
              style={{ fontSize: 14 }}
            >
              Skip
            </button>
          </div>
        </div>
      </main>

      {/* Reveal overlay */}
      <AnimatePresence>
        {reveal && listing && (
          <RevealOverlay
            key="reveal"
            result={reveal}
            listing={listing}
            roundNumber={roundIdx + 1}
            totalRounds={TOTAL_ROUNDS}
            onNext={handleNext}
            onSave={handleSave}
            alreadySaved={isAlreadySaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function parsePrice(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) || n <= 0 ? null : n;
}

function PlaySkeleton() {
  return (
    <div
      className="min-h-screen grid"
      style={{
        gridTemplateColumns: "1.55fr 1fr",
        background: "var(--paper)",
      }}
    >
      <div style={{ padding: 28 }}>
        <div
          style={{
            height: "100%",
            background: "var(--cream)",
            borderRadius: 18,
          }}
        />
      </div>
      <div style={{ padding: "28px 32px 28px 28px" }}>
        <div
          style={{
            height: 12,
            width: "40%",
            background: "var(--cream)",
            borderRadius: 6,
            marginBottom: 16,
          }}
        />
        <div
          style={{
            height: 32,
            width: "80%",
            background: "var(--cream)",
            borderRadius: 8,
            marginBottom: 24,
          }}
        />
        <div
          style={{
            height: 64,
            width: "70%",
            background: "var(--cream)",
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}

function FloorPlanPlaceholder() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-4"
      style={{
        background: "var(--paper)",
        border: "1.5px dashed var(--rule)",
        borderRadius: 18,
      }}
    >
      <svg
        width={120}
        height={90}
        viewBox="0 0 120 90"
        fill="none"
        stroke="var(--ink-quiet)"
        strokeWidth="1.5"
      >
        <rect x="10" y="10" width="100" height="70" rx="2" />
        <path d="M10 40h40M50 10v30M80 40h30M80 10v30M10 60h100" />
        <rect x="20" y="48" width="22" height="22" />
        <rect x="60" y="48" width="40" height="22" />
      </svg>
      <p className="eyebrow" style={{ margin: 0 }}>
        Floor plan unavailable
      </p>
    </div>
  );
}
