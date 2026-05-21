import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { hashDateString, getDailyNumber } from "@/lib/daily/service";
import { countEligibleListings, fetchDailyListing } from "@/lib/listing-fetch";
import type { ListingPublic } from "@/lib/game";

export const dynamic = "force-dynamic";

interface DailyPayload {
  dailyNumber: number;
  dateET: string;
  listing: ListingPublic;
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

    const count = await countEligibleListings();
    if (count === null) return { error: "db error" };
    if (count === 0) return { error: "no listings available" };

    const offset = hashDateString(todayET) % count;
    const listing = await fetchDailyListing(offset);
    if (listing === null) return { error: "db error" };

    return { dailyNumber, dateET: todayET, listing };
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
