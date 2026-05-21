"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { Icon } from "@/components/Icons";
import {
  formatPrice,
  formatDelta,
  tierEmoji,
  type RoundResult,
} from "@/lib/game";

function SummaryContent() {
  const router = useRouter();
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pricetag_last_game");
    if (!raw) { router.push("/"); return; }
    try {
      const parsed = JSON.parse(raw);
      setHistory(parsed.history ?? []);
      setStreak(parsed.streak ?? 0);
    } catch {
      router.push("/");
    }
  }, [router]);

  const totalScore = useMemo(
    () => history.reduce((sum, r) => sum + r.score, 0),
    [history]
  );

  const avgAccuracy = useMemo(() => {
    if (!history.length) return 0;
    const avg = history.reduce((s, r) => s + Math.max(0, (1 - r.errorPct) * 100), 0) / history.length;
    return Math.round(avg);
  }, [history]);

  const bestRound = useMemo(
    () => history.reduce<RoundResult | null>((best, r) => (!best || r.score > best.score ? r : best), null),
    [history]
  );

  const worstRound = useMemo(
    () => history.reduce<RoundResult | null>((worst, r) => (!worst || r.score < worst.score ? r : worst), null),
    [history]
  );

  const emojiGrid = useMemo(
    () => history.map((r) => tierEmoji(r.tier)).join(""),
    [history]
  );

  const shareText = useMemo(
    () =>
      `Pricetag\n${emojiGrid}\n${avgAccuracy}% accurate · ${streak}-game streak\nguesstheprice.ai`,
    [emojiGrid, avgAccuracy, streak]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for HTTP or permission denied
      try {
        const ta = document.createElement("textarea");
        ta.value = shareText;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Both methods failed — nothing to do
      }
    }
  }

  if (!history.length) return null;

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-rule">
        <Wordmark size={20} />
        <div className="flex items-center gap-4">
          <span className="eyebrow">
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </span>
          <button className="btn-icon" aria-label="Close" onClick={() => router.push("/")}>
            <Icon.X size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-wide mx-auto px-10 pt-12">
        {/* Hero stat row */}
        <div className="grid grid-cols-2 gap-8 mb-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow mb-3">{history.length} round{history.length !== 1 ? "s" : ""} scored</div>
            <div className="font-display italic font-medium leading-[0.95]" style={{ fontSize: "clamp(80px,9vw,132px)" }}>
              <span>You scored </span>
              <span className="tnum text-accent">{totalScore}</span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            {/* Stat cards */}
            <div className="bg-cream rounded-5 px-6 py-5">
              <div className="eyebrow mb-1">Average accuracy</div>
              <div className="display tnum text-2xl text-ink">
                {avgAccuracy}%
              </div>
            </div>
            {bestRound && (
              <div className="bg-cream rounded-5 px-6 py-5">
                <div className="eyebrow mb-1">Best market</div>
                <div className="font-semibold text-base">
                  {bestRound.listing.city}, {bestRound.listing.state}
                </div>
                <div className="text-sm text-ink-mute">
                  {formatDelta(bestRound.errorDollars)} off
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className="hairline mb-10" />

        {/* Round cards grid */}
        <div className="grid grid-cols-5 gap-3 mb-12">
          {history.map((r, i) => {
            const isBest = r === bestRound;
            const isWorst = r === worstRound;
            const accuracy = Math.max(0, Math.round((1 - r.errorPct) * 100));
            const photo = r.listing.photos[0]?.url;
            return (
              <div
                key={i}
                className="relative bg-paper border border-rule rounded-4 overflow-hidden shadow-card"
              >
                {/* Corner badge */}
                {(isBest || isWorst) && (
                  <div
                    className={`caption absolute top-2 left-2 z-10 rounded-pill text-xs px-2 py-[3px] text-white ${
                      isBest ? "bg-moss" : "bg-flag"
                    }`}
                  >
                    {isBest ? "Best" : "Worst"}
                  </div>
                )}

                {/* Photo */}
                {photo && (
                  <div
                    className="h-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${photo})` }}
                  />
                )}

                <div className="px-3 py-2.5">
                  <div className="eyebrow mb-1 text-xs">R{i + 1}</div>
                  <div className="tnum font-bold text-sm text-accent">
                    {accuracy}%
                  </div>
                  <div className="text-xs text-ink-mute mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                    {r.listing.neighborhood ?? r.listing.city}
                  </div>
                  <div className="tnum text-xs text-ink-quiet mt-[3px]">
                    {formatPrice(r.guess)} → <span className="text-ink">{formatPrice(r.actualPrice)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: share + next */}
        <div className="grid grid-cols-2 gap-6">
          {/* Share card */}
          <div className="bg-paper border border-rule rounded-6 px-7 pt-7 pb-6 shadow-card">
            <div className="eyebrow mb-4">Your results</div>
            <pre className="font-mono text-lg leading-[1.5] m-0 mb-4 text-ink tracking-[0.05em]">
              {emojiGrid.match(/.{1,5}/g)?.join("\n")}
            </pre>
            <div className="text-sm text-ink-mute mb-5 font-mono">
              {avgAccuracy}% accurate · {streak}-game streak
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-ink w-full justify-center gap-2 text-sm"
            >
              <Icon.Share size={16} />
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>

          {/* Next up */}
          <div className="bg-ink rounded-6 p-7 flex flex-col gap-4 justify-center">
            <div className="eyebrow text-paper-40">Keep going</div>
            <div className="display text-2xl text-paper leading-[1.1]">
              Play another 5?
            </div>
            <button
              onClick={() => router.push("/play")}
              className="btn btn-primary justify-between text-base"
            >
              <span>Play again</span>
              <span>→</span>
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="btn justify-between text-sm text-paper-40 bg-[rgba(247,244,238,0.07)]"
            >
              <span>See leaderboard</span>
              <span className="opacity-60">↗</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="btn text-sm text-paper-40 bg-transparent"
            >
              Back to home
            </button>
          </div>
        </div>

        {/* Worst guess zinger */}
        {worstRound && (
          <div className="mt-8 bg-cream rounded-6 px-7 py-6 flex gap-5 items-center">
            {worstRound.listing.photos[0] && (
              <div
                className="w-[72px] h-[72px] rounded-2 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${worstRound.listing.photos[0].url})` }}
              />
            )}
            <div>
              <div className="eyebrow mb-2">Worst guess</div>
              <div className="display text-lg text-ink leading-[1.2]">
                {formatPrice(worstRound.guess)} for a {formatPrice(worstRound.actualPrice)} home.
              </div>
              <div className="tnum text-sm text-flag mt-1">
                {formatDelta(worstRound.errorDollars)} · {Math.round(worstRound.errorPct * 100)}% off
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return <SummaryContent />;
}
