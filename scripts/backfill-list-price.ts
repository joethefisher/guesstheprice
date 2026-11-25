/**
 * Backfill Listing.listPrice (the scoring truth) from the local raw ingest
 * cache (.cache/raw/*.json), joined on Listing.externalId = property_id.
 *
 * DRY RUN BY DEFAULT — runs inside a READ ONLY transaction and prints counts.
 * Pass --apply to write. Idempotent: rows already equal are skipped; rows
 * with no cache match are never touched (they stay null and out of play).
 *
 * Usage:
 *   set -a; source .env; set +a
 *   npx tsx scripts/backfill-list-price.ts                 # dry run
 *   npx tsx scripts/backfill-list-price.ts --apply         # write
 *   npx tsx scripts/backfill-list-price.ts --cache=path/to/raw
 *
 * Requires migration 20261123_add_listing_list_price for --apply. Dry run
 * works before the migration (treats every listPrice as null).
 */
import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  buildListPriceMap,
  planBackfill,
  type BackfillRow,
  type CacheFile,
} from "../src/lib/ingestion/backfill-list-price";

const APPLY = process.argv.includes("--apply");
const cacheArg = process.argv.find((a) => a.startsWith("--cache="));
const CACHE_DIR = path.resolve(cacheArg ? cacheArg.slice(8) : ".cache/raw");
const BATCH = 200;

async function loadCache(): Promise<CacheFile[]> {
  const out: CacheFile[] = [];
  let bad = 0;
  for (const f of await fs.readdir(CACHE_DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      out.push(JSON.parse(await fs.readFile(path.join(CACHE_DIR, f), "utf-8")));
    } catch {
      bad++;
    }
  }
  console.log(`cache: ${out.length} files read from ${CACHE_DIR}${bad ? ` (${bad} unreadable)` : ""}`);
  return out;
}

async function main() {
  const prices = buildListPriceMap(await loadCache());
  console.log(`cache: ${prices.size} distinct externalIds with a list_price`);

  const prisma = new PrismaClient();
  try {
    const col = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM information_schema.columns
      WHERE table_name = 'Listing' AND column_name = 'listPrice'`;
    const hasColumn = Number(col[0]?.n ?? 0) > 0;
    if (!hasColumn) {
      console.log("db: Listing.listPrice column NOT present (migration pending) — treating all as null");
      if (APPLY) throw new Error("refusing --apply: run `prisma migrate deploy` first");
    }

    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      const raw = hasColumn
        ? await tx.$queryRaw<Array<{ id: string; externalId: string; listPrice: number | null; playable: boolean }>>`
            SELECT id, "externalId", "listPrice", ("isActive" AND "qualityScore" >= 50) AS playable FROM "Listing"`
        : await tx.$queryRaw<Array<{ id: string; externalId: string; playable: boolean }>>`
            SELECT id, "externalId", ("isActive" AND "qualityScore" >= 50) AS playable FROM "Listing"`;
      return raw.map((r) => ({ listPrice: null, ...r })) as BackfillRow[];
    });

    const { updates, counts } = planBackfill(rows, prices);
    console.log(`\n${APPLY ? "APPLY" : "DRY RUN"} — counts:`);
    console.table(counts);

    if (!APPLY) {
      console.log(`\nwould write ${updates.length} rows. Re-run with --apply to write.`);
      return;
    }

    let written = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const chunk = updates.slice(i, i + BATCH);
      await prisma.$transaction(
        chunk.map((u) =>
          prisma.listing.update({ where: { id: u.id }, data: { listPrice: u.listPrice } }),
        ),
      );
      written += chunk.length;
      console.log(`  wrote ${written}/${updates.length}`);
    }
    console.log(`\ndone: ${written} rows written.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
