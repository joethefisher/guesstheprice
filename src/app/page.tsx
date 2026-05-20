import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";
import { recencyCutoffDate } from "@/lib/recency";

interface TopScorer {
  username: string;
  score: number;
}

export interface RecentStats {
  /** Average accuracy (0..1) across all rounds in the trailing 24h. Null if 0 rounds. */
  recentAccuracy: number | null;
  /** Round count in the trailing 24h. */
  recentCount: number;
  /** 7 trailing ET days, oldest → newest. Days with no plays have accuracy: null, count: 0. */
  last7Days: { dateET: string; accuracy: number | null; count: number }[];
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let heroPhotoUrl: string | null = null;
  let heroLocation: { neighborhood: string | null; city: string; state: string } | null = null;
  let topScorer: TopScorer | null = null;
  let recentStats: RecentStats = { recentAccuracy: null, recentCount: 0, last7Days: [] };

  const cutoff = recencyCutoffDate();

  try {
    const heroRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE "isActive" = true
      AND "qualityScore" >= 50
      AND "soldDate" >= ${cutoff}
      AND "soldPrice" >= 1000000
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (heroRows.length > 0) {
      const hero = await prisma.listing.findUnique({
        where: { id: heroRows[0].id },
        include: { photos: { orderBy: { ordering: "asc" }, take: 1 } },
      });
      if (hero) {
        const rawUrl = hero.photos[0]?.url ?? null;
        heroPhotoUrl = rawUrl ? rawUrl.replace(/^http:\/\//, "https://") : null;
        heroLocation = { neighborhood: hero.neighborhood, city: hero.city, state: hero.state };
      }
    }

    // Top scorer for the landing strip
    const topGames = await prisma.game.findMany({
      where: {
        completedAt: { not: null },
        userId: { not: null },
        totalScore: { not: null },
        gameType: "freeplay",
      },
      orderBy: { totalScore: "desc" },
      take: 50,
      select: {
        userId: true,
        totalScore: true,
        user: { select: { username: true } },
      },
    });
    const seen = new Set<string>();
    for (const g of topGames) {
      if (!g.userId || seen.has(g.userId)) continue;
      seen.add(g.userId);
      topScorer = { username: g.user?.username ?? "unknown", score: g.totalScore! };
      break;
    }

    // "Around the world" aggregate — anonymous + signed-in rounds combined.
    // Accuracy is clamped to [0,1] so wild guesses don't drag the mean negative.
    const recentRow = await prisma.$queryRaw<Array<{ accuracy: number | null; count: bigint }>>`
      SELECT
        AVG(GREATEST(0, 1 - ABS(r.guess - l."soldPrice")::float / l."soldPrice")) AS accuracy,
        COUNT(*) AS count
      FROM "Round" r
      JOIN "Listing" l ON r."listingId" = l.id
      WHERE r."guessedAt" >= NOW() - INTERVAL '24 hours'
        AND r.guess IS NOT NULL
        AND l."soldPrice" > 0
    `;
    const recentCount = Number(recentRow[0]?.count ?? 0n);
    const recentAccuracy = recentCount > 0 ? recentRow[0].accuracy : null;

    // Sparkline: last 7 ET days, day-bucketed. Today (the rightmost point) shares
    // its window with the headline number when last24h ≈ today; close enough.
    const dailyRows = await prisma.$queryRaw<Array<{ date_et: string; accuracy: number; count: bigint }>>`
      SELECT
        to_char((r."guessedAt" AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS date_et,
        AVG(GREATEST(0, 1 - ABS(r.guess - l."soldPrice")::float / l."soldPrice")) AS accuracy,
        COUNT(*) AS count
      FROM "Round" r
      JOIN "Listing" l ON r."listingId" = l.id
      WHERE r."guessedAt" >= (NOW() AT TIME ZONE 'America/New_York')::date - INTERVAL '6 days'
        AND r.guess IS NOT NULL
        AND l."soldPrice" > 0
      GROUP BY date_et
      ORDER BY date_et
    `;
    // Build a contiguous 7-day window (oldest→newest, ET) so the sparkline is
    // always 7 points wide even on days with no plays.
    const byDate = new Map(dailyRows.map((r) => [r.date_et, r]));
    const todayET = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    const last7Days: RecentStats["last7Days"] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayET + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = byDate.get(key);
      last7Days.push({
        dateET: key,
        accuracy: row ? Number(row.accuracy) : null,
        count: row ? Number(row.count) : 0,
      });
    }
    recentStats = { recentAccuracy, recentCount, last7Days };
  } catch {
    // DB unavailable — landing still renders with fallback photo
  }

  return <LandingClient heroPhotoUrl={heroPhotoUrl} heroLocation={heroLocation} topScorer={topScorer} recentStats={recentStats} />;
}
