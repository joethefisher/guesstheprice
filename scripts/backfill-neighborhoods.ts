import { PrismaClient } from "@prisma/client";
import { lookupNeighborhood } from "../src/lib/ingestion/enrich-neighborhood";

// Backfill neighborhoods for existing Listing rows where the field is null.
// Standalone script — does not run as part of the regular ingest pipeline.
//
// Usage:
//   npx tsx scripts/backfill-neighborhoods.ts                 # all listings
//   npx tsx scripts/backfill-neighborhoods.ts --limit 100     # smoke test
//   npx tsx scripts/backfill-neighborhoods.ts --dry-run       # log only
//   npx tsx scripts/backfill-neighborhoods.ts --city Brooklyn # one market
//
// Rate-limited at 1 req/sec per Nominatim ToS. ~50k listings = ~14 hours.
// Run on a server or in screen/tmux; cache means a re-run is cheap if killed.

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

interface Options {
  limit?: number;
  city?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--limit") opts.limit = parseInt(argv[++i] ?? "", 10);
    else if (arg === "--city") opts.city = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  const where = {
    neighborhood: null,
    latitude: { not: null },
    longitude: { not: null },
    ...(opts.city ? { city: opts.city } : {}),
  };

  const total = await prisma.listing.count({ where });
  const fetched = await prisma.listing.findMany({
    where,
    select: { id: true, latitude: true, longitude: true, city: true, state: true },
    take: opts.limit ?? total,
  });

  console.log(
    `\n── Backfill neighborhoods ──────────────────────────`,
  );
  console.log(`  Eligible (no neighborhood + has coords): ${total}`);
  console.log(`  Will process: ${fetched.length}`);
  if (opts.city) console.log(`  City filter: ${opts.city}`);
  if (opts.dryRun) console.log(`  DRY RUN — no DB writes`);
  console.log(
    `  Estimated time: ~${Math.ceil(fetched.length / 50)}min (1 req/sec, cached coords are free)\n`,
  );

  let filled = 0;
  let stillNull = 0;
  let updates = 0;
  for (let i = 0; i < fetched.length; i++) {
    const l = fetched[i];
    const neighborhood = await lookupNeighborhood(l.latitude!, l.longitude!);
    if (neighborhood) {
      filled++;
      if (!opts.dryRun) {
        await prisma.listing.update({
          where: { id: l.id },
          data: { neighborhood },
        });
        updates++;
      }
    } else {
      stillNull++;
    }
    if ((i + 1) % 25 === 0 || i === fetched.length - 1) {
      console.log(
        `  ${i + 1}/${fetched.length}: ${filled} filled, ${stillNull} null, ${updates} db updates`,
      );
    }
  }

  console.log(`\n── Backfill complete ───────────────────────────────`);
  console.log(`  Filled: ${filled}`);
  console.log(`  Still null: ${stillNull}`);
  console.log(`  DB updates: ${updates} ${opts.dryRun ? "(dry run, no writes)" : ""}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("backfill failed:", err);
  process.exit(1);
});
