import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recencyCutoffDate } from "@/lib/recency";
import { buildMapBlock } from "@/lib/map";

export const dynamic = "force-dynamic";

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

interface ListingRow {
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

/**
 * GET /api/listings/batch?count=5
 *
 * Returns N random active listings with photos in a single DB round-trip via
 * a CTE + JSON aggregation. Used by the landing page to warm sessionStorage
 * with a full game's worth of listings before the user clicks Play.
 *
 * Does NOT include soldPrice or streetAddress.
 */
export async function GET(req: NextRequest) {
  const count = Math.min(10, Math.max(1, parseInt(req.nextUrl.searchParams.get("count") ?? "5", 10) || 5));

  const cutoff = recencyCutoffDate();

  let rows: ListingRow[];
  try {
    rows = await prisma.$queryRaw<ListingRow[]>`
      WITH picked AS (
        SELECT id FROM "Listing"
        WHERE "isActive" = true
        AND "qualityScore" >= 50
        AND "soldDate" >= ${cutoff}
        ORDER BY RANDOM()
        LIMIT ${count}
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
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (!rows.length) {
    return NextResponse.json({ error: "no listings available" }, { status: 404 });
  }

  return NextResponse.json({
    listings: rows.map((l) => ({
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
    })),
  });
}
