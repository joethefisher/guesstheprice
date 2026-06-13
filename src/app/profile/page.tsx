import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bucketEmoji, accuracyToBucket } from "@/lib/daily/service";
import type { AccuracyBucket } from "@/lib/daily/service";

export const dynamic = "force-dynamic";

// Profile is gated behind auth; tell crawlers not to index it (the robots.ts
// already disallows /profile but per-page noindex is the belt-and-suspenders).
export const metadata: Metadata = {
  title: "Profile — Pricetag",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: true },
};

const BUCKET_LABELS: Record<AccuracyBucket, string> = {
  "90+": "90%+",
  "80": "80–89%",
  "70": "70–79%",
  "60": "60–69%",
  "50": "50–59%",
  "<50": "Under 50%",
};

const BUCKET_COLOR: Record<AccuracyBucket, string> = {
  "90+": "#4CAF50",
  "80": "#8BC34A",
  "70": "#FFC107",
  "60": "#FF9800",
  "50": "#FF5722",
  "<50": "#9E9E9E",
};

const BUCKETS: AccuracyBucket[] = ["90+", "80", "70", "60", "50", "<50"];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/profile");
  }

  const userId = session.user.id;

  const [user, dailyProgress, recentGames, bestGame] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, createdAt: true },
    }),
    prisma.userDailyProgress.findUnique({
      where: { userId },
    }),
    prisma.game.findMany({
      where: { userId, completedAt: { not: null }, gameType: "freeplay" },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        totalScore: true,
        completedAt: true,
        totalRounds: true,
        avgAccuracy: true,
        bestRoundAcc: true,
      },
    }),
    prisma.game.findFirst({
      where: { userId, completedAt: { not: null }, totalScore: { not: null }, gameType: "freeplay" },
      orderBy: { totalScore: "desc" },
      select: { totalScore: true, completedAt: true, avgAccuracy: true },
    }),
  ]);

  if (!user) redirect("/");

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const distribution = (dailyProgress?.distribution ?? {}) as Record<AccuracyBucket, number>;
  const totalDistribution = BUCKETS.reduce((s, b) => s + (distribution[b] ?? 0), 0);

  const history = (dailyProgress?.history ?? []) as (number | null)[];
  const recentHistory = history.slice(-14);

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-10 py-6 border-b border-rule">
        <Link href="/" className="no-underline">
          <span className="display text-lg italic text-ink">
            Pricetag
          </span>
        </Link>
        <div className="eyebrow">Profile</div>
        <Link href="/" className="btn-icon" aria-label="Home">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </Link>
      </header>

      <div className="max-w-default mx-auto py-12 px-8">
        {/* Hero: username + member since */}
        <div className="mb-12">
          <div className="eyebrow mb-3 text-ink-mute">Member since {memberSince}</div>
          <h1 className="display m-0 leading-[0.9]" style={{ fontSize: "clamp(44px, 7vw, 88px)" }}>
            @{user.username}
          </h1>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "Best score", value: bestGame?.totalScore?.toLocaleString() ?? "—", sub: "freeplay" },
            { label: "Games played", value: recentGames.length > 0 ? `${recentGames.length}+` : "0", sub: "freeplay" },
            { label: "Day streak", value: dailyProgress?.currentStreak?.toString() ?? "0", sub: "current" },
            { label: "Best streak", value: dailyProgress?.bestStreak?.toString() ?? "0", sub: "all-time" },
          ].map((s) => (
            <div key={s.label} className="bg-cream rounded-4 py-5 px-[22px]">
              <div className="eyebrow mb-2 text-ink-mute">{s.label}</div>
              <div className="display tnum text-2xl text-ink leading-none">
                {s.value}
              </div>
              <div className="text-xs text-ink-quiet mt-1 font-medium">
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Daily accuracy distribution */}
          <div className="bg-cream rounded-6 p-6">
            <div className="eyebrow mb-4 text-ink-mute">Daily accuracy breakdown</div>
            {totalDistribution === 0 ? (
              <div className="text-ink-quiet text-sm py-4">
                No daily games played yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {BUCKETS.map((b) => {
                  const count = distribution[b] ?? 0;
                  const pct = totalDistribution > 0 ? (count / totalDistribution) * 100 : 0;
                  return (
                    <div key={b}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-ink-mute font-medium">
                          {bucketEmoji(b)} {BUCKET_LABELS[b]}
                        </div>
                        <div className="tnum text-sm font-semibold text-ink">
                          {count}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-pill bg-ink-08">
                        <div
                          className="h-full rounded-pill transition-[width] duration-500 ease-out"
                          style={{ width: `${pct}%`, background: BUCKET_COLOR[b] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent daily history */}
          <div className="bg-cream rounded-6 p-6">
            <div className="eyebrow mb-4 text-ink-mute">Last 14 days</div>
            {recentHistory.every((v) => v == null) ? (
              <div className="text-ink-quiet text-sm py-4">
                No daily games played yet.
              </div>
            ) : (
              <div className="flex gap-1 flex-wrap">
                {recentHistory.map((v, i) => {
                  const bg = v == null ? "rgba(26,26,26,0.06)" : BUCKET_COLOR[accuracyToBucket(v)] + "33";
                  const border = v == null ? "1px solid rgba(26,26,26,0.08)" : `1px solid ${BUCKET_COLOR[accuracyToBucket(v)]}55`;
                  return (
                    <div
                      key={i}
                      title={v != null ? `${v}% accuracy` : "Missed"}
                      className="w-9 h-9 rounded-lg grid place-items-center text-md cursor-default"
                      style={{ background: bg, border }}
                    >
                      {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                    </div>
                  );
                })}
              </div>
            )}
            {dailyProgress && (
              <div className="mt-4 text-sm text-ink-mute">
                {dailyProgress.played} total days played
              </div>
            )}
          </div>
        </div>

        {/* Recent freeplay games */}
        {recentGames.length > 0 && (
          <div className="mt-8">
            <div className="eyebrow mb-4 text-ink-mute">Recent freeplay games</div>
            <div className="flex flex-col gap-2">
              {recentGames.map((g, i) => {
                const isBest = i === 0 && bestGame?.totalScore === g.totalScore;
                return (
                  <div
                    key={g.id}
                    className={`grid items-center gap-4 px-[18px] py-3.5 rounded-2 border ${
                      isBest
                        ? "bg-[rgba(212,165,116,0.08)] border-[rgba(212,165,116,0.2)]"
                        : "bg-cream border-transparent"
                    }`}
                    style={{ gridTemplateColumns: "32px 1fr auto" }}
                  >
                    <div className="text-xs text-ink-quiet font-semibold text-center">
                      #{i + 1}
                    </div>
                    <div className="text-sm text-ink-mute">
                      {new Date(g.completedAt!).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {isBest && (
                        <span className="ml-2 text-xs text-accent font-bold">
                          Personal best
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="tnum text-md font-bold text-accent">
                        {g.totalScore?.toLocaleString() ?? "—"}
                      </div>
                      {g.avgAccuracy != null && (
                        <div className="tnum text-xs text-ink-quiet font-medium">
                          {Math.round(g.avgAccuracy * 100)}% avg
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Play CTAs */}
        <div className="flex gap-4 mt-10">
          <Link href="/play" className="btn btn-primary text-base justify-between flex-1">
            <span>Play freeplay</span>
            <span>→</span>
          </Link>
          <Link href="/daily" className="btn btn-secondary text-sm flex-1">
            Today's daily
          </Link>
          <Link href="/leaderboard" className="btn btn-secondary text-sm">
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
