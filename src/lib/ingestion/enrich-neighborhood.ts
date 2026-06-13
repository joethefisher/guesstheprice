import { readCacheDir, writeCacheDir } from "./cache";

// Reverse-geocode (lat, lng) -> neighborhood via OpenStreetMap Nominatim.
// Realtor.com's API does not return neighborhood data, so we look it up
// ourselves. Free for non-commercial use at <=1 req/sec; we cache results
// keyed on rounded coordinates so repeat lookups for the same block are
// essentially free.
//
// Nominatim returns neighborhood under address.neighbourhood (British spelling)
// or address.suburb depending on locality. Both map to "neighborhood" in our
// schema; suburb is the broader fallback.

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "Pricetag/1.0 (https://guesstheprice.ai)";
const CACHE_DIR = ".cache/nominatim";
const MIN_DELAY_MS = 1100; // a hair over 1 req/sec to stay under the ToS

type NominatimResponse = {
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
  };
};

// Coordinates rounded to 4 decimal places (~11m precision) — fine for
// neighborhood lookup, generates a stable cache key for nearby addresses.
function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}.json`;
}

let lastRequestAt = 0;
async function throttle(): Promise<void> {
  const delta = Date.now() - lastRequestAt;
  if (delta < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - delta));
  }
  lastRequestAt = Date.now();
}

export async function lookupNeighborhood(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = cacheKey(lat, lng);

  // Cache hit — return without burning the rate limit.
  const cached = await readCacheDir<NominatimResponse>(CACHE_DIR, key);
  if (cached) {
    return cached.address?.neighbourhood ?? cached.address?.suburb ?? null;
  }

  await throttle();

  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "16"); // neighborhood-scale zoom
  url.searchParams.set("addressdetails", "1");

  let payload: NominatimResponse;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      // Treat non-2xx as "no result" but don't cache the failure so a future
      // run gets to retry. Surface the status for observability.
      console.warn(
        `enrich-neighborhood: nominatim returned ${res.status} for (${lat}, ${lng})`,
      );
      return null;
    }
    payload = (await res.json()) as NominatimResponse;
  } catch (err) {
    console.warn(
      `enrich-neighborhood: fetch error for (${lat}, ${lng}): ${(err as Error).message}`,
    );
    return null;
  }

  await writeCacheDir(CACHE_DIR, key, payload);
  return payload.address?.neighbourhood ?? payload.address?.suburb ?? null;
}

// Bulk-enrich a list of (id, lat, lng) tuples. Returns parallel results.
// Used by the backfill script + by the persist stage to enrich any newly
// normalized listings that lack a neighborhood.
export async function enrichMany(
  items: Array<{ id: string; latitude: number; longitude: number }>,
): Promise<Array<{ id: string; neighborhood: string | null }>> {
  const results: Array<{ id: string; neighborhood: string | null }> = [];
  for (let i = 0; i < items.length; i++) {
    const { id, latitude, longitude } = items[i];
    const neighborhood = await lookupNeighborhood(latitude, longitude);
    results.push({ id, neighborhood });
    if (i > 0 && i % 50 === 0) {
      console.log(`  enriched ${i}/${items.length} (~${Math.round((i / items.length) * 100)}%)`);
    }
  }
  return results;
}
