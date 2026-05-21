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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-55"
      style={{ backdropFilter: "blur(14px) saturate(140%)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
        className="grain relative overflow-hidden bg-paper rounded-7 w-full max-w-default mx-6 pt-9 px-10 pb-10 shadow-modal"
      >
        <Confetti fire={isNailed && tickerDone} />

        {/* Tag bar */}
        <div className="flex items-center justify-between mb-5">
          <TierBadge tier={result.tier} />
          <div className="eyebrow">Reveal</div>
        </div>

        {/* Reaction copy */}
        <h2 className="display m-0 mb-6 text-2xl text-ink leading-[1.1] max-w-[24ch]">
          {result.reaction}
        </h2>

        {/* Two-column number stack */}
        <div className="flex gap-12 mb-6 items-start">
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Your guess</div>
            <div className="display tnum text-2xl text-ink-mute">
              {formatPrice(result.guess)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="eyebrow">Actual price</div>
            <div className="text-display-l leading-none text-accent">
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
            <div className={`tnum font-semibold text-md ${result.errorDollars >= 0 ? "text-flag" : "text-moss"}`}>
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
                <div className="tnum font-semibold text-md text-accent">
                  +{result.score}
                </div>
                <div className="tnum text-xs text-ink-mute mt-px">
                  {result.pointsRaw} × {result.multiplier.toFixed(1)}
                </div>
              </>
            ) : (
              <div className="tnum font-semibold text-md text-accent">
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
            className="text-sm font-semibold text-flag mb-2 -mt-2 tracking-[0.04em]"
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
          className={`bg-cream rounded-4 py-4 px-5 mb-6 border-none w-full text-left flex items-center justify-between gap-3 ${
            listing.map ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="eyebrow mb-1">Address</div>
            <div className="font-semibold text-base">{result.streetAddress}</div>
            <div className="text-sm text-ink-mute">
              {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}, {listing.state}
            </div>
          </div>
          {listing.map && (
            <div className="flex items-center gap-1.5 py-2 px-3 rounded-pill bg-paper text-ink text-sm font-semibold border border-rule flex-shrink-0">
              <svg aria-hidden="true" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
            className="btn btn-primary flex-1 text-md"
          >
            {roundNumber < totalRounds ? "Next round →" : "See results →"}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-secondary gap-2 text-sm"
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
