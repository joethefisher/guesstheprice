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
    const raw = localStorage.getItem("pricetag_saved");
    if (raw) setHomes(JSON.parse(raw));
  }, []);

  function handleRemove(listingId: string) {
    const updated = homes.filter((h) => h.listingId !== listingId);
    setHomes(updated);
    localStorage.setItem("pricetag_saved", JSON.stringify(updated));
  }

  const filtered = useMemo(() => {
    let out = [...homes];

    // Price filter
    out = out.filter((h) => {
      switch (priceFilter) {
        case "under500": return h.actualPrice < 500_000;
        case "500to1m": return h.actualPrice >= 500_000 && h.actualPrice < 1_000_000;
        case "1mto3m": return h.actualPrice >= 1_000_000 && h.actualPrice < 3_000_000;
        case "over3m": return h.actualPrice >= 3_000_000;
        default: return true;
      }
    });

    // Sort
    switch (sort) {
      case "closest":
        out.sort((a, b) => a.accuracy - b.accuracy);
        out.reverse();
        break;
      case "worst":
        out.sort((a, b) => b.accuracy - a.accuracy);
        out.reverse();
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
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Wordmark size={20} />
        <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => router.push("/play")}>
          Play again →
        </button>
      </header>

      {/* Display headline */}
      <div style={{ padding: "48px 40px 32px" }}>
        <h1
          className="display m-0"
          style={{ fontSize: "clamp(40px,5vw,72px)", color: "var(--ink)" }}
        >
          Homes you'd actually live in.
        </h1>
      </div>

      {/* Sticky filter rail */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 gap-6"
        style={{
          background: "rgba(247,244,238,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="flex gap-2">
          {PRICE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setPriceFilter(f.key)}
              className="caption"
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                background: priceFilter === f.key ? "var(--ink)" : "transparent",
                color: priceFilter === f.key ? "var(--paper)" : "var(--ink-mute)",
                border: priceFilter === f.key ? "none" : "1.5px solid var(--rule)",
                transition: "all 200ms cubic-bezier(0.32,0.72,0,1)",
                cursor: "pointer",
              }}
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
              className="caption"
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                background: sort === s.key ? "rgba(26,26,26,0.08)" : "transparent",
                color: sort === s.key ? "var(--ink)" : "var(--ink-mute)",
                border: "none",
                transition: "all 200ms cubic-bezier(0.32,0.72,0,1)",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 40px" }}>
        {filtered.length === 0 ? (
          <EmptyState onPlay={() => router.push("/play")} />
        ) : (
          /* 3-column CSS masonry */
          <div
            style={{
              columnCount: 3,
              columnGap: 20,
            }}
          >
            {filtered.map((home, i) => (
              <motion.div
                key={home.listingId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
                whileHover={{ y: -3 }}
                style={{
                  breakInside: "avoid",
                  marginBottom: 20,
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)",
                  cursor: "pointer",
                  transition: "transform 280ms cubic-bezier(0.32,0.72,0,1), box-shadow 280ms cubic-bezier(0.32,0.72,0,1)",
                }}
              >
                {/* Photo */}
                <div
                  style={{
                    position: "relative",
                    height: CARD_HEIGHTS[i % CARD_HEIGHTS.length],
                    backgroundImage: `url(${home.photoUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Accuracy badge */}
                  <div className="absolute top-3 left-3">
                    <TierBadge tier={home.tier} />
                  </div>
                  {/* Heart */}
                  <button
                    onClick={() => handleRemove(home.listingId)}
                    className="absolute top-3 right-3"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: "rgba(26,26,26,0.55)",
                      backdropFilter: "blur(8px)",
                      border: "none",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--accent)",
                    }}
                    aria-label="Remove from saved"
                  >
                    <Icon.Heart filled size={14} />
                  </button>
                </div>

                {/* Card content */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div
                    className="display tnum"
                    style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}
                  >
                    {formatPrice(home.actualPrice)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {home.neighborhood ?? home.city}
                  </div>
                  <div className="tnum" style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                    {home.city}, {home.state}
                  </div>

                  <hr className="hairline my-3" />

                  <div className="tnum" style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                    You guessed{" "}
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                      {formatPrice(home.guess)}
                    </span>
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
        <h2
          className="display m-0 mb-2"
          style={{ fontSize: 32, color: "var(--ink)" }}
        >
          No saved homes yet.
        </h2>
        <p style={{ color: "var(--ink-mute)", fontSize: 16, margin: 0 }}>
          Save homes during a game with the heart button.
        </p>
      </div>

      <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 15 }}>
        Start playing →
      </button>
    </div>
  );
}
