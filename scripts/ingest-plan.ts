/**
 * Stage 1 dry-run: prints planned market distribution.
 *
 * Usage:
 *   npm run ingest:plan
 *   npm run ingest:plan -- --quota=5000
 */

import { runDiscover } from "../src/lib/ingestion/stages/discover";

const quota = parseInt(
  (process.argv.find((a) => a.startsWith("--quota="))?.split("=")[1]) ?? "10000",
  10
);

runDiscover(quota)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
