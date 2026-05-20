import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export interface RecentStats {
  /** Average accuracy (0..1) across all rounds in the trailing 24h. Null if 0 rounds. */
  recentAccuracy: number | null;
  /** Round count in the trailing 24h. */
  recentCount: number;
  /** 7 trailing ET days, oldest → newest. Days with no plays have accuracy: null, count: 0. */
  last7Days: { dateET: string; accuracy: number | null; count: number }[];
}

const EMPTY: RecentStats = { recentAccuracy: null, recentCount: 0, last7Days: [] };

/**
 * "Around the world" landing aggregate — rolling-24h average accuracy plus
 * 7 ET-day buckets for the sparkline. Reads the materialised Round.accuracy
 * column (set at score time) so no Listing join is needed at read time.
 *
 * Wrapped in unstable_cache with a 60s TTL: the landing is server-rendered
 * on every visit and we don't want a Postgres round trip per render once
 * traffic picks up. 60s lag on a "last 24 hours" stat is invisible to users.
 */
export const getRecentStats = unstable_cache(
  async (): Promise<RecentStats> => {
    try {
      const recentRow = await prisma.$queryRaw<Array<{ accuracy: number | null; count: bigint }>>`
        SELECT
          AVG(accuracy) AS accuracy,
          COUNT(*) AS count
        FROM "Round"
        WHERE "guessedAt" >= NOW() - INTERVAL '24 hours'
          AND accuracy IS NOT NULL
      `;
      const recentCount = Number(recentRow[0]?.count ?? 0n);
      const recentAccuracy = recentCount > 0 ? Number(recentRow[0].accuracy) : null;

      const dailyRows = await prisma.$queryRaw<Array<{ date_et: string; accuracy: number; count: bigint }>>`
        SELECT
          to_char(("guessedAt" AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS date_et,
          AVG(accuracy) AS accuracy,
          COUNT(*) AS count
        FROM "Round"
        WHERE "guessedAt" >= (NOW() AT TIME ZONE 'America/New_York')::date - INTERVAL '6 days'
          AND accuracy IS NOT NULL
        GROUP BY date_et
        ORDER BY date_et
      `;

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

      return { recentAccuracy, recentCount, last7Days };
    } catch {
      // DB unavailable — landing still renders, just without the stat.
      return EMPTY;
    }
  },
  ["landing:recent-stats:v1"],
  { revalidate: 60, tags: ["landing:recent-stats"] }
);
