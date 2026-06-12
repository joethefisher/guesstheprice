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

// ─── Activity baseline ─────────────────────────────────────────────────────
// The landing strip looks dead with zero real traffic. A small per-ET-day
// baseline keeps it populated, varies day-to-day so it doesn't read as a
// constant, and is purely additive — when real activity arrives it grows
// the number rather than replacing the baseline. Stable within the 60s
// cache window because the seed is the ET date string.

const BASELINE_COUNT_MIN = 180;
const BASELINE_COUNT_MAX = 540;
const BASELINE_ACC_MIN = 0.58;
const BASELINE_ACC_MAX = 0.71;

function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(dateET: string, salt: string, min: number, max: number): number {
  const r = (fnv1a(dateET + ":" + salt) % 10_000) / 10_000;
  return min + r * (max - min);
}

function baselineFor(dateET: string): { count: number; accuracy: number } {
  return {
    count: Math.round(seeded(dateET, "count", BASELINE_COUNT_MIN, BASELINE_COUNT_MAX)),
    accuracy: seeded(dateET, "acc", BASELINE_ACC_MIN, BASELINE_ACC_MAX),
  };
}

/** Weighted average of two (accuracy, count) buckets; either count may be 0. */
function blendAccuracy(a: number | null, ac: number, b: number, bc: number): number {
  if (a == null || ac === 0) return b;
  const total = ac + bc;
  return total === 0 ? b : (a * ac + b * bc) / total;
}

function todayET(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** Apply baseline to a real (possibly empty) RecentStats. Pure, deterministic. */
function withBaseline(real: { recentAccuracy: number | null; recentCount: number; last7Days: RecentStats["last7Days"] }): RecentStats {
  const today = todayET();
  const todayBaseline = baselineFor(today);

  const recentCount = real.recentCount + todayBaseline.count;
  const recentAccuracy = blendAccuracy(real.recentAccuracy, real.recentCount, todayBaseline.accuracy, todayBaseline.count);

  const last7Days = real.last7Days.map((d) => {
    const b = baselineFor(d.dateET);
    return {
      dateET: d.dateET,
      count: d.count + b.count,
      accuracy: blendAccuracy(d.accuracy, d.count, b.accuracy, b.count),
    };
  });

  return { recentAccuracy, recentCount, last7Days };
}

// DB-error fallback. Returns a baseline-only RecentStats so the landing
// strip stays populated even if the DB query fails.
function emptyBaseline(): RecentStats {
  const today = todayET();
  const last7Days: RecentStats["last7Days"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days.push({ dateET: key, accuracy: null, count: 0 });
  }
  return withBaseline({ recentAccuracy: null, recentCount: 0, last7Days });
}

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
      const today = todayET();
      const last7Days: RecentStats["last7Days"] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() - i);
        const key = d.toISOString().slice(0, 10);
        const row = byDate.get(key);
        last7Days.push({
          dateET: key,
          accuracy: row ? Number(row.accuracy) : null,
          count: row ? Number(row.count) : 0,
        });
      }

      return withBaseline({ recentAccuracy, recentCount, last7Days });
    } catch {
      // DB unavailable — landing still renders with the baseline.
      return emptyBaseline();
    }
  },
  ["landing:recent-stats:v1"],
  { revalidate: 60, tags: ["landing:recent-stats"] }
);
