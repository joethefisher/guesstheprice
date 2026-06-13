import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import targetMarkets from "../../data/target-markets.json";

// Programmatic city pages turn data/target-markets.json + the Listing table
// into thousands of long-tail discoverable URLs (/cities/[state]/[city]).
// Aggregates are cached for a day — fresh enough for SEO, cheap enough for
// the edge.

export type CityIdentity = { city: string; state: string };

export type CityStats = {
  city: string;
  state: string;
  listingCount: number;
  medianPriceUsd: number | null;
  medianBeds: number | null;
  medianSqft: number | null;
  topNeighborhoods: string[];
};

export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stateSlug(state: string): string {
  return state.toLowerCase();
}

// Stable sorted snapshot of every city we want a page for. Sourced from the
// canonical target-markets.json so adding a market = adding a city page.
export function getAllTargetCities(): CityIdentity[] {
  return targetMarkets.map((m) => ({ city: m.city, state: m.state }));
}

// Given URL params (slugs), find the canonical city+state. Returns null when
// the URL doesn't map to a real market — caller should 404.
export function resolveCityFromSlugs(
  stateSlugArg: string,
  citySlugArg: string,
): CityIdentity | null {
  const match = targetMarkets.find(
    (m) =>
      stateSlug(m.state) === stateSlugArg.toLowerCase() &&
      citySlug(m.city) === citySlugArg.toLowerCase(),
  );
  return match ? { city: match.city, state: match.state } : null;
}

function median<T extends number>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(arr.length / 2)];
}

// Cached city aggregate. unstable_cache uses (city, state) as the cache key.
// 24h revalidate keeps it fresh without hammering the DB on every crawl.
export const getCityStats = unstable_cache(
  async (city: string, state: string): Promise<CityStats> => {
    const where = { city, state, isActive: true };
    const listings = await prisma.listing.findMany({
      where,
      select: {
        soldPrice: true,
        beds: true,
        sqft: true,
        neighborhood: true,
      },
    });

    if (listings.length === 0) {
      return {
        city,
        state,
        listingCount: 0,
        medianPriceUsd: null,
        medianBeds: null,
        medianSqft: null,
        topNeighborhoods: [],
      };
    }

    const prices = listings.map((l) => l.soldPrice).sort((a, b) => a - b);
    const beds = listings.map((l) => l.beds).sort((a, b) => a - b);
    const sqfts = listings
      .map((l) => l.sqft)
      .filter((s): s is number => s != null)
      .sort((a, b) => a - b);

    const neighborhoodCounts: Record<string, number> = {};
    for (const l of listings) {
      if (l.neighborhood) {
        neighborhoodCounts[l.neighborhood] =
          (neighborhoodCounts[l.neighborhood] ?? 0) + 1;
      }
    }
    const topNeighborhoods = Object.entries(neighborhoodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([n]) => n);

    return {
      city,
      state,
      listingCount: listings.length,
      medianPriceUsd: median(prices),
      medianBeds: median(beds),
      medianSqft: median(sqfts),
      topNeighborhoods,
    };
  },
  ["city-stats"],
  { revalidate: 86400, tags: ["city-stats"] },
);

// Lightweight per-city counts only, used by the /cities index. Same 24h cache.
export const getAllCityCounts = unstable_cache(
  async (): Promise<Array<CityIdentity & { listingCount: number }>> => {
    const groups = await prisma.listing.groupBy({
      by: ["city", "state"],
      where: { isActive: true },
      _count: { _all: true },
    });
    const countByKey = new Map<string, number>();
    for (const g of groups) {
      countByKey.set(`${g.state}|${g.city}`, g._count._all);
    }
    return getAllTargetCities().map(({ city, state }) => ({
      city,
      state,
      listingCount: countByKey.get(`${state}|${city}`) ?? 0,
    }));
  },
  ["all-city-counts"],
  { revalidate: 86400, tags: ["city-stats"] },
);

export function formatPriceUsd(usd: number | null): string | null {
  if (usd == null) return null;
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatSqft(sqft: number | null): string | null {
  if (sqft == null) return null;
  return `${sqft.toLocaleString("en-US")} sqft`;
}

// Pick "nearby markets" for cross-linking from a city page. Heuristic:
//   1. Same state, sorted by listing count desc (excluding current city).
//   2. If <3 same-state matches, fall back to same-tier markets from any state.
// Returns up to `limit` items. Cheap (in-process; no DB call beyond getAllCityCounts).
export async function getNearbyMarkets(
  current: CityIdentity,
  limit = 4,
): Promise<CityIdentity[]> {
  const allCounts = await getAllCityCounts();

  const sameState = allCounts
    .filter((c) => c.state === current.state && c.city !== current.city)
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, limit)
    .map(({ city, state }) => ({ city, state }));

  if (sameState.length >= limit) return sameState;

  // Fill remaining slots with high-coverage out-of-state markets to keep the
  // section meaningful even when the current state has limited coverage.
  const fillers = allCounts
    .filter((c) => c.state !== current.state)
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, limit - sameState.length)
    .map(({ city, state }) => ({ city, state }));

  return [...sameState, ...fillers];
}
