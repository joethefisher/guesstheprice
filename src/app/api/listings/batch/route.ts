import { NextRequest, NextResponse } from "next/server";
import { fetchListingsBatch } from "@/lib/listing-fetch";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/batch?count=5
 *
 * Returns N random active listings with photos in a single DB round-trip
 * via the shared fetchListingsBatch helper. Used by the landing page to
 * warm sessionStorage with a full game's worth of listings before the
 * user clicks Play.
 *
 * Does NOT include soldPrice or streetAddress.
 */
export async function GET(req: NextRequest) {
  const count = parseInt(req.nextUrl.searchParams.get("count") ?? "5", 10) || 5;
  const listings = await fetchListingsBatch(count);
  if (listings === null) {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }
  if (listings.length === 0) {
    return NextResponse.json({ error: "no listings available" }, { status: 404 });
  }
  return NextResponse.json({ listings });
}
