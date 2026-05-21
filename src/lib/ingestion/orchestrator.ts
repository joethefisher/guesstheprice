import { PrismaClient } from "@prisma/client";
import { runDiscover } from "./stages/discover";
import { runFetch } from "./stages/fetch";
import { runNormalize } from "./stages/normalize";
import { runMirror } from "./stages/mirror";
import { runPersist } from "./stages/persist";
import type { IngestionStats } from "./types";

// Long-running batch jobs use the direct DB connection — the pgbouncer
// pooler drops connections during multi-minute persist loops, manifesting
// as "Server has closed the connection" mid-run with no further progress.
// Falls back to DATABASE_URL when DIRECT_URL isn't set (e.g. local SQLite).
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

export interface OrchestratorOptions {
  markets?: string;    // "all" or comma-separated "City,ST"
  quota?: number;
  apiKey?: string;
  dryRun?: boolean;
}

export async function runFull(opts: OrchestratorOptions = {}): Promise<IngestionStats> {
  const apiKey = opts.apiKey ?? process.env.RAPIDAPI_KEY;
  const quota = opts.quota ?? 10_000;
  const marketFilter = opts.markets ?? "all";

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is required");
  }

  const stats: IngestionStats = {
    marketsRequested: 0,
    listingsFound: 0,
    listingsIngested: 0,
    listingsSkipped: 0,
    errors: [],
  };

  // Create ingestion run record
  const run = await prisma.ingestionRun.create({
    data: {
      status: "running",
      marketsRequested: 0,
      listingsFound: 0,
      listingsIngested: 0,
      listingsSkipped: 0,
    },
  });

  const startedAt = Date.now();
  console.log(`\n══ Pricetag Ingestion Run ${run.id} ══════════════════`);
  console.log(`  Started at: ${new Date().toISOString()}`);
  console.log(`  Quota: ${quota.toLocaleString()} listings`);
  console.log(`  Markets: ${marketFilter}\n`);

  try {
    // Stage 1: Discover
    const plan = await runDiscover(quota);
    const filteredPlan =
      marketFilter === "all"
        ? plan
        : plan.filter((p) =>
            marketFilter
              .split(",")
              .some((m) => m.trim() === `${p.market.city},${p.market.state}`)
          );
    stats.marketsRequested = filteredPlan.length;

    // Stage 2: Fetch
    const rawByMarket = await runFetch(filteredPlan, apiKey);
    const allRaw = [...rawByMarket.values()].flat();
    stats.listingsFound = allRaw.length;

    if (opts.dryRun) {
      console.log("  Dry run — stopping before normalize/mirror/persist");
      await finalize(run.id, "success", stats);
      return stats;
    }

    // Stage 3: Normalize
    const normalized = await runNormalize(rawByMarket);

    // Stage 4: Mirror
    const mirrored = await runMirror(normalized);

    // Stage 5: Persist
    const { ingested, skipped } = await runPersist(mirrored, prisma);
    stats.listingsIngested = ingested;
    stats.listingsSkipped = normalized.length - ingested;

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`\n══ Complete in ${elapsed}s ═══════════════════════════`);
    console.log(`  Markets: ${stats.marketsRequested}`);
    console.log(`  Found:   ${stats.listingsFound.toLocaleString()}`);
    console.log(`  Ingested: ${stats.listingsIngested.toLocaleString()}`);
    console.log(`  Skipped:  ${stats.listingsSkipped.toLocaleString()}\n`);

    await finalize(run.id, "success", stats);
  } catch (err) {
    const msg = (err as Error).message;
    stats.errors.push(msg);
    console.error("\nIngestion failed:", msg);
    await finalize(run.id, "failed", stats, msg);
    throw err;
  }

  return stats;
}

async function finalize(
  runId: string,
  status: "success" | "failed",
  stats: IngestionStats,
  errorLog?: string
) {
  await prisma.ingestionRun.update({
    where: { id: runId },
    data: {
      status,
      completedAt: new Date(),
      marketsRequested: stats.marketsRequested,
      listingsFound: stats.listingsFound,
      listingsIngested: stats.listingsIngested,
      listingsSkipped: stats.listingsSkipped,
      errorLog: errorLog?.slice(0, 2000),
    },
  });
  await prisma.$disconnect();
}
