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

    let rows: Array<{ id: string }>;
    try {
      rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Listing"
        WHERE "isActive" = true
        AND "qualityScore" >= 50
        AND "soldDate" >= ${cutoff}
        ORDER BY id
        LIMIT 1
        OFFSET ${offset}
      `;
    } catch {
      return { error: "db error" };
    }
    if (!rows.length) return { error: "listing not found" };

    const listing = await prisma.listing.findUnique({
      where: { id: rows[0].id },
      include: { photos: { orderBy: { ordering: "asc" } } },
    });
    if (!listing) return { error: "listing not found" };

    return {
      dailyNumber,
      dateET: todayET,
      listing: {
        id: listing.id,
        neighborhood: listing.neighborhood,
        city: listing.city,
        state: listing.state,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        lotSqft: listing.lotSqft,
        yearBuilt: listing.yearBuilt,
        yearSold: listing.soldDate ? listing.soldDate.getUTCFullYear() : null,
        homeType: listing.homeType,
        photos: listing.photos.map((p) => ({
          url: toHttps(p.url),
          thumbnailUrl: p.thumbnailUrl ? toHttps(p.thumbnailUrl) : null,
          caption: p.caption,
        })),
        map: buildMapBlock(listing.latitude, listing.longitude),
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
