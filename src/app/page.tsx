import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";

interface TopScorer {
  username: string;
  score: number;
}

export const revalidate = 300; // ISR: serve from CDN cache, regenerate at most every 5 min

export default async function HomePage() {
  let listingCount = 0;
  let heroPhotoUrl: string | null = null;
  let heroLocation: { neighborhood: string | null; city: string; state: string } | null = null;
  let topScorer: TopScorer | null = null;

  try {
    listingCount = await prisma.listing.count({
      where: { isActive: true, qualityScore: { gte: 50 } },
    });

    const heroRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE "isActive" = true
      AND "qualityScore" >= 50
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

  return <LandingClient listingCount={listingCount} heroPhotoUrl={heroPhotoUrl} heroLocation={heroLocation} topScorer={topScorer} />;
}
