import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recencyCutoffDate } from "@/lib/recency";
import { buildMapBlock } from "@/lib/map";
import type { ListingPublic } from "@/lib/game";

/**
 * Server-side listing queries that hydrate `ListingPublic` from Postgres
 * via a single CTE + JSON-aggregated photos. Each caller (random, batch,
 * deterministic-daily) supplies the "picked" CTE; the outer SELECT and
 * post-processing are shared.
 *
 * SECURITY: none of these queries expose `soldPrice` or `streetAddress` —
 * the answer lives server-side until /api/score returns it post-submit.
 */

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

function toHttps(url: string) { return url.replace(/^http:\/\//, "https://"); }

/**
 * Wraps a "picked" CTE (which must select listing ids) with the shared
 * SELECT shape that joins Listing + json_agg of Photo. Returns the raw
 * Postgres template; callers run it through `prisma.$queryRaw`.
 */
function listingQuery(picked: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`
    WITH picked AS (${picked})
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
}

function rowToPublic(l: ListingRow): ListingPublic {
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
    photos: l.photos.map((p) => ({
      url: toHttps(p.url),
      thumbnailUrl: p.thumbnailUrl ? toHttps(p.thumbnailUrl) : null,
      caption: p.caption,
    })),
    map: buildMapBlock(l.latitude, l.longitude),
  };
}

/** Fetch a single random active+recent listing. Returns null on no-data / DB error. */
export async function fetchOneListing(opts: { exclude?: string[] } = {}): Promise<ListingPublic | null> {
  const excludeIds = (opts.exclude ?? []).slice(0, 50);
  const cutoff = recencyCutoffDate();
  const excludeClause = excludeIds.length
    ? Prisma.sql`AND id NOT IN (${Prisma.join(excludeIds)})`
    : Prisma.empty;

  const picked = Prisma.sql`
    SELECT id FROM "Listing"
    WHERE "isActive" = true
    AND "qualityScore" >= 50
    AND "soldDate" >= ${cutoff}
    ${excludeClause}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  let rows: ListingRow[];
  try {
    rows = await prisma.$queryRaw<ListingRow[]>(listingQuery(picked));
  } catch {
    return null;
  }
  return rows.length ? rowToPublic(rows[0]) : null;
}

/** Fetch N random active+recent listings (used by the landing prefetch warmer). */
export async function fetchListingsBatch(count: number): Promise<ListingPublic[] | null> {
  const n = Math.min(10, Math.max(1, count | 0));
  const cutoff = recencyCutoffDate();
  const picked = Prisma.sql`
    SELECT id FROM "Listing"
    WHERE "isActive" = true
    AND "qualityScore" >= 50
    AND "soldDate" >= ${cutoff}
    ORDER BY RANDOM()
    LIMIT ${n}
  `;

  let rows: ListingRow[];
  try {
    rows = await prisma.$queryRaw<ListingRow[]>(listingQuery(picked));
  } catch {
    return null;
  }
  return rows.map(rowToPublic);
}

/** Fetch the deterministic daily listing at the given catalog offset (stable order by id). */
export async function fetchDailyListing(offset: number): Promise<ListingPublic | null> {
  const cutoff = recencyCutoffDate();
  const picked = Prisma.sql`
    SELECT id FROM "Listing"
    WHERE "isActive" = true
    AND "qualityScore" >= 50
    AND "soldDate" >= ${cutoff}
    ORDER BY id
    LIMIT 1
    OFFSET ${offset}
  `;

  let rows: ListingRow[];
  try {
    rows = await prisma.$queryRaw<ListingRow[]>(listingQuery(picked));
  } catch {
    return null;
  }
  return rows.length ? rowToPublic(rows[0]) : null;
}

/** Count of active + recent listings — needed for daily offset calculation. */
export async function countEligibleListings(): Promise<number | null> {
  try {
    return await prisma.listing.count({
      where: {
        isActive: true,
        qualityScore: { gte: 50 },
        soldDate: { gte: recencyCutoffDate() },
      },
    });
  } catch {
    return null;
  }
}
