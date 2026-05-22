"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PriceSlider } from "@/components/PriceSlider";
import { RevealOverlay } from "@/components/RevealOverlay";
import { Wordmark } from "@/components/Wordmark";
import { RoundPill, StreakFlame, ComboFlame, Stat } from "@/components/GameChips";
import { YearSoldPill } from "@/components/YearSoldPill";
import { Icon } from "@/components/Icons";
import { MapPreviewCard } from "@/components/daily/map/MapPreviewCard";
import { DailyMapsProvider } from "@/components/daily/map/DailyMapsProvider";
import {
  formatPrice,
  comboMultiplier,
  nextCombo,
  type ListingPublic,
  type RoundResult,
  type SavedHome,
} from "@/lib/game";
import { popFromCache } from "@/lib/prefetch";
import { useSavedHomes } from "@/lib/saved-homes-client";

const TOTAL_ROUNDS = 5;

type GuessTab = "slider" | "type";

interface Props {
  /** Server-rendered first listing — present on a fresh /play visit, null if
   *  the server-side fetch failed. When present, round 1 renders immediately
   *  with no network round-trip. */
  initialListing: ListingPublic | null;
}

export default function PlayClient({ initialListing }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const gameIdRef = useRef<string | null>(null);
  const sessionId = useRef(crypto.randomUUID());

  // Game state
  const [roundIdx, setRoundIdx] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>(initialListing ? [initialListing.id] : []);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const { homes: savedHomes, add: addSavedHome, remove: removeSavedHome } = useSavedHomes();

  // Round state — round 1 starts pre-populated when the server provided one.
  const [listing, setListing] = useState<ListingPublic | null>(initialListing);
  const [loading, setLoading] = useState(!initialListing);
  const [listingError, setListingError] = useState(false);
  const [guess, setGuess] = useState(500_000);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RoundResult | null>(null);
  const [guessTab, setGuessTab] = useState<GuessTab>("slider");
  const [typeInput, setTypeInput] = useState("");

  // Load persisted state from localStorage on mount. (Saved-homes is loaded
  // by the useSavedHomes hook above — auth-aware, server-backed when signed in.)
  useEffect(() => {
    try {
      const s = localStorage.getItem("pricetag_streak");
      if (s) { const n = parseInt(s, 10); if (!isNaN(n)) setStreak(n); }
    } catch { /* storage disabled or corrupted */ }
  }, []);

  // Create a Game row up-front for every play session — anonymous or signed-in.
  // Anonymous rounds power the landing "around the world" aggregate; signed-in
  // rounds additionally feed the leaderboard.
  useEffect(() => {
    if (gameIdRef.current) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId.current }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.id) gameIdRef.current = d.id; })
      .catch(() => { /* non-critical — aggregates just won't record this session */ });
  }, []);

  const fetchListing = useCallback(
    async (exclude: string[]) => {
      setLoading(true);
      setListingError(false);
      setReveal(null);
      setHasInteracted(false);
      setGuess(500_000);
      setTypeInput("");
      try {
        // Rounds 2+: try the prefetched cache first for instant load.
        // (Round 1 is server-rendered; we only land here when advancing.)
        const cached = exclude.length === 0 ? popFromCache() : null;
        const data: ListingPublic = cached ?? await (async () => {
          const qs = exclude.length ? `?exclude=${exclude.join(",")}` : "";
          const res = await fetch(`/api/listings${qs}`);
          if (!res.ok) throw new Error("no listing");
          return res.json();
        })();
        setListing(data);
        setUsedIds((prev) => [...prev, data.id]);
      } catch {
        setListingError(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch only if the server didn't pre-populate a first listing.
  useEffect(() => {
    if (initialListing) return;
    fetchListing([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!listing || submitting || !hasInteracted) return;
    setSubmitting(true);
    setScoreError(null);
    try {
      const finalGuess =
        guessTab === "type" ? parsePrice(typeInput) ?? guess : guess;
      const scoreBody: Record<string, unknown> = { listingId: listing.id, guess: finalGuess };
      if (gameIdRef.current) {
        scoreBody.gameId = gameIdRef.current;
        scoreBody.roundNumber = roundIdx + 1;
      }
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreBody),
      });
      if (!res.ok) throw new Error("score_api_error");
      const data = await res.json();
      if (data.score == null || !data.tier || data.actualPrice == null) {
        throw new Error("invalid_response");
      }
      const multiplier = comboMultiplier(combo);
      const pointsRaw = data.score;
      const finalScore = Math.round(pointsRaw * multiplier);
      const newCombo = nextCombo(combo, data.errorPct);
      const comboBrokenFrom = combo >= 3 && newCombo === 0 ? multiplier : null;
      setCombo(newCombo);
      const result: RoundResult = {
        listing,
        guess: finalGuess,
        score: finalScore,
        pointsRaw,
        multiplier,
        comboBrokenFrom,
        tier: data.tier,
        errorPct: data.errorPct,
        errorDollars: data.errorDollars,
        actualPrice: data.actualPrice,
        streetAddress: data.streetAddress,
        reaction: data.reaction,
        exact: data.exact ?? null,
      };
      setReveal(result);
      setHistory((prev) => [...prev, result]);
    } catch {
      setScoreError("Couldn't score your guess — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    const nextRound = roundIdx + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      safeSetItem("pricetag_streak", String(newStreak));
      // Trim photos to 1 per listing — URL blows up with 5 rounds × 20 photos each
      const summaryHistory = history.map((r) => ({
        ...r,
        listing: { ...r.listing, photos: r.listing.photos.slice(0, 1) },
      }));
      const finalScore = history.reduce((s, r) => s + r.score, 0);
      safeSetItem(
        "pricetag_last_game",
        JSON.stringify({ history: summaryHistory, streak: newStreak })
      );
      // Complete game record for leaderboard
      if (gameIdRef.current) {
        fetch(`/api/games/${gameIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalScore: finalScore }),
        }).catch(() => { /* non-critical */ });
      }
      router.push("/play/summary");
      return;
    }
    setRoundIdx(nextRound);
    fetchListing(usedIds);
  }

  function handleHeaderSave() {
    if (!listing) return;
    // Toggle: clicking on an already-saved listing removes it.
    if (isAlreadySaved) {
      removeSavedHome(listing.id);
      return;
    }
    const accuracy =
      reveal ? Math.max(0, Math.round((1 - reveal.errorPct) * 100)) : null;
    addSavedHome({
      listingId: listing.id,
      neighborhood: listing.neighborhood,
      city: listing.city,
      state: listing.state,
      photoUrl: listing.photos[0]?.url ?? "",
      guess: reveal?.guess ?? null,
      actualPrice: reveal?.actualPrice ?? null,
      tier: reveal?.tier ?? null,
      accuracy,
      savedAt: Date.now(),
    });
  }

  // When the round reveals, upgrade any pre-reveal save with the score data
  // so the saved page renders the guess/accuracy/tier without a second click.
  // The hook's `add` is idempotent on listingId — re-adding replaces the entry,
  // and the server upsert preserves score data for signed-in users.
  useEffect(() => {
    if (!reveal || !listing) return;
    const existing = savedHomes.find((s) => s.listingId === listing.id);
    if (!existing || existing.actualPrice !== null) return;
    const accuracy = Math.max(0, Math.round((1 - reveal.errorPct) * 100));
    addSavedHome({
      ...existing,
      guess: reveal.guess,
      actualPrice: reveal.actualPrice,
      tier: reveal.tier,
      accuracy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, listing]);

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

  if (loading) return <DailyMapsProvider><PlaySkeleton /></DailyMapsProvider>;
  if (listingError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-paper">
        <div className="eyebrow">Connection issue</div>
        <h2 className="h2 text-ink">
          Couldn't load a listing.
        </h2>
        <p className="body text-ink-mute m-0">
          Check your connection and try again.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => fetchListing(usedIds)}
        >
          Try another home
        </button>
        <button
          className="btn btn-secondary text-sm"
          onClick={() => router.push("/")}
        >
          Back to home
        </button>
      </div>
    );
  }
  if (!listing) return null;

  return (
    <DailyMapsProvider>
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Top bar */}
      <header className="flex items-center justify-between px-7 py-4 shrink-0 border-b border-rule">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="cursor-pointer" aria-label="Go to home">
            <Wordmark size={18} />
          </button>
          <RoundPill current={roundIdx + 1} total={TOTAL_ROUNDS} />
          <ComboFlame key={combo} combo={combo} />
          {streak > 0 && <StreakFlame count={streak} />}
        </div>
        {history.length > 0 && (
          <div className="tnum text-sm font-bold text-ink absolute left-1/2 -translate-x-1/2">
            {history.reduce((s, r) => s + r.score, 0)}
            <span className="font-normal text-ink-mute ml-1">pts</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            className="btn-icon cursor-pointer"
            aria-label={isAlreadySaved ? "Remove saved home" : "Save home"}
            onClick={handleHeaderSave}
          >
            <Icon.Heart size={18} filled={isAlreadySaved} />
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
      <main className="flex-1 grid" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
        {/* Photo column */}
        <div className="relative p-7">
          <div className="h-full rounded-5 overflow-hidden">
            <PhotoCarousel photos={listing.photos} />
          </div>
        </div>

        {/* Guess panel */}
        <div className="flex flex-col pt-7 pr-8 pb-7 border-l border-rule">
          <div className="flex-1 overflow-y-auto pl-7">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="eyebrow">Listed in {listing.city}</div>
              <YearSoldPill year={listing.yearSold} />
            </div>
            <h2 className="h3 mb-4">
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
              className={`display tnum mb-4 text-display-l leading-none transition-colors duration-200 ${
                hasInteracted ? "text-ink" : "text-ink-quiet"
              }`}
            >
              {hasInteracted ? formatPrice(displayGuess) : "$———"}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 mb-4">
              {(["slider", "type"] as GuessTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGuessTab(tab)}
                  className={`caption rounded-pill px-3.5 py-1.5 text-xs font-semibold tracking-[0.1em] cursor-pointer transition-all duration-200 ${
                    guessTab === tab ? "bg-ink text-paper" : "bg-ink-06 text-ink-mute"
                  }`}
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
                className="tnum w-full px-4 py-3.5 rounded-2 border-[1.5px] border-rule bg-paper text-md font-semibold outline-none mt-2"
              />
            )}

            {/* Neighborhood map preview */}
            {listing.map && (
              <div className="mt-[18px]">
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
          </div>

          {/* CTA row */}
          <div className="flex flex-col gap-3 mt-6 pl-7">
            {scoreError && (
              <div className="text-sm text-flag font-medium">
                {scoreError}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!hasInteracted || submitting || (guessTab === "type" && !parsePrice(typeInput))}
              className="btn btn-primary text-md justify-between"
            >
              <span>{submitting ? "Scoring…" : "Lock it in"}</span>
              <span>→</span>
            </button>
            <button
              onClick={handleSkip}
              className="btn btn-secondary text-sm"
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
            onSave={addSavedHome}
            alreadySaved={isAlreadySaved}
          />
        )}
      </AnimatePresence>
    </div>
    </DailyMapsProvider>
  );
}

function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded or storage disabled */ }
}

function parsePrice(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) || n <= 0 ? null : n;
}

function PlaySkeleton() {
  return (
    <div className="min-h-screen grid bg-paper" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
      <div className="p-7">
        <div className="h-full bg-cream rounded-5" />
      </div>
      <div className="p-7">
        <div className="h-3 w-[40%] bg-cream rounded-md mb-4" />
        <div className="h-8 w-[80%] bg-cream rounded-lg mb-6" />
        <div className="h-16 w-[70%] bg-cream rounded-lg" />
      </div>
    </div>
  );
}

