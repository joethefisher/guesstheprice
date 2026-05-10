/**
 * Run an individual ingestion stage by name.
 *
 * Usage:
 *   npm run ingest:fetch -- --market=Austin,TX
 *   npm run ingest:normalize
 *   npm run ingest:mirror
 *   npm run ingest:persist
 */

import { runDiscover, planDistribution } from "../src/lib/ingestion/stages/discover";
import { runFetch } from "../src/lib/ingestion/stages/fetch";
import { runNormalize } from "../src/lib/ingestion/stages/normalize";
import { runMirror } from "../src/lib/ingestion/stages/mirror";
import { runPersist } from "../src/lib/ingestion/stages/persist";
import { listCacheDir, readCacheDir } from "../src/lib/ingestion/cache";
import type { NormalizedListing, MirroredListing } from "../src/lib/ingestion/types";

const stage = process.argv[2];
const marketArg = process.argv.find((a) => a.startsWith("--market="))?.split("=")[1];
const apiKey = process.env.RAPIDAPI_KEY;

async function main() {
  switch (stage) {
    case "fetch": {
      if (!apiKey) throw new Error("RAPIDAPI_KEY not set");
      const plan = await runDiscover(10_000);
      await runFetch(plan, apiKey, marketArg);
      break;
    }

    case "normalize": {
      // Raw cache files are written by writeCache() as { ts, data: { listings, totalPages } }
      const files = await listCacheDir(".cache/raw");
      const rawByMarket = new Map<string, any[]>();
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const cached = await readCacheDir<{ ts: number; data: { listings: any[]; totalPages: number } }>(".cache/raw", file);
        if (cached?.data?.listings) rawByMarket.set(file, cached.data.listings);
      }
      await runNormalize(rawByMarket);
      break;
    }

    case "mirror": {
      const files = await listCacheDir(".cache/normalized");
      const latest = files.sort().pop();
      if (!latest) throw new Error("No normalized cache found — run normalize first");
      const data = await readCacheDir<NormalizedListing[]>(".cache/normalized", latest);
      if (!data) throw new Error("Could not read normalized cache");
      await runMirror(data);
      break;
    }

    case "persist": {
      const files = await listCacheDir(".cache/mirrored");
      const latest = files.sort().pop();
      if (!latest) throw new Error("No mirrored cache found — run mirror first");
      const data = await readCacheDir<MirroredListing[]>(".cache/mirrored", latest);
      if (!data) throw new Error("Could not read mirrored cache");
      await runPersist(data);
      break;
    }

    default:
      console.error(`Unknown stage: ${stage}`);
      console.error("Valid stages: fetch | normalize | mirror | persist");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
