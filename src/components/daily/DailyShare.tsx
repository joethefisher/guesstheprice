"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
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
      className="absolute inset-0 z-40 grid place-items-center"
      style={{
        background: "rgba(10,8,6,0.75)",
        backdropFilter: "blur(16px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] rounded-7 overflow-hidden"
        style={{
          background: "rgba(28,26,22,0.98)",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(247,244,238,0.12)",
        }}
      >
        {/* Photo strip */}
        {photoUrl && (
          <div
            className="h-40 relative bg-cover bg-center"
            style={{ backgroundImage: `url(${photoUrl})` }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(28,26,22,0.95) 100%)" }}
            />
            {/* Accuracy badge */}
            <div className="absolute bottom-[18px] left-5 flex items-end gap-2">
              <div
                className="display tnum text-display-l leading-none tracking-[-0.03em]"
                style={{
                  color: result.accuracy >= 90 ? "var(--spot)" : "var(--paper)",
                  textShadow: result.accuracy >= 90 ? "0 0 40px rgba(255,214,107,0.5)" : "none",
                }}
              >
                {result.accuracy}
              </div>
              <div className="text-lg text-paper-60 pb-2">%</div>
            </div>
            {/* Daily number */}
            <div
              className="absolute top-4 right-[18px] px-3 py-[5px] rounded-pill text-xs font-bold tracking-[0.1em] text-spot"
              style={{
                background: "rgba(15,17,13,0.7)",
                backdropFilter: "blur(8px)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
              }}
            >
              DAILY #{dailyNumber}
            </div>
          </div>
        )}

        <div className="px-6 pt-5 pb-6">
          {/* Address */}
          <div className="mb-4">
            <div className="display text-md italic text-paper">
              {result.streetAddress}
            </div>
            <div className="text-sm text-paper-60 mt-0.5">
              {result.city}, {result.state}
            </div>
          </div>

          {/* Guess vs actual */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { l: "YOUR GUESS", v: formatPrice(result.guess) },
              { l: "ACTUAL PRICE", v: formatPrice(result.actual), accent: true },
            ].map((s, i) => (
              <div
                key={i}
                className="px-3 py-2.5 rounded-[10px] bg-paper-08"
                style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}
              >
                <div className="eyebrow text-xs text-paper-40 mb-1">
                  {s.l}
                </div>
                <div className={`display tnum text-lg italic ${s.accent ? "text-spot" : "text-paper"}`}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          {/* 7-day emoji grid */}
          <div
            className="mb-4 py-3 px-3.5 rounded-2 bg-paper-08"
            style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}
          >
            <div className="eyebrow text-xs text-paper-40 mb-2.5">
              LAST 7 DAYS
            </div>
            <div className="flex gap-1 items-center">
              {recent.map((v, i) => {
                const isToday = i === recent.length - 1;
                const bg = v == null ? "rgba(247,244,238,0.08)" : accuracyColor(v);
                return (
                  <div
                    key={i}
                    className="flex-1 h-7 rounded-[5px] grid place-items-center text-sm transition-all duration-200"
                    style={{
                      background: bg,
                      boxShadow: isToday ? "0 0 0 2px var(--spot)" : "none",
                    }}
                    title={v != null ? `${v}%` : "Missed"}
                  >
                    {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                  </div>
                );
              })}
            </div>
            {storage.currentStreak > 0 && (
              <div className="mt-2 text-xs text-paper-40 text-right">
                🔥 {storage.currentStreak} day streak
              </div>
            )}
          </div>

          {/* Share text preview */}
          <div
            className="mb-4 py-2.5 px-3 rounded-[10px] bg-[rgba(247,244,238,0.04)] font-mono text-sm leading-[1.7] text-paper-60 whitespace-pre-wrap"
            style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.08)" }}
          >
            {shareText}
          </div>

          {/* CTAs */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary flex-1 p-[13px] text-sm rounded-2 transition-colors duration-200"
              onClick={handleCopy}
              style={{ background: copied ? "var(--emerald)" : undefined }}
            >
              {copied ? "Copied ✓" : "Copy result"}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 p-[13px] text-sm rounded-2 border-none cursor-pointer font-semibold transition-colors duration-200"
              style={{
                background: copiedLink ? "rgba(100,180,100,0.25)" : "rgba(247,244,238,0.1)",
                color: copiedLink ? "#7dc97d" : "rgba(247,244,238,0.8)",
                boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.15)",
              }}
            >
              {copiedLink ? "Link copied ✓" : "Copy link"}
            </button>
            <button
              onClick={onClose}
              className="py-[13px] px-4 text-sm rounded-2 bg-paper-08 text-paper-40 border-none cursor-pointer"
              style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1)" }}
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
