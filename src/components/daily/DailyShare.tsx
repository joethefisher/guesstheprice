"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildShareText, buildShareUrl, bucketEmoji, accuracyToBucket } from "@/lib/daily/service";
import type { DailyResult, DailyStorage, SharePayload } from "@/lib/daily/service";
import type { ListingPublic } from "@/lib/game";

interface Props {
  result: DailyResult;
  storage: DailyStorage;
  dailyNumber: number;
  listing: ListingPublic;
  onClose: () => void;
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function accuracyColor(v: number): string {
  if (v >= 90) return "var(--emerald)";
  if (v >= 80) return "#4A6741";
  if (v >= 70) return "var(--accent)";
  if (v >= 60) return "var(--gold)";
  return "rgba(247,244,238,0.15)";
}

export function DailyShare({ result, storage, dailyNumber, listing, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const sharePayload: SharePayload = {
    n: dailyNumber,
    a: result.accuracy,
    s: storage.currentStreak,
    h: storage.history.slice(-7),
    c: result.city,
    t: result.state,
    d: storage.lastPlayedDateET ?? "",
  };

  const shareUrl = typeof window !== "undefined" ? buildShareUrl(sharePayload) : "";

  const shareText = buildShareText(
    dailyNumber,
    result.accuracy,
    result.bucket,
    storage.currentStreak,
    storage.history,
    shareUrl
  );

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  const handleCopy = useCallback(async () => {
    await copyToClipboard(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const handleCopyLink = useCallback(async () => {
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [shareUrl]);

  // Last 7 days of history for emoji grid
  const recent = storage.history.slice(-7);
  const photoUrl = listing.photos?.[0]?.url ?? result.photoUrl ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "rgba(10,8,6,0.75)",
        backdropFilter: "blur(16px)",
        display: "grid", placeItems: "center",
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, borderRadius: 24,
          background: "rgba(28,26,22,0.98)",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(247,244,238,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Photo strip */}
        {photoUrl && (
          <div style={{
            height: 160, position: "relative",
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(28,26,22,0.95) 100%)",
            }} />
            {/* Accuracy badge */}
            <div style={{
              position: "absolute", bottom: 18, left: 20,
              display: "flex", alignItems: "flex-end", gap: 8,
            }}>
              <div className="display tnum" style={{
                fontSize: "var(--text-display-l)", lineHeight: 1, letterSpacing: "-0.03em",
                color: result.accuracy >= 90 ? "var(--spot)" : "var(--paper)",
                textShadow: result.accuracy >= 90 ? "0 0 40px rgba(255,214,107,0.5)" : "none",
              }}>
                {result.accuracy}
              </div>
              <div style={{
                fontSize: "var(--text-lg)", color: "var(--paper-mute)",
                paddingBottom: 8,
              }}>%</div>
            </div>
            {/* Daily number */}
            <div style={{
              position: "absolute", top: 16, right: 18,
              padding: "5px 12px", borderRadius: 999,
              background: "rgba(15,17,13,0.7)",
              backdropFilter: "blur(8px)",
              boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
              fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em",
              color: "var(--spot)",
            }}>
              DAILY #{dailyNumber}
            </div>
          </div>
        )}

        <div style={{ padding: "20px 24px 24px" }}>
          {/* Address */}
 <div className="mb-4">
            <div className="display" style={{ fontSize: "var(--text-md)", fontStyle: "italic", color: "var(--paper)" }}>
              {result.streetAddress}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--paper-mute)", marginTop: 2 }}>
              {result.city}, {result.state}
            </div>
          </div>

          {/* Guess vs actual */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16,
          }}>
            {[
              { l: "YOUR GUESS", v: formatPrice(result.guess) },
              { l: "ACTUAL PRICE", v: formatPrice(result.actual), accent: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(247,244,238,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              }}>
                <div className="eyebrow" style={{ fontSize: "var(--text-xs)", color: "var(--paper-quiet)", marginBottom: 4 }}>
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

          {/* 7-day emoji grid */}
          <div style={{
            marginBottom: 16, padding: "12px 14px", borderRadius: 12,
            background: "rgba(247,244,238,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
          }}>
            <div className="eyebrow" style={{ fontSize: "var(--text-xs)", color: "var(--paper-quiet)", marginBottom: 10 }}>
              LAST 7 DAYS
            </div>
 <div className="flex gap-1 items-center">
              {recent.map((v, i) => {
                const isToday = i === recent.length - 1;
                const bg = v == null ? "rgba(247,244,238,0.08)" : accuracyColor(v);
                return (
                  <div key={i} style={{
                    flex: 1, height: 28, borderRadius: 5,
                    background: bg,
                    display: "grid", placeItems: "center",
                    boxShadow: isToday ? "0 0 0 2px var(--spot)" : "none",
                    fontSize: "var(--text-sm)",
                    transition: "all 0.2s",
                  }}
                    title={v != null ? `${v}%` : "Missed"}
                  >
                    {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                  </div>
                );
              })}
            </div>
            {storage.currentStreak > 0 && (
              <div style={{
                marginTop: 8, fontSize: "var(--text-xs)", color: "var(--paper-quiet)", textAlign: "right",
              }}>
                🔥 {storage.currentStreak} day streak
              </div>
            )}
          </div>

          {/* Share text preview */}
          <div style={{
            marginBottom: 16, padding: "10px 12px", borderRadius: 10,
            background: "rgba(247,244,238,0.04)",
            boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.08)",
            fontFamily: "var(--mono)", fontSize: "var(--text-sm)", lineHeight: 1.7,
            color: "var(--paper-mute)", whiteSpace: "pre-wrap",
          }}>
            {shareText}
          </div>

          {/* CTAs */}
 <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleCopy}
              style={{
                flex: 1, padding: "13px", fontSize: "var(--text-sm)", borderRadius: 12,
                background: copied ? "var(--emerald)" : undefined,
                transition: "background 0.2s",
              }}
            >
              {copied ? "Copied ✓" : "Copy result"}
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1, padding: "13px", fontSize: "var(--text-sm)", borderRadius: 12,
                background: copiedLink ? "rgba(100,180,100,0.25)" : "rgba(247,244,238,0.1)",
                color: copiedLink ? "#7dc97d" : "rgba(247,244,238,0.8)",
                border: "none", cursor: "pointer",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
                fontWeight: 600, transition: "background 0.2s, color 0.2s",
              }}
            >
              {copiedLink ? "Link copied ✓" : "Copy link"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "13px 16px", fontSize: "var(--text-sm)", borderRadius: 12,
                background: "rgba(247,244,238,0.06)", color: "var(--paper-quiet)",
                border: "none", cursor: "pointer",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
