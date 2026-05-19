import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recencyCutoffDate } from "@/lib/recency";

export const dynamic = "force-dynamic";

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

/**
 * GET /api/listings?exclude=id1,id2
 *
 * Returns a random active listing, with photos.
 * Does NOT include soldPrice — the answer is server-only.
 *
 * Uses ORDER BY RANDOM() LIMIT 1 — a single atomic query that eliminates the
 * TOCTOU race between count() and findFirst(skip) that occurred under concurrent load.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") || "";
  // Cap at 50 to prevent oversized NOT IN clauses
  const excludeIds = excludeParam
    ? excludeParam.split(",").filter(Boolean).slice(0, 50)
    : [];

  const cutoff = recencyCutoffDate();

  let rows: Array<{ id: string }>;
  try {
    if (excludeIds.length > 0) {
      rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Listing"
        WHERE "isActive" = true
        AND "qualityScore" >= 50
        AND "soldDate" >= ${cutoff}
        AND id NOT IN (${Prisma.join(excludeIds)})
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else {
      rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Listing"
        WHERE "isActive" = true
        AND "qualityScore" >= 50
        AND "soldDate" >= ${cutoff}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    }
  } catch {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (!rows.length) {
    return NextResponse.json(
      { error: "no listings available" },
      { status: 404 }
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: rows[0].id },
    include: { photos: { orderBy: { ordering: "asc" } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: listing.id,
    neighborhood: listing.neighborhood,
    city: listing.city,
    state: listing.state,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft,
    lotSqft: listing.lotSqft,
    yearBuilt: listing.yearBuilt,
    homeType: listing.homeType,
    photos: listing.photos.map((p) => ({
      url: toHttps(p.url),
      caption: p.caption,
    })),
  });
}
