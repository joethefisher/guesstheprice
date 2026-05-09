import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/random?exclude=id1,id2
 *
 * Returns a random active listing, with photos.
 * Does NOT include soldPrice — the answer is server-only.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeParam = searchParams.get("exclude") || "";
  const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

  // Count eligible listings
  const totalCount = await prisma.listing.count({
    where: {
      isActive: true,
      qualityScore: { gte: 50 },
      id: excludeIds.length ? { notIn: excludeIds } : undefined
    }
  });

  if (totalCount === 0) {
    return NextResponse.json(
      { error: "no listings available" },
      { status: 404 }
    );
  }

  // Random offset (SQLite doesn't have RANDOM() ordering as efficiently as PG,
  // but for a few thousand listings this is fine)
  const skip = Math.floor(Math.random() * totalCount);

  const listing = await prisma.listing.findFirst({
    where: {
      isActive: true,
      qualityScore: { gte: 50 },
      id: excludeIds.length ? { notIn: excludeIds } : undefined
    },
    skip,
    include: {
      photos: { orderBy: { ordering: "asc" } }
    }
  });

  if (!listing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Strip the answer before sending to client
  const { soldPrice, soldDate, streetAddress, ...safe } = listing;

  return NextResponse.json({
    id: safe.id,
    neighborhood: safe.neighborhood,
    city: safe.city,
    state: safe.state,
    beds: safe.beds,
    baths: safe.baths,
    sqft: safe.sqft,
    lotSqft: safe.lotSqft,
    yearBuilt: safe.yearBuilt,
    homeType: safe.homeType,
    photos: safe.photos.map((p) => ({
      url: p.url,
      caption: p.caption
    }))
  });
}
