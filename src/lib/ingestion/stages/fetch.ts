import { readCache, writeCache } from "../cache";
import type { Market, RawListing } from "../types";

const API_HOST = "realtor.p.rapidapi.com";

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
  offset: number,
  apiKey: string
): Promise<RawListing[]> {
  const cacheKey = `${market.city.toLowerCase().replace(/\s+/g, "-")}-${market.state.toLowerCase()}-${offset}.json`;
  const cached = await readCache<RawListing[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(`https://${API_HOST}/properties/list-sold`);
  url.searchParams.set("city", market.city);
  url.searchParams.set("state_code", market.state);
  url.searchParams.set("limit", "200");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "sold_date");
  url.searchParams.set("prop_status", "recently_sold");

  const res = await fetchWithRetry(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": API_HOST,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  // apidojo response shape: { properties: [...] } or { data: { home_search: { results: [...] } } }
  const results: RawListing[] =
    json?.properties ??
    json?.data?.home_search?.results ??
    json?.results ??
    [];

  await writeCache(cacheKey, results);
  await sleep(250); // rate-limit guard

  return results;
}

export async function fetchMarket(
  market: Market,
  quota: number,
  apiKey: string
): Promise<RawListing[]> {
  const pages = Math.ceil(quota / 200);
  const all: RawListing[] = [];

  for (let page = 0; page < pages; page++) {
    const offset = page * 200;
    try {
      const results = await fetchPage(market, offset, apiKey);
      all.push(...results);
      if (results.length < 200) break; // no more pages
    } catch (err) {
      console.error(`  Error fetching ${market.city} offset ${offset}:`, err);
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
