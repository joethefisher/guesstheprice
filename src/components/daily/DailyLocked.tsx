"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import {
  StageBackground,
  SpotlightCones,
  GrainOverlay,
  NextDailyCountdown,
  DarkIconButton,
} from "./DailyShared";
import { MapExpandedModal } from "./map/MapExpandedModal";
import type { DailyResult, DailyStorage } from "@/lib/daily/service";
import type { ListingPublic } from "@/lib/game";

interface Props {
  result: DailyResult | null;
  storage: DailyStorage;
  dailyNumber: number;
  listing: ListingPublic | null;
  onPractice: () => void;
  onStats: () => void;
  onExit: () => void;
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function DailyLocked({
  result,
  storage,
  dailyNumber,
  listing,
  onPractice,
  onStats,
  onExit,
}: Props) {
  // Prefer the live listing's R2-mirrored URL; fall back to stored source URL
  const photoUrl = listing?.photos?.[0]?.url || result?.photoUrl || null;
  const [mapOpen, setMapOpen] = useState(false);
  const canShowMap = !!(listing?.map && result);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", color: "var(--paper)" }}>
      <StageBackground soft />
      <SpotlightCones />
      <GrainOverlay opacity={0.3} />

      {/* Header */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "26px 36px",
      }}>
        <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
          <Wordmark size={18} />
        </div>
        <DarkIconButton onClick={onExit} />
      </header>

      {/* Two-column grid */}
      <div style={{
        position: "absolute", inset: 0,
        padding: "100px 80px 60px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 70,
        alignItems: "center",
        zIndex: 3,
      }}>
        {/* LEFT — message */}
        <div>
          {/* Done pill */}
          <motion.div
            custom={0} variants={fadeUpVariant} initial="hidden" animate="show"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22,
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(46,111,74,0.22)", color: "var(--emerald)",
              boxShadow: "inset 0 0 0 1px rgba(46,111,74,0.4)",
              fontSize: "var(--text-sm)", fontWeight: 700, letterSpacing: "0.08em",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l4 4 10-10" />
            </svg>
            DONE FOR TODAY
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1} variants={fadeUpVariant} initial="hidden" animate="show"
            className="display"
            style={{ margin: 0, fontSize: "var(--text-display-xl)", lineHeight: 0.95, letterSpacing: "-0.03em" }}
          >
            See you<br />
            <span style={{ color: "var(--spot)", fontStyle: "italic" }}>tomorrow.</span>
          </motion.h1>

          {/* Body copy */}
          <motion.p
            custom={2} variants={fadeUpVariant} initial="hidden" animate="show"
            style={{
              fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--paper-default)",
              maxWidth: "40ch", margin: "22px 0 28px",
            }}
          >
            You played today's house. The next one drops at midnight Eastern — same time as the rest of the world.
          </motion.p>

          {/* Countdown card */}
          <motion.div
            custom={3} variants={fadeUpVariant} initial="hidden" animate="show"
            style={{
              padding: "22px 24px", borderRadius: 16,
              background: "rgba(247,244,238,0.06)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 22,
            }}
          >
            <div>
              <div className="eyebrow" style={{ color: "var(--paper-mute)", marginBottom: 6 }}>
                NEXT HOUSE IN
              </div>
              <NextDailyCountdown size={40} color="var(--spot)" />
            </div>
            <button
              className="btn"
              style={{
                background: "rgba(247,244,238,0.1)", color: "var(--paper)",
                padding: "12px 16px", fontSize: "var(--text-sm)", borderRadius: 10,
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.25)",
              }}
            >
              Notify me
            </button>
          </motion.div>

          {/* Buttons */}
          <motion.div className="flex gap-3"
            custom={4} variants={fadeUpVariant} initial="hidden" animate="show"
 
          >
            <button
              className="btn btn-primary"
              onClick={onPractice}
              style={{ padding: "16px 22px", fontSize: "var(--text-sm)", borderRadius: 12 }}
            >
              Play practice rounds
            </button>
            <button
              className="btn"
              onClick={onStats}
              style={{
                padding: "16px 22px", fontSize: "var(--text-sm)", borderRadius: 12,
                background: "rgba(247,244,238,0.08)", color: "var(--paper)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)",
              }}
            >
              See your stats
            </button>
          </motion.div>
        </div>

        {/* RIGHT — today's locked card */}
        <motion.div
          custom={1} variants={fadeUpVariant} initial="hidden" animate="show"
        >
          <div className="eyebrow" style={{ marginBottom: 14, color: "var(--paper-mute)" }}>
            Today's result · #{dailyNumber}
          </div>

          {/* Photo card */}
          <div style={{
            position: "relative", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden",
            background: "rgba(247,244,238,0.06)",
            boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(247,244,238,0.1)",
            marginBottom: 16,
          }}>
            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center",
                }}
              />
            )}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)",
            }} />
            {/* PLAYED badge */}
            <div style={{
              position: "absolute", top: 18, right: 18,
              padding: "6px 12px", borderRadius: 999,
              background: "var(--paper)", color: "var(--ink)",
              fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              PLAYED
            </div>
            {result && (
              <div style={{
                position: "absolute", bottom: 18, left: 20, right: 20, color: "var(--paper)",
              }}>
                <div className="display" style={{ fontSize: "var(--text-lg)", fontStyle: "italic", marginBottom: 4 }}>
                  {result.streetAddress}
                </div>
                <div style={{ fontSize: "var(--text-sm)", opacity: 0.85 }}>
                  {result.city}, {result.state}
                </div>
              </div>
            )}
          </div>

          {/* Quick stat tiles */}
          {result ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { l: "YOUR GUESS", v: formatPrice(result.guess) },
                { l: "ACTUAL", v: formatPrice(result.actual), accent: true },
                { l: "ACCURACY", v: `${result.accuracy}%` },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 12,
                  background: "rgba(247,244,238,0.06)",
                  boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
                }}>
                  <div className="eyebrow" style={{ fontSize: "var(--text-xs)", marginBottom: 4, color: "var(--paper-mute)" }}>
                    {s.l}
                  </div>
                  <div className="display tnum" style={{
                    fontSize: "var(--text-lg)", fontStyle: "italic",
                    color: s.accent ? "var(--spot)" : "var(--paper)",
                  }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 14, borderRadius: 12,
              background: "rgba(247,244,238,0.06)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              color: "var(--paper-quiet)", fontSize: "var(--text-sm)",
            }}>
              Result details unavailable
            </div>
          )}

          {/* Streak summary */}
          {storage.currentStreak > 0 && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,92,57,0.12)",
              display: "flex", alignItems: "center", gap: 8,
              color: "var(--accent)", fontSize: "var(--text-sm)", fontWeight: 700,
            }}>
              🔥 {storage.currentStreak} day streak
              {storage.bestStreak > storage.currentStreak && (
                <span style={{ color: "var(--paper-quiet)", fontWeight: 400, fontSize: "var(--text-sm)" }}>
                  · best: {storage.bestStreak}
                </span>
              )}
            </div>
          )}

          {/* View map link — opens the revealed-mode modal */}
          {canShowMap && (
            <button
              onClick={() => setMapOpen(true)}
              className="btn"
              style={{
                marginTop: 14,
                width: "100%",
                padding: "12px 14px",
                fontSize: "var(--text-sm)",
                borderRadius: 10,
                background: "rgba(247,244,238,0.06)",
                color: "var(--paper)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                cursor: "pointer",
              }}
            >
 <span className="flex items-center gap-2">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                View map of today's house
              </span>
              <span style={{ opacity: 0.55, fontSize: "var(--text-sm)" }}>↗</span>
            </button>
          )}
        </motion.div>
      </div>

      {/* Map modal — revealed mode */}
      {mapOpen && canShowMap && listing && result && listing.map && (
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
    </div>
  );
}
