"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/scoring";
import type { AccuracyTier } from "@/lib/scoring";

interface Props {
  guess: number;
  actualPrice: number;
  score: number;
  tier: AccuracyTier;
  reaction: string;
  subReaction: string;
  streetAddress: string;
  errorDollars: number;
  onNext: () => void;
  isLastRound?: boolean;
}

const TIER_COLORS: Record<AccuracyTier, string> = {
  expert: "text-moss",
  nailed: "text-moss",
  solid: "text-ink",
  ballpark: "text-ink",
  off: "text-flag",
  yikes: "text-flag"
};

export function ResultReveal({
  guess,
  actualPrice,
  score,
  tier,
  reaction,
  subReaction,
  streetAddress,
  errorDollars,
  onNext,
  isLastRound = false
}: Props) {
  // Number ticker animation
  const [displayedActual, setDisplayedActual] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedActual(Math.round(eased * actualPrice));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [actualPrice]);

  const errorAbs = Math.abs(errorDollars);
  const errorSign = errorDollars > 0 ? "over" : "under";
  const accuracyPct = Math.max(0, score);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-md" />

      {/* Card */}
      <div className="relative bg-paper rounded-3xl shadow-lift max-w-lg w-full p-8 md:p-10 animate-ticker-up">
        {/* Reaction headline */}
        <div className="text-center mb-8">
          <p className="caption text-ink/50 mb-3">Round complete</p>
          <h2
            className={`font-display text-display-l font-semibold tracking-tight leading-none ${TIER_COLORS[tier]}`}
          >
            {reaction}
          </h2>
          <p className="text-ink/60 mt-3">{subReaction}</p>
        </div>

        {/* Compare guess vs actual */}
        <div className="bg-cream rounded-2xl p-6 space-y-4 mb-6">
          <div className="flex items-baseline justify-between">
            <span className="caption text-ink/50">Your guess</span>
            <span className="font-display text-2xl font-semibold tnum text-ink/60">
              {formatPrice(guess)}
            </span>
          </div>
          <div className="border-t border-ink/10" />
          <div className="flex items-baseline justify-between">
            <span className="caption text-ink/50">Actual</span>
            <span className="font-display text-3xl md:text-4xl font-semibold tnum text-accent">
              {formatPrice(displayedActual)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="caption text-ink/50">Off by</span>
            <span className="tnum text-ink/70">
              {formatPrice(errorAbs)} {errorSign}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="text-center mb-8">
          <p className="caption text-ink/50 mb-2">Score</p>
          <div className="font-display text-display-xl font-semibold tnum tracking-tight">
            {accuracyPct}
            <span className="text-ink/30">/100</span>
          </div>
        </div>

        {/* Address reveal */}
        <p className="text-center text-sm text-ink/50 mb-6">
          <span className="caption mr-2">Address</span>
          {streetAddress}
        </p>

        {/* CTA */}
        <button
          onClick={onNext}
          className="w-full py-4 bg-ink text-paper font-semibold rounded-xl hover:bg-accent transition-colors duration-300 ease-snappy text-lg"
        >
          {isLastRound ? "See results →" : "Next round →"}
        </button>
      </div>
    </div>
  );
}
