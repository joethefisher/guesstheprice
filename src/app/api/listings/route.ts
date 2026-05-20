import { NextRequest, NextResponse } from "next/server";
import { fetchOneListing } from "@/lib/listing-fetch";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings?exclude=id1,id2
 *
 * Returns a random active listing with photos in a single DB round-trip via
 * the shared fetchOneListing helper. Does NOT include soldPrice — the answer
 * is server-only.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") || "";
  const excludeIds = excludeParam
    ? excludeParam.split(",").filter(Boolean).slice(0, 50)
    : [];

  const listing = await fetchOneListing({ exclude: excludeIds });
  if (!listing) {
    return NextResponse.json({ error: "no listings available" }, { status: 404 });
  }
  return NextResponse.json(listing);
}
