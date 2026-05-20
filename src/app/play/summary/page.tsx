"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { TierBadge } from "@/components/GameChips";
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
    <div
      className="min-h-screen"
      style={{ background: "var(--paper)", paddingBottom: 80 }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
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

      <div style={{ maxWidth: "var(--w-wide)", margin: "0 auto", padding: "48px 40px 0" }}>
        {/* Hero stat row */}
        <div
          className="grid gap-8 mb-12 items-start"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow mb-3">{history.length} round{history.length !== 1 ? "s" : ""} scored</div>
            <div style={{ fontSize: "clamp(80px,9vw,132px)", lineHeight: 0.95, fontFamily: "var(--display)", fontStyle: "italic", fontWeight: 500 }}>
              <span>You scored </span>
              <span className="tnum" style={{ color: "var(--accent)" }}>{totalScore}</span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            {/* Stat cards */}
            <div
              style={{
                background: "var(--cream)",
                borderRadius: 18,
                padding: "20px 24px",
              }}
            >
              <div className="eyebrow mb-1">Average accuracy</div>
              <div
                className="display tnum"
                style={{ fontSize: "var(--text-2xl)", color: "var(--ink)" }}
              >
                {avgAccuracy}%
              </div>
            </div>
            {bestRound && (
              <div
                style={{
                  background: "var(--cream)",
                  borderRadius: 18,
                  padding: "20px 24px",
                }}
              >
                <div className="eyebrow mb-1">Best market</div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>
                  {bestRound.listing.city}, {bestRound.listing.state}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)" }}>
                  {formatDelta(bestRound.errorDollars)} off
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className="hairline mb-10" />

        {/* Round cards grid */}
        <div
          className="grid gap-3 mb-12"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >
          {history.map((r, i) => {
            const isBest = r === bestRound;
            const isWorst = r === worstRound;
            const accuracy = Math.max(0, Math.round((1 - r.errorPct) * 100));
            const photo = r.listing.photos[0]?.url;
            return (
              <div
                key={i}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)",
                  position: "relative",
                }}
              >
                {/* Corner badge */}
                {(isBest || isWorst) && (
                  <div
                    className="caption absolute top-2 left-2 z-10"
                    style={{
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: "var(--text-xs)",
                      background: isBest ? "var(--moss)" : "var(--flag)",
                      color: "#fff",
                    }}
                  >
                    {isBest ? "Best" : "Worst"}
                  </div>
                )}

                {/* Photo */}
                {photo && (
                  <div
                    style={{
                      height: 80,
                      backgroundImage: `url(${photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                <div style={{ padding: "10px 12px" }}>
                  <div className="eyebrow mb-1" style={{ fontSize: "var(--text-xs)" }}>
                    R{i + 1}
                  </div>
                  <div
                    className="tnum"
                    style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--accent)" }}
                  >
                    {accuracy}%
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--ink-mute)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.listing.neighborhood ?? r.listing.city}
                  </div>
                  <div
                    className="tnum"
                    style={{ fontSize: "var(--text-xs)", color: "var(--ink-quiet)", marginTop: 3 }}
                  >
                    {formatPrice(r.guess)} →{" "}
                    <span style={{ color: "var(--ink)" }}>
                      {formatPrice(r.actualPrice)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: share + next */}
        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Share card */}
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              borderRadius: 22,
              padding: "28px 28px 24px",
              boxShadow: "0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)",
            }}
          >
            <div className="eyebrow mb-4">Your results</div>
            <pre
              className="font-mono"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "var(--text-lg)",
                lineHeight: 1.5,
                margin: "0 0 16px",
                color: "var(--ink)",
                letterSpacing: "0.05em",
              }}
            >
              {emojiGrid.match(/.{1,5}/g)?.join("\n")}
            </pre>
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--ink-mute)",
                marginBottom: 20,
                fontFamily: "var(--mono)",
              }}
            >
              {avgAccuracy}% accurate · {streak}-game streak
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-ink"
              style={{ gap: 8, fontSize: "var(--text-sm)", width: "100%", justifyContent: "center" }}
            >
              <Icon.Share size={16} />
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>

          {/* Next up */}
          <div
            style={{
              background: "var(--ink)",
              borderRadius: 22,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              justifyContent: "center",
            }}
          >
            <div className="eyebrow" style={{ color: "var(--paper-quiet)" }}>
              Keep going
            </div>
            <div
              className="display"
              style={{ fontSize: "var(--text-2xl)", color: "var(--paper)", lineHeight: 1.1 }}
            >
              Play another 5?
            </div>
            <button
              onClick={() => router.push("/play")}
              className="btn btn-primary"
              style={{ fontSize: "var(--text-base)", justifyContent: "space-between" }}
            >
              <span>Play again</span>
              <span>→</span>
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="btn"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--paper-quiet)",
                background: "rgba(247,244,238,0.07)",
                justifyContent: "space-between",
              }}
            >
              <span>See leaderboard</span>
              <span style={{ opacity: 0.6 }}>↗</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="btn"
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--paper-quiet)",
                background: "transparent",
              }}
            >
              Back to home
            </button>
          </div>
        </div>

        {/* Worst guess zinger */}
        {worstRound && (
          <div
            style={{
              marginTop: 32,
              background: "var(--cream)",
              borderRadius: 20,
              padding: "24px 28px",
              display: "flex",
              gap: 20,
              alignItems: "center",
            }}
          >
            {worstRound.listing.photos[0] && (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  backgroundImage: `url(${worstRound.listing.photos[0].url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div className="eyebrow mb-2">Worst guess</div>
              <div
                className="display"
                style={{ fontSize: "var(--text-lg)", color: "var(--ink)", lineHeight: 1.2 }}
              >
                {formatPrice(worstRound.guess)} for a{" "}
                {formatPrice(worstRound.actualPrice)} home.
              </div>
              <div
                className="tnum"
                style={{ fontSize: "var(--text-sm)", color: "var(--flag)", marginTop: 4 }}
              >
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
