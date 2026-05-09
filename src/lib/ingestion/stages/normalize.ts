import path from "path";
import { writeCacheDir, listCacheDir, readCacheDir } from "../cache";
import { scoreRaw } from "../quality";
import type { RawListing, NormalizedListing } from "../types";

export function normalizeOne(raw: RawListing): NormalizedListing | null {
  const { score, reject } = scoreRaw(raw);
  if (reject) return null;

  const price = raw.last_sold_price ?? raw.list_price!;
  const baths = parseFloat(raw.description.baths_consolidated ?? "0") || 0;

  return {
    externalId: raw.property_id,
    source: "realtor",
    streetAddress: raw.address.line,
    neighborhood: raw.address.neighborhood_name,
    city: raw.address.city,
    state: raw.address.state_code,
    zipCode: raw.address.postal_code,
    latitude: raw.address.coordinate?.lat,
    longitude: raw.address.coordinate?.lon,
    beds: raw.description.beds ?? 0,
    baths,
    sqft: raw.description.sqft,
    lotSqft: raw.description.lot_sqft,
    yearBuilt: raw.description.year_built,
    homeType: raw.description.type,
    soldPrice: Math.round(price),
    soldDate: raw.last_sold_date ? new Date(raw.last_sold_date) : undefined,
    qualityScore: score,
    photos: (raw.photos ?? []).slice(0, 20).map((p, i) => ({
      sourceUrl: p.href,
      width: p.width,
      height: p.height,
      ordering: i,
    })),
  };
}

export async function runNormalize(
  rawByMarket: Map<string, RawListing[]>
): Promise<NormalizedListing[]> {
  console.log("\n── Stage 3: Normalize ─────────────────────────────");

  const normalized: NormalizedListing[] = [];
  let total = 0;
  let skipped = 0;

  for (const [market, listings] of rawByMarket) {
    let ok = 0;
    for (const raw of listings) {
      total++;
      const result = normalizeOne(raw);
      if (result) {
        normalized.push(result);
        ok++;
      } else {
        skipped++;
      }
    }
    console.log(`  ${market}: ${ok}/${listings.length} passed quality check`);
  }

  // Print quality score distribution
  const buckets = [0, 0, 0, 0, 0]; // <20, 20-39, 40-59, 60-79, 80-100
  for (const n of normalized) {
    const idx = Math.min(4, Math.floor(n.qualityScore / 20));
    buckets[idx]++;
  }
  console.log(`\n  Quality score distribution:`);
  const labels = ["0-19", "20-39", "40-59", "60-79", "80-100"];
  buckets.forEach((count, i) => {
    const bar = "█".repeat(Math.round((count / normalized.length) * 30));
    console.log(`    ${labels[i].padEnd(8)} ${bar} ${count}`);
  });

  console.log(`\n  Total: ${normalized.length} normalized, ${skipped} skipped\n`);

  // Write to normalized cache
  const filename = `normalized-${Date.now()}.json`;
  await writeCacheDir(".cache/normalized", filename, normalized);
  console.log(`  Saved to .cache/normalized/${filename}\n`);

  return normalized;
}
