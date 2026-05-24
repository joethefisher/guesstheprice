/**
 * One-shot DB-driven R2 backfill.
 *
 * Walks every Photo row whose `url` still points at *.rdcpix.com, mirrors
 * the image to R2 (display 1600w + thumb 400w), and updates Photo.url +
 * Photo.thumbnailUrl in place. Idempotent — already-uploaded R2 objects
 * are detected via HEAD and skip the re-upload, but the DB UPDATE still
 * runs so any out-of-sync rows reconcile.
 *
 * Usage:
 *   set -a; source .env; set +a
 *   caffeinate -i npm run r2:backfill 2>&1 | tee r2-backfill.log
 *
 * Tuning:
 *   MIRROR_CONCURRENCY=8 (default). Bump on a beefy box, drop to 4 if
 *   rdcpix returns 429s.
 *
 * Resumability:
 *   Per-photo failures are logged and skipped. Re-run picks up where
 *   the prior run left off — the objectExists check skips successful
 *   work and only laggards get retried.
 */

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import {
  runConcurrent,
  getS3Client,
  mirrorPhoto,
} from "../src/lib/ingestion/stages/mirror";
import type { NormalizedPhoto } from "../src/lib/ingestion/types";

interface PhotoTask {
  photoId: string;
  externalId: string;
  photo: NormalizedPhoto;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Per-request throttle (ms) to stay under rdcpix's abuse threshold. The
// first full run tripped an IP-level 403 block after a few thousand
// requests in a short window. Set e.g. BACKFILL_DELAY_MS=1000 for a slow
// sub-threshold trickle. Default 0 (no delay).
const DELAY_MS = parseInt(process.env.BACKFILL_DELAY_MS ?? "", 10) || 0;

// Circuit breaker: if this many photos fail back-to-back, we're almost
// certainly IP-blocked (not hitting scattered dead URLs). Abort the run
// instead of grinding through 140K guaranteed failures and hammering a CDN
// that's already refusing us. Re-run later once the block lifts — it's
// idempotent. Override with BACKFILL_BREAKER (0 disables).
const BREAKER = process.env.BACKFILL_BREAKER !== undefined
  ? parseInt(process.env.BACKFILL_BREAKER, 10)
  : 25;

// Optional cap on how many photos to process this run. Used for calibration
// runs (measure the sustainable rate on a small slice before committing to
// the full set). Default 0 = no cap.
const LIMIT = parseInt(process.env.BACKFILL_LIMIT ?? "", 10) || 0;

/**
 * mirrorPhoto swallows download/upload errors and returns null. A single
 * transient blip shouldn't strand a photo in the failure file — retry once
 * with backoff. We deliberately keep this to ONE retry: when rdcpix
 * IP-blocks us, every photo fails, and extra retries just multiply load
 * against a CDN that's already refusing us (the circuit breaker is what
 * actually protects the run).
 */
async function mirrorWithRetry(
  client: Parameters<typeof mirrorPhoto>[0],
  externalId: string,
  photo: NormalizedPhoto,
  attempts = 2,
): Promise<Awaited<ReturnType<typeof mirrorPhoto>>> {
  for (let i = 0; i < attempts; i++) {
    const result = await mirrorPhoto(client, externalId, photo, photo.ordering);
    if (result) return result;
    if (i < attempts - 1) await sleep(500 * (i + 1));
  }
  return null;
}

const REQUIRED_ENV = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

async function main() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Pin to DIRECT_URL — pgbouncer (port 6543) drops idle connections during
  // multi-hour loops. Direct connection (port 5432) holds.
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("Missing DIRECT_URL — backfill requires the direct Postgres connection (port 5432)");
    process.exit(1);
  }

  const concurrency = parseInt(process.env.MIRROR_CONCURRENCY ?? "", 10) || 8;

  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });

  console.log("── R2 photo backfill ──────────────────────────────");
  console.log(`  bucket:      ${process.env.R2_BUCKET_NAME}`);
  console.log(`  public URL:  ${process.env.R2_PUBLIC_URL}`);
  console.log(`  concurrency: ${concurrency}`);
  console.log("");

  console.log("Querying Photo rows still on rdcpix...");
  const rows = await prisma.photo.findMany({
    where: { url: { contains: "rdcpix.com" } },
    select: {
      id: true,
      sourceUrl: true,
      width: true,
      height: true,
      ordering: true,
      listing: { select: { externalId: true } },
    },
  });
  console.log(`  ${rows.length} candidate photos`);

  const tasks: PhotoTask[] = [];
  let skippedNoSource = 0;
  let skippedNoExternalId = 0;
  for (const row of rows) {
    if (!row.sourceUrl) {
      skippedNoSource++;
      continue;
    }
    const externalId = row.listing.externalId;
    if (!externalId) {
      skippedNoExternalId++;
      continue;
    }
    tasks.push({
      photoId: row.id,
      externalId,
      photo: {
        // Upgrade http://→https:// up front. rdcpix 301-redirects http to
        // https, so leaving it as http costs a wasted round-trip per photo
        // and doubles request volume against the CDN — which is what
        // triggered transient 403 rate-limiting on the first run. Same
        // bytes either way.
        sourceUrl: row.sourceUrl.replace(/^http:\/\//, "https://"),
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        ordering: row.ordering,
      },
    });
  }

  if (skippedNoSource) console.log(`  ${skippedNoSource} skipped (no sourceUrl)`);
  if (skippedNoExternalId) console.log(`  ${skippedNoExternalId} skipped (no listing.externalId)`);

  if (LIMIT && tasks.length > LIMIT) {
    tasks.length = LIMIT;
    console.log(`  BACKFILL_LIMIT=${LIMIT} — capping this run to ${LIMIT} photos`);
  }
  console.log(`  ${tasks.length} photos to mirror\n`);

  if (tasks.length === 0) {
    console.log("Nothing to backfill. Exiting.");
    await prisma.$disconnect();
    return;
  }

  const client = getS3Client();
  const total = tasks.length;
  const startTs = Date.now();
  let done = 0;
  let mirrored = 0;
  let dbUpdated = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  let aborted = false;
  const failures: { photoId: string; externalId: string; ordering: number; reason: string }[] = [];
  const LOG_EVERY = Math.max(100, Math.floor(total / 500));

  if (DELAY_MS) console.log(`  throttle: ${DELAY_MS}ms/request`);
  if (BREAKER) console.log(`  circuit breaker: abort after ${BREAKER} consecutive failures`);
  console.log("");

  await runConcurrent(tasks, concurrency, async (task) => {
    // Once the breaker trips, drain the remaining tasks as fast no-ops
    // rather than keep hitting a CDN that's blocking us.
    if (aborted) return;
    if (DELAY_MS) await sleep(DELAY_MS);
    try {
      const result = await mirrorWithRetry(client, task.externalId, task.photo);
      if (!result) {
        failed++;
        consecutiveFailures++;
        failures.push({
          photoId: task.photoId,
          externalId: task.externalId,
          ordering: task.photo.ordering,
          reason: "mirrorPhoto returned null after retries",
        });
        if (BREAKER && consecutiveFailures >= BREAKER && !aborted) {
          aborted = true;
          console.error(
            `\n⚠️  ${consecutiveFailures} consecutive failures — looks like an IP block. ` +
              `Aborting (run is idempotent; re-run once rdcpix lets us back in).`,
          );
        }
      } else {
        consecutiveFailures = 0;
        mirrored++;
        try {
          await prisma.photo.update({
            where: { id: task.photoId },
            data: { url: result.url, thumbnailUrl: result.thumbnailUrl },
          });
          dbUpdated++;
        } catch (dbErr) {
          failed++;
          failures.push({
            photoId: task.photoId,
            externalId: task.externalId,
            ordering: task.photo.ordering,
            reason: `DB update failed: ${(dbErr as Error).message}`,
          });
        }
      }
    } catch (err) {
      failed++;
      consecutiveFailures++;
      failures.push({
        photoId: task.photoId,
        externalId: task.externalId,
        ordering: task.photo.ordering,
        reason: `unexpected: ${(err as Error).message}`,
      });
      if (BREAKER && consecutiveFailures >= BREAKER && !aborted) {
        aborted = true;
        console.error(
          `\n⚠️  ${consecutiveFailures} consecutive failures — looks like an IP block. ` +
            `Aborting (run is idempotent; re-run once rdcpix lets us back in).`,
        );
      }
    } finally {
      done++;
      if (done % LOG_EVERY === 0 || done === total) {
        const elapsed = (Date.now() - startTs) / 1000;
        const rate = done / Math.max(elapsed, 0.001);
        const etaSec = (total - done) / Math.max(rate, 0.001);
        const etaMin = Math.round(etaSec / 60);
        console.log(
          `  [${done}/${total}] ${Math.round((done / total) * 100)}% — ` +
            `${rate.toFixed(1)} photos/sec, ${failed} failed, ETA ${etaMin}min`,
        );
      }
    }
  });

  const totalSec = Math.round((Date.now() - startTs) / 1000);
  const totalMin = (totalSec / 60).toFixed(1);
  console.log(`\n── ${aborted ? "ABORTED (circuit breaker)" : "Done"} in ${totalMin}min ──────────`);
  if (aborted) {
    console.log("  Stopped early on a run of consecutive failures (likely IP-blocked).");
    console.log("  Re-run once rdcpix unblocks us — already-mirrored photos are skipped.");
  }
  console.log(`  mirrored:   ${mirrored} (incl. idempotent re-uses)`);
  console.log(`  db updated: ${dbUpdated}`);
  console.log(`  failed:     ${failed}`);

  if (failures.length) {
    const failurePath = "plans/r2-backfill-failures.md";
    await fs.mkdir("plans", { recursive: true });
    const body = [
      `# R2 backfill failures — ${new Date().toISOString()}`,
      "",
      `${failures.length} of ${total} photos failed. Re-running the backfill will retry only the still-failing rows (already-mirrored objects are idempotent).`,
      "",
      "| Photo.id | externalId | ordering | reason |",
      "| --- | --- | --- | --- |",
      ...failures.map((f) => `| ${f.photoId} | ${f.externalId} | ${f.ordering} | ${f.reason.replace(/\|/g, "\\|")} |`),
    ].join("\n");
    await fs.writeFile(failurePath, body);
    console.log(`  failure detail: ${failurePath}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
