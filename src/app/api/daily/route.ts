import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashDateString, getDailyNumber } from "@/lib/daily/service";

export const dynamic = "force-dynamic";

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

/**
 * GET /api/daily
 *
 * Returns the deterministic daily listing for today (ET).
 * Same listing is returned for all callers on the same ET calendar day.
 * soldPrice is NOT included — the /api/score endpoint reveals it.
 *
 * Selection: stable ORDER BY id ensures a consistent ordering across calls;
 * the djb2 hash of the ET date string determines the offset within eligible
 * listings. Idempotent within a day, changes at ET midnight.
 */
export async function GET() {
  const todayET = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const dailyNumber = getDailyNumber(todayET);

  let count: number;
  try {
    count = await prisma.listing.count({
      where: { isActive: true, qualityScore: { gte: 50 } },
    });
  } catch {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: "no listings available" }, { status: 404 });
  }

  const hash = hashDateString(todayET);
  const offset = hash % count;

  let rows: Array<{ id: string }>;
  try {
    rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE "isActive" = true
      AND "qualityScore" >= 50
      ORDER BY id
      LIMIT 1
      OFFSET ${offset}
    `;
  } catch {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  if (!rows.length) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: rows[0].id },
    include: { photos: { orderBy: { ordering: "asc" } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  return NextResponse.json({
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
      homeType: listing.homeType,
      photos: listing.photos.map((p) => ({
        url: toHttps(p.url),
        thumbnailUrl: p.thumbnailUrl ? toHttps(p.thumbnailUrl) : null,
        caption: p.caption,
      })),
    },
  });
}
