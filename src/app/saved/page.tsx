"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { TierBadge } from "@/components/GameChips";
import { Icon } from "@/components/Icons";
import { formatPrice, type SavedHome } from "@/lib/game";

type PriceFilter = "all" | "under500" | "500to1m" | "1mto3m" | "over3m";
type SortMode = "recent" | "closest" | "worst";

const CARD_HEIGHTS = [340, 280, 380, 300, 340, 360, 280, 320, 380, 300];

export default function SavedPage() {
  const router = useRouter();
  const [homes, setHomes] = useState<SavedHome[]>([]);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pricetag_saved");
      if (raw) setHomes(JSON.parse(raw));
    } catch {
      localStorage.removeItem("pricetag_saved");
    }
  }, []);

  function safeSetItem(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* quota or disabled */ }
  }

  function handleRemove(listingId: string) {
    const updated = homes.filter((h) => h.listingId !== listingId);
    setHomes(updated);
    safeSetItem("pricetag_saved", JSON.stringify(updated));
  }

  const filtered = useMemo(() => {
    let out = [...homes];

    // Price filter — homes saved before the user guessed have no actualPrice;
    // they only show on "all" since we don't know which bucket they belong to.
    out = out.filter((h) => {
      if (h.actualPrice === null) return priceFilter === "all";
      switch (priceFilter) {
        case "under500": return h.actualPrice < 500_000;
        case "500to1m": return h.actualPrice >= 500_000 && h.actualPrice < 1_000_000;
        case "1mto3m": return h.actualPrice >= 1_000_000 && h.actualPrice < 3_000_000;
        case "over3m": return h.actualPrice >= 3_000_000;
        default: return true;
      }
    });

    // Sort — null-accuracy entries sort to the bottom for closest/worst.
    switch (sort) {
      case "closest":
        out.sort((a, b) => {
          if (a.accuracy === null && b.accuracy === null) return 0;
          if (a.accuracy === null) return 1;
          if (b.accuracy === null) return -1;
          return b.accuracy - a.accuracy;
        });
        break;
      case "worst":
        out.sort((a, b) => {
          if (a.accuracy === null && b.accuracy === null) return 0;
          if (a.accuracy === null) return 1;
          if (b.accuracy === null) return -1;
          return a.accuracy - b.accuracy;
        });
        break;
      default:
        out.sort((a, b) => b.savedAt - a.savedAt);
    }

    return out;
  }, [homes, priceFilter, sort]);

  const PRICE_FILTERS: { key: PriceFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "under500", label: "Under $500K" },
    { key: "500to1m", label: "$500K–$1M" },
    { key: "1mto3m", label: "$1M–$3M" },
    { key: "over3m", label: "Over $3M" },
  ];
  const SORTS: { key: SortMode; label: string }[] = [
    { key: "recent", label: "Recent" },
    { key: "closest", label: "Closest guess" },
    { key: "worst", label: "Worst guess" },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-6 border-b border-rule">
        <Wordmark size={20} />
        <button className="btn btn-secondary text-sm" onClick={() => router.push("/play")}>
          Play again →
        </button>
      </header>

      {/* Display headline */}
      <div className="px-10 pt-12 pb-8">
        <h1 className="display m-0 text-ink" style={{ fontSize: "clamp(40px,5vw,72px)" }}>
          Homes you'd actually live in.
        </h1>
      </div>

      {/* Sticky filter rail */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 gap-6 bg-paper-95 border-y border-rule"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="flex gap-2">
          {PRICE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setPriceFilter(f.key)}
              className={`caption px-3.5 py-[7px] rounded-pill text-xs font-semibold tracking-[0.08em] cursor-pointer transition-all duration-200 ${
                priceFilter === f.key
                  ? "bg-ink text-paper border-none"
                  : "bg-transparent text-ink-mute border-[1.5px] border-rule"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`caption px-3.5 py-[7px] rounded-pill text-xs font-semibold tracking-[0.08em] border-none cursor-pointer transition-all duration-200 ${
                sort === s.key ? "bg-ink-08 text-ink" : "bg-transparent text-ink-mute"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-10 py-7">
        {filtered.length === 0 ? (
          <EmptyState onPlay={() => router.push("/play")} />
        ) : (
          /* 3-column CSS masonry */
          <div style={{ columnCount: 3, columnGap: 20 }}>
            {filtered.map((home, i) => (
              <motion.div
                key={home.listingId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
                whileHover={{ y: -3 }}
                className="mb-5 bg-paper border border-rule rounded-5 overflow-hidden shadow-card cursor-pointer transition-[transform,box-shadow] duration-[280ms]"
                style={{ breakInside: "avoid" }}
              >
                {/* Photo */}
                <div
                  className="relative bg-cover bg-center"
                  style={{
                    height: CARD_HEIGHTS[i % CARD_HEIGHTS.length],
                    backgroundImage: `url(${home.photoUrl})`,
                  }}
                >
                  {/* Accuracy badge — only present once the round revealed */}
                  {home.tier !== null && (
                    <div className="absolute top-3 left-3">
                      <TierBadge tier={home.tier} />
                    </div>
                  )}
                  {/* Heart */}
                  <button
                    onClick={() => handleRemove(home.listingId)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-pill bg-ink-55 border-none cursor-pointer grid place-items-center text-accent"
                    style={{ backdropFilter: "blur(8px)" }}
                    aria-label="Remove from saved"
                  >
                    <Icon.Heart filled size={14} />
                  </button>
                </div>

                {/* Card content */}
                <div className="px-4 pt-3.5 pb-4">
                  <div className="display tnum text-lg text-ink mb-1">
                    {home.actualPrice !== null
                      ? formatPrice(home.actualPrice)
                      : <span className="text-ink-mute">Saved before guess</span>}
                  </div>
                  <div className="font-semibold text-sm mb-0.5">
                    {home.neighborhood ?? home.city}
                  </div>
                  <div className="tnum text-sm text-ink-mute">
                    {home.city}, {home.state}
                  </div>

                  <hr className="hairline my-3" />

                  <div className="tnum text-sm text-ink-mute">
                    {home.guess !== null ? (
                      <>
                        You guessed{" "}
                        <span className="font-semibold text-ink">
                          {formatPrice(home.guess)}
                        </span>
                      </>
                    ) : (
                      "Not yet guessed"
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-20">
      {/* Hand-drawn house SVG */}
      <svg width={120} height={100} viewBox="0 0 120 100" fill="none" stroke="var(--ink-quiet)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 8 L8 48 L20 48 L20 92 L100 92 L100 48 L112 48 Z" />
        <path d="M45 92 L45 64 Q45 56 60 56 Q75 56 75 64 L75 92" />
        <rect x="38" y="56" width="6" height="6" rx="1" />
        <rect x="76" y="56" width="6" height="6" rx="1" />
        <path d="M60 8 L60 36" strokeDasharray="4 3" />
      </svg>

      <div className="text-center">
        <h2 className="display m-0 mb-2 text-2xl text-ink">
          No saved homes yet.
        </h2>
        <p className="text-ink-mute text-md m-0">
          Save homes during a game with the heart button.
        </p>
      </div>

      <button onClick={onPlay} className="btn btn-primary text-base">
        Start playing →
      </button>
    </div>
  );
}
