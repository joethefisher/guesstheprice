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
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-10 py-6 border-b border-rule">
        <button onClick={() => router.push("/")} aria-label="Home">
          <Wordmark size={20} />
        </button>
        <div className="eyebrow">Leaderboard</div>
        <button className="btn-icon" aria-label="Close" onClick={() => router.push("/")}>
          <Icon.X size={18} />
        </button>
      </header>

      <div className="max-w-default mx-auto py-12 px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <h1 className="display m-0 mb-8 leading-[0.95]" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Who's the best<br />
            <span className="text-accent">price guesser?</span>
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`caption py-2 px-[18px] rounded-pill text-sm font-semibold tracking-[0.08em] cursor-pointer transition-all duration-200 ${
                tab === key ? "bg-ink text-paper" : "bg-ink-06 text-ink-mute"
              }`}
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
                className="h-16 rounded-3 bg-cream"
                style={{ opacity: 1 - i * 0.15 }}
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
          className={`grid items-center gap-4 py-4 px-5 rounded-3 border ${
            i === 0
              ? "bg-[rgba(212,165,116,0.1)] border-[rgba(212,165,116,0.25)]"
              : "bg-cream border-transparent"
          }`}
          style={{ gridTemplateColumns: "44px 1fr auto" }}
        >
          <div
            className="tnum display text-lg font-bold text-center"
            style={{ color: RANK_COLORS[e.rank] ?? "var(--ink-mute)" }}
          >
            {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
          </div>
          <div>
            <div className="font-semibold text-base text-ink">
              @{e.username}
            </div>
            <div className="text-sm text-ink-mute mt-0.5">
              {formatDate(e.completedAt)}
            </div>
          </div>
          <div className="tnum text-lg font-bold text-accent">
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
          className={`grid items-center gap-4 py-4 px-5 rounded-3 border ${
            i === 0
              ? "bg-[rgba(212,165,116,0.1)] border-[rgba(212,165,116,0.25)]"
              : "bg-cream border-transparent"
          }`}
          style={{ gridTemplateColumns: "44px 1fr auto" }}
        >
          <div
            className="tnum display text-lg font-bold text-center"
            style={{ color: RANK_COLORS[e.rank] ?? "var(--ink-mute)" }}
          >
            {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : `#${e.rank}`}
          </div>
          <div>
            <div className="font-semibold text-base text-ink">
              @{e.username}
            </div>
            <div className="text-sm text-ink-mute mt-0.5">
              {e.played.toLocaleString()} days played
            </div>
          </div>
          <div className="tnum text-lg font-bold text-accent flex items-center gap-1.5">
            {e.bestStreak}
            <span className="text-md">🔥</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 px-6 text-center text-ink-mute text-base bg-cream rounded-4">
      {message}
    </div>
  );
}
