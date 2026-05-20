import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { recencyCutoffDate } from "@/lib/recency";

export interface HeroCandidate {
  photoUrl: string;
  neighborhood: string | null;
  city: string;
  state: string;
}

export interface TopScorer {
  username: string;
  score: number;
}

interface HeroRow {
  url: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
}

/**
 * Cached pool of ~20 hero candidates (high-priced active listings + their
 * primary photo), refreshed every 5 minutes. Render picks one at random from
 * the pool so every visitor still sees variety, but the DB is hit at most
 * once per 5 minutes for hero selection.
 */
export const getHeroPool = unstable_cache(
  async (): Promise<HeroCandidate[]> => {
    try {
      const cutoff = recencyCutoffDate();
      const rows = await prisma.$queryRaw<HeroRow[]>`
        WITH picked AS (
          SELECT id FROM "Listing"
          WHERE "isActive" = true
          AND "qualityScore" >= 50
          AND "soldDate" >= ${cutoff}
          AND "soldPrice" >= 1000000
          ORDER BY RANDOM()
          LIMIT 20
        )
        SELECT
          (SELECT url FROM "Photo" WHERE "listingId" = l.id ORDER BY ordering ASC LIMIT 1) AS url,
          l.neighborhood, l.city, l.state
        FROM "Listing" l
        JOIN picked ON picked.id = l.id
      `;
      return rows
        .filter((r) => r.url)
        .map((r) => ({
          photoUrl: r.url!.replace(/^http:\/\//, "https://"),
          neighborhood: r.neighborhood,
          city: r.city,
          state: r.state,
        }));
    } catch {
      return [];
    }
  },
  ["landing:hero-pool:v1"],
  { revalidate: 300, tags: ["landing:hero-pool"] }
);

/**
 * Cached top scorer for the landing strip. Refreshed every 5 minutes —
 * a new high score doesn't need to surface instantly.
 */
export const getTopScorer = unstable_cache(
  async (): Promise<TopScorer | null> => {
    try {
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
        return { username: g.user?.username ?? "unknown", score: g.totalScore! };
      }
      return null;
    } catch {
      return null;
    }
  },
  ["landing:top-scorer:v1"],
  { revalidate: 300, tags: ["landing:top-scorer"] }
);
