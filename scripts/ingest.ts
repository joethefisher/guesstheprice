/**
 * Thin CLI wrapper around the orchestrator.
 *
 * Usage:
 *   npm run ingest:full                          # all markets, default quota
 *   npm run ingest:full -- --quota=1000          # custom quota
 *   npm run ingest:full -- --markets=Austin,TX   # single market
 *   npm run ingest:full -- --dry-run             # discover + fetch only
 */

import { runFull } from "../src/lib/ingestion/orchestrator";

function getArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : undefined;
}

const quota = parseInt(getArg("quota") ?? "10000", 10);
const markets = getArg("markets") ?? "all";
const dryRun = process.argv.includes("--dry-run");

runFull({
  quota,
  markets,
  dryRun,
})
  .then((stats) => {
    console.log("Ingestion complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ingestion failed:", err);
    process.exit(1);
  });
