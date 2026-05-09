"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PriceSlider } from "@/components/PriceSlider";
import { PropertyFacts } from "@/components/PropertyFacts";
import { ResultReveal } from "@/components/ResultReveal";
import type { AccuracyTier } from "@/lib/scoring";

const TOTAL_ROUNDS = 10;

interface Listing {
  id: string;
  neighborhood?: string | null;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqft?: number | null;
  lotSqft?: number | null;
  yearBuilt?: number | null;
  homeType?: string | null;
  photos: { url: string; caption?: string | null }[];
}

interface RoundResult {
  guess: number;
  score: number;
  tier: AccuracyTier;
  actualPrice: number;
  errorDollars: number;
  errorPct: number;
  reaction: string;
  subReaction: string;
  streetAddress: string;
}

interface PlayedRound {
  listingId: string;
  listingSnapshot: Listing;
  result: RoundResult;
}

type Phase = "loading" | "guessing" | "submitting" | "revealed";

export default function PlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [roundNumber, setRoundNumber] = useState(1);
  const [listing, setListing] = useState<Listing | null>(null);
  const [guess, setGuess] = useState(750_000);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [history, setHistory] = useState<PlayedRound[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async (excludeIds: string[]) => {
    setPhase("loading");
    setError(null);
    try {
      const url = `/api/listings${
        excludeIds.length ? `?exclude=${excludeIds.join(",")}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setListing(data);
      setGuess(750_000);
      setPhase("guessing");
    } catch (e) {
      setError("Couldn't load a home. Try refreshing.");
      console.error(e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchListing([]);
  }, [fetchListing]);

  async function handleSubmit() {
    if (!listing) return;
    setPhase("submitting");
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          guess
        })
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: RoundResult = await res.json();
      setResult(data);
      setPhase("revealed");
    } catch (e) {
      setError("Couldn't submit your guess. Try again.");
      setPhase("guessing");
      console.error(e);
    }
  }

  function handleNext() {
    if (!listing || !result) return;

    const newHistory = [
      ...history,
      { listingId: listing.id, listingSnapshot: listing, result }
    ];
    setHistory(newHistory);

    if (roundNumber >= TOTAL_ROUNDS) {
      // Stash results and route to summary
      sessionStorage.setItem("pricetag-history", JSON.stringify(newHistory));
      router.push("/play/summary");
      return;
    }

    setRoundNumber((n) => n + 1);
    setResult(null);
    fetchListing(newHistory.map((h) => h.listingId));
  }

  // Cumulative score in header
  const cumulativeScore = history.reduce((sum, h) => sum + h.result.score, 0);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="px-4 md:px-10 py-4 flex items-center justify-between border-b border-ink/10">
        <Link
          href="/"
          className="caption text-ink/60 hover:text-ink transition-colors"
        >
          ← Exit
        </Link>
        <div className="flex items-center gap-4">
          <div className="caption text-ink/60">
            Round{" "}
            <span className="text-ink tnum font-bold">{roundNumber}</span>
            <span className="text-ink/40 mx-1">/</span>
            <span className="tnum">{TOTAL_ROUNDS}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-ink/20" />
          <div className="hidden md:block caption text-ink/60">
            Score{" "}
            <span className="text-ink tnum font-bold">{cumulativeScore}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-cream">
        <div
          className="h-full bg-accent transition-all duration-500 ease-snappy"
          style={{
            width: `${((roundNumber - 1) / TOTAL_ROUNDS) * 100}%`
          }}
        />
      </div>

      {/* Main content */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-10 py-6 md:py-10">
        {phase === "loading" && <LoadingSkeleton />}

        {error && (
          <div className="text-center py-20">
            <p className="text-flag mb-4">{error}</p>
            <button
              onClick={() => fetchListing(history.map((h) => h.listingId))}
              className="px-6 py-3 bg-ink text-paper rounded-xl"
            >
              Try again
            </button>
          </div>
        )}

        {listing && (phase === "guessing" || phase === "submitting" || phase === "revealed") && (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
            {/* Left: photos */}
            <div className="space-y-6">
              <PhotoCarousel photos={listing.photos} />
              <PropertyFacts listing={listing} />
            </div>

            {/* Right: guess input */}
            <div className="lg:sticky lg:top-8 lg:self-start space-y-8">
              <PriceSlider
                value={guess}
                onChange={setGuess}
                disabled={phase === "submitting"}
              />

              <button
                onClick={handleSubmit}
                disabled={phase === "submitting"}
                className="w-full py-4 bg-accent text-paper font-semibold rounded-xl hover:bg-ink transition-colors duration-300 ease-snappy text-lg disabled:opacity-50 disabled:cursor-wait"
              >
                {phase === "submitting" ? "Locking it in..." : "Lock it in →"}
              </button>

              <p className="text-center text-xs text-ink/40">
                You can use the slider, type a number, or use arrow keys.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Reveal modal */}
      {phase === "revealed" && result && (
        <ResultReveal
          guess={guess}
          actualPrice={result.actualPrice}
          score={result.score}
          tier={result.tier}
          reaction={result.reaction}
          subReaction={result.subReaction}
          streetAddress={result.streetAddress}
          errorDollars={result.errorDollars}
          onNext={handleNext}
          isLastRound={roundNumber >= TOTAL_ROUNDS}
        />
      )}
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12 animate-pulse">
      <div className="space-y-6">
        <div className="aspect-[4/3] md:aspect-[16/10] bg-cream rounded-2xl" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 bg-cream rounded" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-cream rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-32 bg-cream rounded-xl" />
        <div className="h-14 bg-cream rounded-xl" />
      </div>
    </div>
  );
}
