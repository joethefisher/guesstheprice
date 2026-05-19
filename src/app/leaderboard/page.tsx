"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { Icon } from "@/components/Icons";
import type { LeaderboardResponse } from "@/app/api/leaderboard/route";

const TAB_LABELS = [
  { key: "scores", label: "High Scores" },
  { key: "streaks", label: "Streaks" },
] as const;
type Tab = (typeof TAB_LABELS)[number]["key"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const RANK_COLORS: Record<number, string> = {
  1: "var(--accent)",
  2: "#A0A0A0",
  3: "#C47F4A",
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("scores");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <header
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <button onClick={() => router.push("/")} aria-label="Home">
          <Wordmark size={20} />
        </button>
        <div className="eyebrow">Leaderboard</div>
        <button className="btn-icon" aria-label="Close" onClick={() => router.push("/")}>
          <Icon.X size={18} />
        </button>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <h1
            className="display m-0 mb-8"
            style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}
          >
            Who's the best<br />
            <span style={{ color: "var(--accent)" }}>price guesser?</span>
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="caption"
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                letterSpacing: "0.08em",
                background: tab === key ? "var(--ink)" : "rgba(26,26,26,0.06)",
                color: tab === key ? "var(--paper)" : "var(--ink-mute)",
                transition: "all 180ms cubic-bezier(0.32,0.72,0,1)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 14,
                  background: "var(--cream)",
                  opacity: 1 - i * 0.15,
                }}
              />
            ))}
          </div>
        )}

        {!loading && tab === "scores" && (
          <ScoresTable entries={data?.highScores ?? []} />
        )}
        {!loading && tab === "streaks" && (
          <StreaksTable entries={data?.streaks ?? []} />
        )}

        {!loading && tab === "scores" && (data?.highScores?.length ?? 0) === 0 && (
          <EmptyState message="No scores yet — play a game to get on the board." />
        )}
        {!loading && tab === "streaks" && (data?.streaks?.length ?? 0) === 0 && (
          <EmptyState message="No streaks yet — play the daily challenge to build yours." />
        )}
      </div>
    </div>
  );
}

function ScoresTable({ entries }: { entries: LeaderboardResponse["highScores"] }) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <motion.div
          key={e.username}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr auto",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            borderRadius: 14,
            background: i === 0 ? "rgba(212, 165, 116, 0.1)" : "var(--cream)",
            border: i === 0 ? "1px solid rgba(212, 165, 116, 0.25)" : "1px solid transparent",
          }}
        >
          <div
            className="tnum display"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: RANK_COLORS[e.rank] ?? "var(--ink-mute)",
              textAlign: "center",
            }}
          >
            {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--ink)" }}>
              @{e.username}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)", marginTop: 2 }}>
              {formatDate(e.completedAt)}
            </div>
          </div>
          <div
            className="tnum"
            style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--accent)" }}
          >
            {e.score.toLocaleString()}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StreaksTable({ entries }: { entries: LeaderboardResponse["streaks"] }) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <motion.div
          key={e.username}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr auto",
            alignItems: "center",
            gap: 16,
            padding: "16px 20px",
            borderRadius: 14,
            background: i === 0 ? "rgba(212, 165, 116, 0.1)" : "var(--cream)",
            border: i === 0 ? "1px solid rgba(212, 165, 116, 0.25)" : "1px solid transparent",
          }}
        >
          <div
            className="tnum display"
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: RANK_COLORS[e.rank] ?? "var(--ink-mute)",
              textAlign: "center",
            }}
          >
            {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--ink)" }}>
              @{e.username}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)", marginTop: 2 }}>
              {e.played.toLocaleString()} days played
            </div>
          </div>
          <div
            className="tnum"
            style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}
          >
            {e.bestStreak}
            <span style={{ fontSize: "var(--text-md)" }}>🔥</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--ink-mute)",
        fontSize: "var(--text-base)",
        background: "var(--cream)",
        borderRadius: 16,
      }}
    >
      {message}
    </div>
  );
}
