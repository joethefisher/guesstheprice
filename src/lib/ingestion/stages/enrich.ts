import { lookupNeighborhood } from "../enrich-neighborhood";
import type { NormalizedListing } from "../types";

// Runs after normalize, before mirror. For every listing without a
// neighborhood, calls Nominatim to fill it in. Rate-limited (1 req/sec) but
// cached, so re-runs against the same coordinates are free.
//
// Realtor.com's API doesn't return neighborhood data — that's why this stage
// exists. Without it the per-neighborhood pages stay empty.
export async function runEnrich(
  normalized: NormalizedListing[],
): Promise<NormalizedListing[]> {
  console.log("\n── Stage 3.5: Enrich (neighborhood) ───────────────");

  const toEnrich = normalized.filter(
    (n) => !n.neighborhood && n.latitude != null && n.longitude != null,
  );

  if (toEnrich.length === 0) {
    console.log(`  ${normalized.length} listings already have neighborhood or no coords; skipping\n`);
    return normalized;
  }

  console.log(
    `  ${toEnrich.length}/${normalized.length} listings missing neighborhood — querying Nominatim`,
  );
  console.log(`  Estimated time: ~${Math.ceil(toEnrich.length / 50)}min (rate-limited)\n`);

  let filled = 0;
  let stillNull = 0;
  for (let i = 0; i < toEnrich.length; i++) {
    const item = toEnrich[i];
    const neighborhood = await lookupNeighborhood(item.latitude!, item.longitude!);
    if (neighborhood) {
      item.neighborhood = neighborhood;
      filled++;
    } else {
      stillNull++;
    }
    if ((i + 1) % 50 === 0) {
      console.log(
        `  progress: ${i + 1}/${toEnrich.length} (${filled} filled, ${stillNull} still null)`,
      );
    }
  }

  console.log(`\n  Enriched: ${filled} filled, ${stillNull} still null\n`);
  return normalized;
}
