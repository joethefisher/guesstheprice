"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { NumberTicker } from "./NumberTicker";
import { Confetti } from "./Confetti";
import { TierBadge } from "./GameChips";
import { Icon } from "./Icons";
import { formatPrice, formatDelta, type RoundResult, type SavedHome } from "@/lib/game";

interface Props {
  result: RoundResult;
  listing: RoundResult["listing"];
  roundNumber: number;
  totalRounds: number;
  onNext: () => void;
  onSave: (home: SavedHome) => void;
  alreadySaved: boolean;
}

export function RevealOverlay({ result, listing, roundNumber, totalRounds, onNext, onSave, alreadySaved }: Props) {
  const [tickerDone, setTickerDone] = useState(false);
  const [saved, setSaved] = useState(alreadySaved);

  const isNailed = result.tier === "expert" || result.tier === "nailed";
  const accuracy = Math.max(0, Math.round((1 - result.errorPct) * 100));

  function handleSave() {
    if (saved) return;
    setSaved(true);
    onSave({
      listingId: listing.id,
      neighborhood: listing.neighborhood,
      city: listing.city,
      state: listing.state,
      photoUrl: listing.photos[0]?.url ?? "",
      guess: result.guess,
      actualPrice: result.actualPrice,
      tier: result.tier,
      accuracy,
      savedAt: Date.now(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(26,26,26,0.55)",
        backdropFilter: "blur(14px) saturate(140%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
        className="grain relative overflow-hidden"
        style={{
          background: "var(--paper)",
          borderRadius: 24,
          width: "100%",
          maxWidth: 760,
          margin: "0 24px",
          padding: "36px 40px 40px",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <Confetti fire={isNailed && tickerDone} />

        {/* Tag bar */}
        <div className="flex items-center justify-between mb-5">
          <TierBadge tier={result.tier} />
          <div className="eyebrow">Reveal</div>
        </div>

        {/* Reaction copy */}
        <h2
          className="display m-0 mb-6"
          style={{ fontSize: 36, color: "var(--ink)", lineHeight: 1.1, maxWidth: "24ch" }}
        >
          {result.reaction}
        </h2>

        {/* Two-column number stack */}
        <div className="flex gap-12 mb-6 items-start">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Your guess</div>
            <div
              className="display tnum"
              style={{ fontSize: 38, color: "var(--ink-mute)" }}
            >
              {formatPrice(result.guess)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Actual price</div>
            <div style={{ fontSize: 64, lineHeight: 1, color: "var(--accent)" }}>
              <NumberTicker
                value={result.actualPrice}
                duration={1100}
                className="display"
                onDone={() => setTickerDone(true)}
              />
            </div>
          </div>
        </div>

        <hr className="hairline mb-6" />

        {/* Three metrics */}
        <div className="flex gap-8 mb-6">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Off by</div>
            <div className="tnum font-semibold text-[18px]" style={{ color: result.errorDollars >= 0 ? "var(--flag)" : "var(--moss)" }}>
              {formatDelta(result.errorDollars)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Accuracy</div>
            <div className="tnum font-semibold text-[18px]">{accuracy}%</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Score this round</div>
            <div className="tnum font-semibold text-[18px]" style={{ color: "var(--accent)" }}>
              +{result.score}
            </div>
          </div>
        </div>

        {/* Address sub-card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            background: "var(--cream)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <div className="eyebrow mb-1">Address</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{result.streetAddress}</div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}, {listing.state}
          </div>
        </motion.div>

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="btn btn-primary flex-1"
            style={{ fontSize: 16 }}
          >
            {roundNumber < totalRounds ? "Next round →" : "See results →"}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-secondary"
            style={{ gap: 8, fontSize: 14 }}
            aria-label="Save this home"
          >
            <Icon.Heart filled={saved} size={18} />
            {saved ? "Saved" : "Save this home"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
