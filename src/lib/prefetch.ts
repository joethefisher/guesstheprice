import type { ListingPublic } from "@/lib/game";

const CACHE_KEY = "pricetag.prefetch.v1";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PrefetchCache {
  ts: number;
  listings: ListingPublic[];
}

/**
 * Fires a background fetch for a batch of listings and stores them in
 * sessionStorage. Call on landing page mount — fire-and-forget, no await.
 */
export function prefetchBatch(count = 5): void {
  fetch(`/api/listings/batch?count=${count}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { listings: ListingPublic[] } | null) => {
      if (!data?.listings?.length) return;
      try {
        const cache: PrefetchCache = { ts: Date.now(), listings: data.listings };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch {
        // sessionStorage unavailable (private mode, storage full)
      }
    })
    .catch(() => {});
}

/**
 * Pops one listing from the sessionStorage prefetch cache.
 * Returns null on miss, expiry, or any error — caller falls back to API.
 */
export function popFromCache(): ListingPublic | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as PrefetchCache;
    if (Date.now() - cache.ts > TTL_MS || !cache.listings?.length) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    const [next, ...rest] = cache.listings;
    if (rest.length) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: cache.ts, listings: rest }));
    } else {
      sessionStorage.removeItem(CACHE_KEY);
    }

    return next;
  } catch {
    return null;
  }
}
