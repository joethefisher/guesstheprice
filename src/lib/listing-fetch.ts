import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recencyCutoffDate } from "@/lib/recency";
import { buildMapBlock } from "@/lib/map";
import type { ListingPublic } from "@/lib/game";

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
  photos: { url: string; caption: string | null }[];
}

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

/**
 * Fetches a single random active listing in one DB round-trip via a CTE +
 * JSON-aggregated photos. Used by /api/listings and by /play's server
 * component to inline the first listing in the HTML payload.
 *
 * Returns null if no eligible listings exist or the DB is unavailable.
 */
export async function fetchOneListing(opts: { exclude?: string[] } = {}): Promise<ListingPublic | null> {
  const excludeIds = (opts.exclude ?? []).slice(0, 50);
  const cutoff = recencyCutoffDate();

  const excludeClause = excludeIds.length
    ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeIds)})`
    : Prisma.empty;

  let rows: ListingRow[];
  try {
    rows = await prisma.$queryRaw<ListingRow[]>`
      WITH picked AS (
        SELECT id FROM "Listing"
        WHERE "isActive" = true
        AND "qualityScore" >= 50
        AND "soldDate" >= ${cutoff}
        ${excludeClause}
        ORDER BY RANDOM()
        LIMIT 1
      )
      SELECT
        l.id, l.neighborhood, l.city, l.state, l.beds, l.baths,
        l.sqft, l."lotSqft", l."yearBuilt", l."homeType", l."soldDate",
        l.latitude, l.longitude,
        COALESCE(
          (SELECT json_agg(json_build_object(
             'url', p.url, 'caption', p.caption
           ) ORDER BY p.ordering)
           FROM "Photo" p WHERE p."listingId" = l.id),
          '[]'::json
        ) AS photos
      FROM "Listing" l
      JOIN picked ON picked.id = l.id
    `;
  } catch {
    return null;
  }

  if (!rows.length) return null;
  const l = rows[0];
  return {
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
    photos: l.photos.map((p) => ({ url: toHttps(p.url), caption: p.caption })),
    map: buildMapBlock(l.latitude, l.longitude),
  };
}
