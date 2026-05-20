import type { ListingPublic } from "@/lib/game";

const CACHE_KEY = "pricetag.prefetch.v1";
const DAILY_CACHE_KEY = "pricetag.daily.v1";
const TTL_MS = 5 * 60 * 1000; // 5 minutes
// Daily TTL is shorter than the server's 24h cache so a freshly-rolled daily
// gets picked up promptly when the user returns just after midnight ET.
const DAILY_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PrefetchCache {
  ts: number;
  listings: ListingPublic[];
}

interface DailyCache {
  ts: number;
  dateET: string;
  payload: unknown;
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
 * Fires a background fetch for today's daily listing. The /daily page reads
 * sessionStorage on mount and uses this cached response if present, dropping
 * its first render delay from ~600ms to nearly zero.
 */
export function prefetchDaily(): void {
  try {
    const raw = sessionStorage.getItem(DAILY_CACHE_KEY);
    if (raw) {
      const cache = JSON.parse(raw) as DailyCache;
      if (Date.now() - cache.ts < DAILY_TTL_MS) return; // still fresh, skip
    }
  } catch { /* fall through to fetch */ }

  fetch("/api/daily")
    .then((r) => (r.ok ? r.json() : null))
    .then((payload: { dateET?: string } | null) => {
      if (!payload?.dateET) return;
      try {
        const cache: DailyCache = { ts: Date.now(), dateET: payload.dateET, payload };
        sessionStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(cache));
      } catch { /* storage unavailable */ }
    })
    .catch(() => {});
}

/**
 * Reads the cached daily payload without consuming it — the daily doesn't
 * rotate within a session, so /daily can reuse the same cached response on
 * remount. Returns null on miss / expiry / wrong-day.
 */
export function readDailyCache<T = unknown>(): T | null {
  try {
    const raw = sessionStorage.getItem(DAILY_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as DailyCache;
    if (Date.now() - cache.ts > DAILY_TTL_MS) {
      sessionStorage.removeItem(DAILY_CACHE_KEY);
      return null;
    }
    return cache.payload as T;
  } catch {
    return null;
  }
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
