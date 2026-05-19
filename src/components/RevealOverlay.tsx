"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { NumberTicker } from "./NumberTicker";
import { Confetti } from "./Confetti";
import { TierBadge } from "./GameChips";
import { Icon } from "./Icons";
import { MapExpandedModal } from "./daily/map/MapExpandedModal";
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
  const handleTickerDone = useCallback(() => setTickerDone(true), []);

  const isNailed = result.tier === "expert" || result.tier === "nailed";
  const accuracy = Math.max(0, Math.round((1 - result.errorPct) * 100));
  const [mapOpen, setMapOpen] = useState(false);

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
          maxWidth: "var(--w-default)",
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
          style={{ fontSize: "var(--text-2xl)", color: "var(--ink)", lineHeight: 1.1, maxWidth: "24ch" }}
        >
          {result.reaction}
        </h2>

        {/* Two-column number stack */}
        <div className="flex gap-12 mb-6 items-start">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Your guess</div>
            <div
              className="display tnum"
              style={{ fontSize: "var(--text-2xl)", color: "var(--ink-mute)" }}
            >
              {formatPrice(result.guess)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Actual price</div>
            <div style={{ fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--accent)" }}>
              <NumberTicker
                value={result.actualPrice}
                duration={1100}
                className="display"
                onDone={handleTickerDone}
              />
            </div>
          </div>
        </div>

        <hr className="hairline mb-6" />

        {/* Three metrics */}
        <div className="flex gap-8 mb-6">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Off by</div>
            <div className="tnum font-semibold text-md" style={{ color: result.errorDollars >= 0 ? "var(--flag)" : "var(--moss)" }}>
              {formatDelta(result.errorDollars)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Accuracy</div>
            <div className="tnum font-semibold text-md">{accuracy}%</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Score this round</div>
            {result.multiplier != null && result.multiplier > 1 ? (
              <>
                <div className="tnum font-semibold text-md" style={{ color: "var(--accent)" }}>
                  +{result.score}
                </div>
                <div className="tnum text-xs" style={{ color: "var(--ink-mute)", marginTop: 1 }}>
                  {result.pointsRaw} × {result.multiplier.toFixed(1)}
                </div>
              </>
            ) : (
              <div className="tnum font-semibold text-md" style={{ color: "var(--accent)" }}>
                +{result.score}
              </div>
            )}
          </div>
        </div>

        {/* Combo break notification */}
        {result.comboBrokenFrom != null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--flag)",
              marginBottom: 8,
              marginTop: -8,
              letterSpacing: "0.04em",
            }}
          >
            Combo broken at ×{result.comboBrokenFrom.toFixed(1)}
          </motion.div>
        )}

        {/* Address sub-card — click to open map */}
        <motion.button
          type="button"
          onClick={() => listing.map && setMapOpen(true)}
          disabled={!listing.map}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            background: "var(--cream)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: listing.map ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="eyebrow mb-1">Address</div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{result.streetAddress}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)" }}>
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}, {listing.state}
            </div>
          </div>
          {listing.map && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 999,
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                border: "1px solid var(--rule)",
                flexShrink: 0,
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              View map
            </div>
          )}
        </motion.button>

        {mapOpen && listing.map && (
          <MapExpandedModal
            listingId={listing.id}
            city={listing.city}
            state={listing.state}
            neighborhood={listing.neighborhood}
            map={listing.map}
            revealed
            exact={result.exact ?? null}
            streetAddress={result.streetAddress}
            onClose={() => setMapOpen(false)}
          />
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            onClick={onNext}
            className="btn btn-primary flex-1"
            style={{ fontSize: "var(--text-md)" }}
          >
            {roundNumber < totalRounds ? "Next round →" : "See results →"}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-secondary"
            style={{ gap: 8, fontSize: "var(--text-sm)" }}
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
