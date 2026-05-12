import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/batch?count=5
 *
 * Returns N random active listings with photos in 2 DB queries instead of 2×N.
 * Used by the landing page to prefetch a full game session into sessionStorage.
 * Does NOT include soldPrice or streetAddress.
 */
export async function GET(req: NextRequest) {
  const count = Math.min(10, Math.max(1, parseInt(req.nextUrl.searchParams.get("count") ?? "5", 10) || 5));

  let rows: Array<{ id: string }>;
  try {
    rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE "isActive" = true
      AND "qualityScore" >= 50
      ORDER BY RANDOM()
      LIMIT ${count}
    `;
  } catch {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (!rows.length) {
    return NextResponse.json({ error: "no listings available" }, { status: 404 });
  }

  const listings = await prisma.listing.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: {
      id: true,
      neighborhood: true,
      city: true,
      state: true,
      beds: true,
      baths: true,
      sqft: true,
      lotSqft: true,
      yearBuilt: true,
      homeType: true,
      photos: {
        select: { url: true, caption: true },
        orderBy: { ordering: "asc" },
      },
    },
  });

  return NextResponse.json({ listings });
}
