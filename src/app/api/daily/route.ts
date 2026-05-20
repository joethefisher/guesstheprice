import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { hashDateString, getDailyNumber } from "@/lib/daily/service";
import { recencyCutoffDate } from "@/lib/recency";
import { buildMapBlock } from "@/lib/map";

export const dynamic = "force-dynamic";

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

interface DailyPayload {
  dailyNumber: number;
  dateET: string;
  listing: {
    id: string;
    neighborhood: string | null;
    city: string;
    state: string;
    beds: number;
    baths: number;
    sqft: number | null;
    lotSqft: number | null;
    yearBuilt: number | null;
    yearSold: number | null;
    homeType: string | null;
    photos: { url: string; thumbnailUrl: string | null; caption: string | null }[];
    map: ReturnType<typeof buildMapBlock>;
  };
}

/**
 * Compute today's deterministic daily listing and serialise it for the wire.
 * Wrapped in unstable_cache keyed on the ET date so the same listing isn't
 * recomputed every request — the daily is identical for all callers within
 * a calendar day in America/New_York. 24h TTL.
 */
const getCachedDaily = unstable_cache(
  async (todayET: string): Promise<DailyPayload | { error: string }> => {
    const dailyNumber = getDailyNumber(todayET);
    const cutoff = recencyCutoffDate();

    let count: number;
    try {
      count = await prisma.listing.count({
        where: { isActive: true, qualityScore: { gte: 50 }, soldDate: { gte: cutoff } },
      });
    } catch {
      return { error: "db error" };
    }
    if (count === 0) return { error: "no listings available" };

    const hash = hashDateString(todayET);
    const offset = hash % count;

    interface DailyRow {
      id: string;
      neighborhood: string | null;
      city: string;
      state: string;
      beds: number;
      baths: number;
      sqft: number | null;
      lotSqft: number | null;
      yearBuilt: number | null;
      homeType: string | null;
      soldDate: Date | null;
      latitude: number | null;
      longitude: number | null;
      photos: { url: string; thumbnailUrl: string | null; caption: string | null }[];
    }

    // Single CTE: pick deterministic id by offset, join Listing + JSON-aggregate
    // its photos in one round-trip. Half the Supabase latency of the prior
    // (raw id-query → findUnique-with-include) pair.
    let rows: DailyRow[];
    try {
      rows = await prisma.$queryRaw<DailyRow[]>`
        WITH picked AS (
          SELECT id FROM "Listing"
          WHERE "isActive" = true
          AND "qualityScore" >= 50
          AND "soldDate" >= ${cutoff}
          ORDER BY id
          LIMIT 1
          OFFSET ${offset}
        )
        SELECT
          l.id, l.neighborhood, l.city, l.state, l.beds, l.baths,
          l.sqft, l."lotSqft", l."yearBuilt", l."homeType", l."soldDate",
          l.latitude, l.longitude,
          COALESCE(
            (SELECT json_agg(json_build_object(
               'url', p.url,
               'thumbnailUrl', p."thumbnailUrl",
               'caption', p.caption
             ) ORDER BY p.ordering)
             FROM "Photo" p WHERE p."listingId" = l.id),
            '[]'::json
          ) AS photos
        FROM "Listing" l
        JOIN picked ON picked.id = l.id
      `;
    } catch {
      return { error: "db error" };
    }
    if (!rows.length) return { error: "listing not found" };
    const l = rows[0];

    return {
      dailyNumber,
      dateET: todayET,
      listing: {
        id: l.id,
        neighborhood: l.neighborhood,
        city: l.city,
        state: l.state,
        beds: l.beds,
        baths: l.baths,
        sqft: l.sqft,
        lotSqft: l.lotSqft,
        yearBuilt: l.yearBuilt,
        yearSold: l.soldDate ? new Date(l.soldDate).getUTCFullYear() : null,
        homeType: l.homeType,
        photos: l.photos.map((p) => ({
          url: toHttps(p.url),
          thumbnailUrl: p.thumbnailUrl ? toHttps(p.thumbnailUrl) : null,
          caption: p.caption,
        })),
        map: buildMapBlock(l.latitude, l.longitude),
      },
    };
  },
  ["api:daily:v1"],
  { revalidate: 86400, tags: ["api:daily"] }
);

/**
 * GET /api/daily
 *
 * Returns the deterministic daily listing for today (ET).
 * Same listing is returned for all callers on the same ET calendar day.
 * soldPrice is NOT included — the /api/score endpoint reveals it.
 */
export async function GET() {
  const todayET = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const result = await getCachedDaily(todayET);

  if ("error" in result) {
    const status = result.error === "db error" ? 500 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
