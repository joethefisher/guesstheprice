import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bucketEmoji, accuracyToBucket } from "@/lib/daily/service";
import type { AccuracyBucket } from "@/lib/daily/service";

export const dynamic = "force-dynamic";

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

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
      select: { id: true, totalScore: true, completedAt: true, totalRounds: true },
    }),
    prisma.game.findFirst({
      where: { userId, completedAt: { not: null }, totalScore: { not: null }, gameType: "freeplay" },
      orderBy: { totalScore: "desc" },
      select: { totalScore: true, completedAt: true },
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
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <header
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="display" style={{ fontSize: "var(--text-lg)", fontStyle: "italic", color: "var(--ink)" }}>
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

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>
        {/* Hero: username + member since */}
        <div className="mb-12">
          <div className="eyebrow mb-3" style={{ color: "var(--ink-mute)" }}>Member since {memberSince}</div>
          <h1 className="display m-0" style={{ fontSize: "clamp(44px, 7vw, 88px)", lineHeight: 0.9 }}>
            @{user.username}
          </h1>
        </div>

        {/* Stat cards row */}
        <div
          className="grid gap-4 mb-10"
          style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
        >
          {[
            { label: "Best score", value: bestGame?.totalScore?.toLocaleString() ?? "—", sub: "freeplay" },
            { label: "Games played", value: recentGames.length > 0 ? `${recentGames.length}+` : "0", sub: "freeplay" },
            { label: "Day streak", value: dailyProgress?.currentStreak?.toString() ?? "0", sub: "current" },
            { label: "Best streak", value: dailyProgress?.bestStreak?.toString() ?? "0", sub: "all-time" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "var(--cream)",
                borderRadius: 16,
                padding: "20px 22px",
              }}
            >
              <div className="eyebrow mb-2" style={{ color: "var(--ink-mute)" }}>{s.label}</div>
              <div className="display tnum" style={{ fontSize: "var(--text-2xl)", color: "var(--ink)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-quiet)", marginTop: 4, fontWeight: 500 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Daily accuracy distribution */}
          <div
            style={{
              background: "var(--cream)",
              borderRadius: 20,
              padding: "24px",
            }}
          >
            <div className="eyebrow mb-4" style={{ color: "var(--ink-mute)" }}>Daily accuracy breakdown</div>
            {totalDistribution === 0 ? (
              <div style={{ color: "var(--ink-quiet)", fontSize: "var(--text-sm)", padding: "16px 0" }}>
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
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)", fontWeight: 500 }}>
                          {bucketEmoji(b)} {BUCKET_LABELS[b]}
                        </div>
                        <div className="tnum" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>
                          {count}
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: "rgba(26,26,26,0.08)" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            width: `${pct}%`,
                            background: BUCKET_COLOR[b],
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent daily history */}
          <div
            style={{
              background: "var(--cream)",
              borderRadius: 20,
              padding: "24px",
            }}
          >
            <div className="eyebrow mb-4" style={{ color: "var(--ink-mute)" }}>Last 14 days</div>
            {recentHistory.every((v) => v == null) ? (
              <div style={{ color: "var(--ink-quiet)", fontSize: "var(--text-sm)", padding: "16px 0" }}>
                No daily games played yet.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {recentHistory.map((v, i) => {
                  const bg = v == null ? "rgba(26,26,26,0.06)" : BUCKET_COLOR[accuracyToBucket(v)] + "33";
                  const border = v == null ? "1px solid rgba(26,26,26,0.08)" : `1px solid ${BUCKET_COLOR[accuracyToBucket(v)]}55`;
                  return (
                    <div
                      key={i}
                      title={v != null ? `${v}% accuracy` : "Missed"}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: bg,
                        border,
                        display: "grid",
                        placeItems: "center",
                        fontSize: "var(--text-md)",
                        cursor: "default",
                      }}
                    >
                      {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                    </div>
                  );
                })}
              </div>
            )}
            {dailyProgress && (
              <div style={{ marginTop: 16, fontSize: "var(--text-sm)", color: "var(--ink-mute)" }}>
                {dailyProgress.played} total days played
              </div>
            )}
          </div>
        </div>

        {/* Recent freeplay games */}
        {recentGames.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="eyebrow mb-4" style={{ color: "var(--ink-mute)" }}>Recent freeplay games</div>
            <div className="flex flex-col gap-2">
              {recentGames.map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr auto",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: i === 0 && bestGame?.totalScore === g.totalScore
                      ? "rgba(212,165,116,0.08)"
                      : "var(--cream)",
                    border: i === 0 && bestGame?.totalScore === g.totalScore
                      ? "1px solid rgba(212,165,116,0.2)"
                      : "1px solid transparent",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-quiet)", fontWeight: 600, textAlign: "center" }}>
                    #{i + 1}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-mute)" }}>
                    {new Date(g.completedAt!).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {i === 0 && bestGame?.totalScore === g.totalScore && (
                      <span style={{ marginLeft: 8, fontSize: "var(--text-xs)", color: "var(--accent)", fontWeight: 700 }}>
                        Personal best
                      </span>
                    )}
                  </div>
                  <div className="tnum" style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--accent)" }}>
                    {g.totalScore?.toLocaleString() ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Play CTAs */}
        <div className="flex gap-4 mt-10">
          <Link
            href="/play"
            className="btn btn-primary"
            style={{ fontSize: "var(--text-base)", justifyContent: "space-between", flex: 1 }}
          >
            <span>Play freeplay</span>
            <span>→</span>
          </Link>
          <Link
            href="/daily"
            className="btn btn-secondary"
            style={{ fontSize: "var(--text-sm)", flex: 1 }}
          >
            Today's daily
          </Link>
          <Link
            href="/leaderboard"
            className="btn btn-secondary"
            style={{ fontSize: "var(--text-sm)" }}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
