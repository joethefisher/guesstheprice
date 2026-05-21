import { readCache, writeCache } from "../cache";
import type { Market, RawListing } from "../types";
import {
  REALTY_US_HOST,
  SEARCH_BUY_ENDPOINT,
  MAX_PAGE,
  toLocationSlug,
  toRawListing,
  parseSearchBuyResponse,
} from "../providers/realty-us";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt);
          console.warn(`  HTTP ${res.status}, retrying in ${delay}ms…`);
          await sleep(delay);
          continue;
        }
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        await sleep(1000 * Math.pow(2, attempt));
      } else {
        throw err;
      }
    }
  }
  throw new Error("All retries exhausted");
}

async function fetchPage(
  market: Market,
  page: number,
  apiKey: string
): Promise<{ listings: RawListing[]; totalPages: number }> {
  const slug = toLocationSlug(market.city, market.state);
  const cacheKey = `${market.city.toLowerCase().replace(/\s+/g, "-")}-${market.state.toLowerCase()}-page${page}.json`;

  const cached = await readCache<{ listings: RawListing[]; totalPages: number }>(cacheKey);
  if (cached) return cached;

  const url = new URL(SEARCH_BUY_ENDPOINT);
  url.searchParams.set("location", slug);
  url.searchParams.set("page", String(page));

  const res = await fetchWithRetry(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": REALTY_US_HOST,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();

  // Don't cache responses that look like errors masquerading as 200s — the
  // Realty US API returns `{status: false, message: "...quota..."}` with HTTP
  // 200 when you hit your monthly cap, and historically we cached those as
  // empty pages that then poisoned future runs for 30 days. Throwing here
  // bubbles up to the per-page try/catch in fetchMarket() and breaks the
  // loop without contaminating disk.
  const apiOk =
    json && typeof json === "object" &&
    (json as { status?: unknown }).status !== false &&
    (json as { data?: unknown }).data !== null &&
    (json as { data?: unknown }).data !== undefined;
  if (!apiOk) {
    const msg = (json as { message?: string })?.message ?? "no data";
    throw new Error(`API soft-failure: ${msg}`);
  }

  const { listings, totalPages } = parseSearchBuyResponse(json);

  const withPrice = listings
    .filter((l) => l.last_sold_price != null)
    .map(toRawListing);

  const result = { listings: withPrice, totalPages };
  await writeCache(cacheKey, result);
  await sleep(250);

  return result;
}

export async function fetchMarket(
  market: Market,
  quota: number,
  apiKey: string
): Promise<RawListing[]> {
  const pagesNeeded = Math.ceil(quota / 20);
  const pages = Math.min(pagesNeeded, MAX_PAGE);
  const all: RawListing[] = [];

  let apiTotalPages = pages;
  for (let page = 1; page <= Math.min(pages, apiTotalPages); page++) {
    try {
      const { listings, totalPages } = await fetchPage(market, page, apiKey);
      apiTotalPages = Math.min(totalPages, MAX_PAGE);
      all.push(...listings);
      if (all.length >= quota) break;
    } catch (err) {
      console.error(`  Error fetching ${market.city} page ${page}:`, err);
      break;
    }
  }

  return all;
}

export async function runFetch(
  markets: Array<{ market: Market; quota: number }>,
  apiKey: string,
  singleMarket?: string
): Promise<Map<string, RawListing[]>> {
  console.log("\n── Stage 2: Fetch ─────────────────────────────────");

  const targets = singleMarket
    ? markets.filter((m) => `${m.market.city},${m.market.state}` === singleMarket)
    : markets;

  const result = new Map<string, RawListing[]>();

  for (const { market, quota } of targets) {
    const key = `${market.city},${market.state}`;
    process.stdout.write(`  Fetching ${market.city}, ${market.state} (quota: ${quota})… `);
    const listings = await fetchMarket(market, quota, apiKey);
    result.set(key, listings);
    console.log(`${listings.length} listings`);
  }

  const total = [...result.values()].reduce((s, v) => s + v.length, 0);
  console.log(`\n  Total raw: ${total.toLocaleString()} listings\n`);
  return result;
}
