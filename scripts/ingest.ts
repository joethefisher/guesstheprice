/**
 * Real ingestion pipeline.
 *
 * This is the script that pulls live listing data from a third-party API
 * (e.g. Realtor.com via RapidAPI) and writes it to our local DB.
 *
 * Architecture goal: run this periodically (weekly? monthly?) NOT at game runtime.
 * That keeps marginal cost per round at ~zero.
 *
 * Status: STUB. Wire up your own RapidAPI key + endpoint when ready.
 *
 * Usage:
 *   RAPIDAPI_KEY=xxx npm run ingest:rapidapi -- --city=Austin --state=TX --limit=50
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RawListing {
  property_id: string;
  address: {
    line: string;
    neighborhood_name?: string;
    city: string;
    state_code: string;
    postal_code?: string;
    coordinate?: { lat: number; lon: number };
  };
  description: {
    beds: number;
    baths_consolidated?: string;
    sqft?: number;
    lot_sqft?: number;
    year_built?: number;
    type?: string;
  };
  list_price?: number;
  last_sold_price?: number;
  last_sold_date?: string;
  photos?: { href: string; width?: number; height?: number }[];
}

async function fetchListings(opts: {
  city: string;
  state: string;
  limit: number;
}): Promise<RawListing[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "realtor-search.p.rapidapi.com";

  if (!apiKey) {
    console.error("RAPIDAPI_KEY not set in environment.");
    console.error("Get a key at https://rapidapi.com and pick a Realtor.com API.");
    process.exit(1);
  }

  // EXAMPLE — endpoint shape varies by provider.
  // The Realtor.com unofficial APIs on RapidAPI typically expose:
  //   POST /properties/v3/list  with JSON body { city, state_code, status: ["sold"], limit }
  const res = await fetch(`https://${apiHost}/properties/v3/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost
    },
    body: JSON.stringify({
      city: opts.city,
      state_code: opts.state,
      status: ["sold"],
      limit: opts.limit,
      sort: "sold_date"
    })
  });

  if (!res.ok) {
    throw new Error(`API returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  // Provider-specific shape; adjust based on your chosen API
  return data?.data?.home_search?.results ?? [];
}

function qualityScore(raw: RawListing): number {
  let score = 50;
  if (raw.photos && raw.photos.length >= 5) score += 20;
  if (raw.photos && raw.photos.length >= 10) score += 10;
  if (raw.description.sqft) score += 5;
  if (raw.description.year_built) score += 5;
  if (raw.address.coordinate) score += 5;
  if (raw.last_sold_price && raw.last_sold_price > 50_000) score += 5;
  return Math.min(100, score);
}

async function ingestOne(raw: RawListing) {
  const price = raw.last_sold_price ?? raw.list_price;
  if (!price || price < 50_000) {
    console.log(`  SKIP ${raw.property_id} — no valid price`);
    return;
  }
  if (!raw.photos || raw.photos.length < 3) {
    console.log(`  SKIP ${raw.property_id} — too few photos`);
    return;
  }

  const baths =
    parseFloat(raw.description.baths_consolidated || "0") || 0;

  await prisma.listing.upsert({
    where: { externalId: raw.property_id },
    update: {
      // Refresh price/photos but don't churn IDs
      soldPrice: price,
      qualityScore: qualityScore(raw)
    },
    create: {
      externalId: raw.property_id,
      source: "realtor",
      streetAddress: raw.address.line,
      neighborhood: raw.address.neighborhood_name,
      city: raw.address.city,
      state: raw.address.state_code,
      zipCode: raw.address.postal_code,
      latitude: raw.address.coordinate?.lat,
      longitude: raw.address.coordinate?.lon,
      beds: raw.description.beds,
      baths,
      sqft: raw.description.sqft,
      lotSqft: raw.description.lot_sqft,
      yearBuilt: raw.description.year_built,
      homeType: raw.description.type,
      soldPrice: price,
      soldDate: raw.last_sold_date ? new Date(raw.last_sold_date) : null,
      isSold: true,
      qualityScore: qualityScore(raw),
      photos: {
        create: raw.photos.slice(0, 20).map((p, i) => ({
          url: p.href,
          width: p.width,
          height: p.height,
          ordering: i
        }))
      }
    }
  });
}

async function main() {
  const args = parseArgs();
  console.log(`Ingesting from ${args.city}, ${args.state} (limit ${args.limit})`);

  const listings = await fetchListings(args);
  console.log(`Got ${listings.length} from API`);

  let ok = 0;
  let skip = 0;
  for (const raw of listings) {
    try {
      await ingestOne(raw);
      ok++;
    } catch (err) {
      console.error(`Failed ${raw.property_id}:`, err);
      skip++;
    }
  }
  console.log(`\nDone. ${ok} ingested, ${skip} skipped.`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (key: string, fallback: string) => {
    const arg = args.find((a) => a.startsWith(`--${key}=`));
    return arg ? arg.split("=")[1] : fallback;
  };
  return {
    city: get("city", "Austin"),
    state: get("state", "TX"),
    limit: parseInt(get("limit", "50"), 10)
  };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
