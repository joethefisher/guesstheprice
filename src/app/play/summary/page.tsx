"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, tierEmoji } from "@/lib/scoring";
import type { AccuracyTier } from "@/lib/scoring";

interface PlayedRound {
  listingId: string;
  listingSnapshot: {
    neighborhood?: string | null;
    city: string;
    state: string;
    photos: { url: string }[];
  };
  result: {
    guess: number;
    score: number;
    tier: AccuracyTier;
    actualPrice: number;
    streetAddress: string;
  };
}

export default function SummaryPage() {
  const [history, setHistory] = useState<PlayedRound[]>([]);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pricetag-history");
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  if (!history.length) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-center space-y-4">
          <p className="text-ink/60">No game in progress.</p>
          <Link
            href="/play"
            className="inline-block px-6 py-3 bg-accent text-paper rounded-xl"
          >
            Start a game
          </Link>
        </div>
      </main>
    );
  }

  const totalScore = history.reduce((sum, r) => sum + r.result.score, 0);
  const avgScore = Math.round(totalScore / history.length);
  const bestRound = history.reduce(
    (best, r, i) => (r.result.score > best.result.score ? { ...r, idx: i } : best),
    { ...history[0], idx: 0 }
  );
  const worstRound = history.reduce(
    (worst, r, i) =>
      r.result.score < worst.result.score ? { ...r, idx: i } : worst,
    { ...history[0], idx: 0 }
  );

  const shareText = buildShareText(history, totalScore);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen px-4 md:px-10 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-3">
          <p className="caption text-ink/50">Game complete</p>
          <h1 className="font-display text-display-l md:text-display-xl font-semibold tracking-tight leading-none">
            {totalScore}
            <span className="text-ink/30">/{history.length * 100}</span>
          </h1>
          <p className="text-ink/60">
            <span className="tnum">{avgScore}</span> avg accuracy across{" "}
            <span className="tnum">{history.length}</span> rounds
          </p>
        </header>

        {/* Share tile preview */}
        <section className="bg-cream rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-card">
          <p className="caption text-ink/50">Share your result</p>
          <pre className="font-display text-2xl font-semibold whitespace-pre-wrap text-ink">
            {shareText}
          </pre>
          <button
            onClick={copyShare}
            className="px-6 py-3 bg-ink text-paper rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
          >
            {shared ? "Copied!" : "Copy result"}
          </button>
        </section>

        {/* Per-round breakdown */}
        <section className="space-y-4">
          <h2 className="caption text-ink/50">Round by round</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {history.map((r, i) => (
              <RoundRow
                key={i}
                round={i + 1}
                round_={r}
                isBest={i === bestRound.idx}
                isWorst={i === worstRound.idx && bestRound.idx !== worstRound.idx}
              />
            ))}
          </div>
        </section>

        {/* Best/worst callouts */}
        {bestRound.idx !== worstRound.idx && (
          <section className="grid md:grid-cols-2 gap-4">
            <Callout
              label="Your peak"
              copy={`Round ${bestRound.idx + 1}: ${bestRound.result.score}/100 in ${bestRound.listingSnapshot.city}.`}
              tone="moss"
            />
            <Callout
              label="We don't talk about"
              copy={`Round ${worstRound.idx + 1}: ${worstRound.result.score}/100 in ${worstRound.listingSnapshot.city}. Yikes.`}
              tone="flag"
            />
          </section>
        )}

        {/* CTAs */}
        <section className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            href="/play"
            className="flex-1 py-4 bg-accent text-paper font-semibold rounded-xl text-center hover:bg-ink transition-colors duration-300 ease-snappy"
          >
            Play again →
          </Link>
          <Link
            href="/"
            className="flex-1 py-4 border-2 border-ink/20 font-semibold rounded-xl text-center hover:border-ink transition-colors"
          >
            Home
          </Link>
        </section>
      </div>
    </main>
  );
}

function buildShareText(history: PlayedRound[], total: number): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
  const grid = history.map((r) => tierEmoji(r.result.tier)).join("");
  return `Pricetag · ${date}\n${grid}\n${total}/${history.length * 100}`;
}

function RoundRow({
  round,
  round_,
  isBest,
  isWorst
}: {
  round: number;
  round_: PlayedRound;
  isBest: boolean;
  isWorst: boolean;
}) {
  const photo = round_.listingSnapshot.photos[0]?.url;
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl bg-paper border ${
        isBest
          ? "border-moss/40"
          : isWorst
          ? "border-flag/40"
          : "border-ink/10"
      }`}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
        {photo && (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="caption text-ink/50">R{round}</span>
          <span className="text-sm truncate">{round_.listingSnapshot.city}</span>
        </div>
        <div className="text-xs text-ink/60 tnum mt-0.5">
          {formatPrice(round_.result.guess)} → {formatPrice(round_.result.actualPrice)}
        </div>
      </div>
      <div className="font-display text-2xl font-semibold tnum">
        {round_.result.score}
      </div>
    </div>
  );
}

function Callout({
  label,
  copy,
  tone
}: {
  label: string;
  copy: string;
  tone: "moss" | "flag";
}) {
  const color = tone === "moss" ? "text-moss" : "text-flag";
  const bg = tone === "moss" ? "bg-moss/5" : "bg-flag/5";
  return (
    <div className={`${bg} rounded-2xl p-5 space-y-1`}>
      <p className={`caption ${color}`}>{label}</p>
      <p className="text-sm">{copy}</p>
    </div>
  );
}
