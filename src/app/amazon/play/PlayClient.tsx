"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AmazonProduct } from "@/lib/amazon-products";

type Round = {
  product: AmazonProduct;
  guess: number;
  accuracy: number; // 0-100
  points: number;
};

const ROUNDS_PER_GAME = 8;

// Logarithmic slider — $5 to $10,000 spans 4 orders of magnitude. Linear
// would put 90% of the range at one tail. Log keeps the cheap and expensive
// items both navigable.
const SLIDER_MIN = Math.log10(5);
const SLIDER_MAX = Math.log10(10000);

function sliderToPrice(t: number): number {
  const log = SLIDER_MIN + t * (SLIDER_MAX - SLIDER_MIN);
  const raw = Math.pow(10, log);
  // Snap to nice numbers
  if (raw < 10) return Math.round(raw * 2) / 2; // $0.50 steps
  if (raw < 100) return Math.round(raw);
  if (raw < 1000) return Math.round(raw / 5) * 5;
  return Math.round(raw / 50) * 50;
}

function formatPrice(p: number): string {
  return p.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: p < 10 ? 2 : 0,
  });
}

function bucketLabel(accuracy: number): string {
  if (accuracy >= 90) return "Bullseye";
  if (accuracy >= 80) return "Strong";
  if (accuracy >= 70) return "Decent";
  if (accuracy >= 60) return "Getting warmer";
  if (accuracy >= 50) return "Coin flip";
  return "Wildly off";
}

function bucketColor(accuracy: number): string {
  if (accuracy >= 90) return "#2E6F4A";
  if (accuracy >= 80) return "#4A6741";
  if (accuracy >= 70) return "#C8A348";
  if (accuracy >= 60) return "#FF9800";
  if (accuracy >= 50) return "#FF5722";
  return "#9E9E9E";
}

export default function PlayClient({ deck }: { deck: AmazonProduct[] }) {
  const rounds = useMemo(() => deck.slice(0, ROUNDS_PER_GAME), [deck]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [sliderT, setSliderT] = useState(0.4);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<Round[]>([]);

  const product = rounds[roundIdx];
  const guess = sliderToPrice(sliderT);
  const isGameOver = roundIdx >= rounds.length;

  if (isGameOver) {
    const total = history.reduce((s, r) => s + r.points, 0);
    const max = history.length * 100;
    const pct = max > 0 ? Math.round((total / max) * 100) : 0;
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="display text-4xl text-ink mb-3">Game over</h1>
        <p className="text-ink-soft text-base mb-8">
          {total} of {max} points. Calibration: {pct}%.
        </p>
        <ul className="space-y-3 mb-10">
          {history.map((r, i) => (
            <li
              key={r.product.id}
              className="flex items-center justify-between border-b border-rule pb-3"
            >
              <div className="flex-1">
                <div className="display text-base text-ink">
                  {r.product.fullTitle}
                </div>
                <div className="text-ink-mute text-xs mt-1">
                  Guessed {formatPrice(r.guess)} · Actual {formatPrice(r.product.priceUsd)}
                </div>
              </div>
              <div
                className="display text-lg pl-4 text-right"
                style={{ color: bucketColor(r.accuracy) }}
              >
                {Math.round(r.accuracy)}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <Link
            href="/amazon/play"
            className="px-5 py-3 bg-ink text-paper-strong rounded-md hover:bg-accent display text-base"
          >
            Play again
          </Link>
          <Link
            href="/amazon"
            className="px-5 py-3 border border-ink text-ink rounded-md hover:bg-cream display text-base"
          >
            Back to landing
          </Link>
        </div>
      </main>
    );
  }

  function lockIn() {
    setRevealed(true);
  }

  function nextRound() {
    const pctOff = Math.abs(guess - product.priceUsd) / product.priceUsd;
    const accuracy = Math.max(0, (1 - pctOff) * 100);
    const points = Math.max(0, Math.round((1 - pctOff) * 100));
    const round: Round = { product, guess, accuracy, points };
    setHistory([...history, round]);
    setRoundIdx(roundIdx + 1);
    setRevealed(false);
    setSliderT(0.4);
  }

  const accuracy = revealed
    ? Math.max(0, (1 - Math.abs(guess - product.priceUsd) / product.priceUsd) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between mb-6 text-ink-mute text-sm">
        <Link href="/amazon" className="hover:text-ink">← back</Link>
        <span>
          Round {roundIdx + 1} of {rounds.length}
        </span>
      </div>

      {/* Photo */}
      <div
        className="w-full aspect-[16/10] rounded-lg overflow-hidden mb-6"
        style={{
          background: `${product.bandColor} url(${product.photos[0]}) center/cover no-repeat`,
        }}
      />

      {/* Title — only redacted version pre-reveal */}
      <div className="caption text-ink-mute text-xs uppercase tracking-widest mb-2">
        {product.category}
      </div>
      <h1 className="display text-2xl text-ink mb-3">{product.displayTitle}</h1>
      <p className="text-ink-soft text-sm mb-8">{product.blurb}</p>

      {/* Slider */}
      <div className="mb-8">
        <label className="caption text-ink-mute text-xs uppercase tracking-widest mb-2 block">
          Your guess
        </label>
        <div className="display text-4xl text-ink mb-4 tnum">
          {formatPrice(guess)}
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(sliderT * 1000)}
          onChange={(e) => setSliderT(parseInt(e.target.value, 10) / 1000)}
          disabled={revealed}
          className="w-full"
        />
        <div className="flex justify-between text-ink-quiet text-xs mt-2">
          <span>$5</span>
          <span>$100</span>
          <span>$1,000</span>
          <span>$10,000</span>
        </div>
      </div>

      {/* Reveal vs Submit */}
      {!revealed ? (
        <button
          onClick={lockIn}
          className="w-full px-5 py-4 bg-ink text-paper-strong rounded-md hover:bg-accent display text-lg"
        >
          Lock in {formatPrice(guess)}
        </button>
      ) : (
        <div className="border-t border-rule pt-6 mt-2">
          <div className="caption text-ink-mute text-xs uppercase tracking-widest mb-2">
            Actual price
          </div>
          <div className="display text-5xl text-ink mb-4 tnum">
            {formatPrice(product.priceUsd)}
          </div>
          <div
            className="display text-xl mb-2"
            style={{ color: bucketColor(accuracy) }}
          >
            {Math.round(accuracy)}% — {bucketLabel(accuracy)}
          </div>
          <div className="text-ink-soft text-sm mb-2">
            <strong>{product.fullTitle}</strong> by {product.brand}
          </div>
          {product.rating && (
            <div className="text-ink-mute text-xs mb-6">
              {product.rating}★ · {product.reviewCount?.toLocaleString()} reviews
              {product.badge && ` · ${product.badge}`}
            </div>
          )}
          <button
            onClick={nextRound}
            className="w-full px-5 py-4 bg-ink text-paper-strong rounded-md hover:bg-accent display text-lg"
          >
            {roundIdx + 1 < rounds.length ? "Next round →" : "See your score"}
          </button>
        </div>
      )}
    </main>
  );
}
