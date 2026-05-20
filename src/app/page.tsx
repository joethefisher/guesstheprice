import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";
import { recencyCutoffDate } from "@/lib/recency";
import { getRecentStats } from "@/lib/landing-stats";
export type { RecentStats } from "@/lib/landing-stats";

interface TopScorer {
  username: string;
  score: number;
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let heroPhotoUrl: string | null = null;
  let heroLocation: { neighborhood: string | null; city: string; state: string } | null = null;
  let topScorer: TopScorer | null = null;

  const cutoff = recencyCutoffDate();
  // Cached helper — own 60s TTL, so landing renders don't hit the DB for stats every time.
  const recentStats = await getRecentStats();

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
  } catch {
    // DB unavailable — landing still renders with fallback photo
  }

  return <LandingClient heroPhotoUrl={heroPhotoUrl} heroLocation={heroLocation} topScorer={topScorer} recentStats={recentStats} />;
}
