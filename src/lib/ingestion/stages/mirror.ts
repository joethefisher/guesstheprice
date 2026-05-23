import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { writeCacheDir } from "../cache";
import type { NormalizedListing, MirroredListing, MirroredPhoto, NormalizedPhoto } from "../types";

const BUCKET = process.env.R2_BUCKET_NAME ?? "guesstheprice-photos";
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL ?? "";

// How many photos to mirror in parallel. 8 is a sweet spot:
// - 8 × ~100MB Sharp instance memory = ~800MB peak, fine on a laptop
// - 8 × ~1 photo/sec/worker = ~8 photos/sec to Realtor's CDN, well below
//   any reasonable abuse threshold
// Tune up to 16-32 on a beefy machine with good network for faster backfills.
const DEFAULT_CONCURRENCY = 8;

function getS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

/**
 * Process `items` through `fn` with at most `concurrency` in flight.
 * Order-preserving: results[i] corresponds to items[i].
 * Keeps memory bounded; doesn't accumulate completed work until all done.
 */
export async function runConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  return results;
}

async function objectExists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image: ${contentType}`);
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > 10 * 1024 * 1024) {
    throw new Error(`Image too large: ${buf.byteLength} bytes`);
  }

  return Buffer.from(buf);
}

async function uploadToR2(
  client: S3Client,
  key: string,
  body: Buffer,
  contentType = "image/jpeg"
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${PUBLIC_URL_BASE}/${key}`;
}

async function mirrorPhoto(
  client: S3Client,
  externalId: string,
  photo: NormalizedPhoto,
  index: number
): Promise<MirroredPhoto | null> {
  const base = `listings/${externalId}/${index}`;
  const displayKey = `${base}.jpg`;
  const thumbKey = `${base}_thumb.jpg`;

  try {
    // Check if already mirrored (idempotent) — must verify both sizes exist.
    // This makes long backfills resumable: if the job dies at hour 6,
    // restarting picks up exactly where it left off.
    const alreadyMirrored = await objectExists(client, displayKey) && await objectExists(client, thumbKey);

    let displayUrl: string;
    let thumbUrl: string;
    let mirroredWidth: number | undefined;
    let mirroredHeight: number | undefined;

    if (alreadyMirrored) {
      displayUrl = `${PUBLIC_URL_BASE}/${displayKey}`;
      thumbUrl = `${PUBLIC_URL_BASE}/${thumbKey}`;
    } else {
      const rawBuf = await downloadImage(photo.sourceUrl);

      // Resize to 1600w display
      const display = await sharp(rawBuf)
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer({ resolveWithObject: true });

      // Resize to 400w thumbnail
      const thumb = await sharp(rawBuf)
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer({ resolveWithObject: true });

      mirroredWidth = display.info.width;
      mirroredHeight = display.info.height;

      displayUrl = await uploadToR2(client, displayKey, display.data);
      thumbUrl = await uploadToR2(client, thumbKey, thumb.data);
    }

    return {
      ...photo,
      url: displayUrl,
      thumbnailUrl: thumbUrl,
      mirroredWidth,
      mirroredHeight,
    };
  } catch (err) {
    console.warn(`    photo ${index} failed for ${externalId}: ${(err as Error).message}`);
    return null;
  }
}

interface PhotoTask {
  listingIndex: number;
  externalId: string;
  photo: NormalizedPhoto;
}

export async function runMirror(
  normalized: NormalizedListing[]
): Promise<MirroredListing[]> {
  console.log("\n── Stage 4: Mirror ────────────────────────────────");

  const r2Configured = !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_PUBLIC_URL
  );

  if (!r2Configured) {
    console.log("  R2 not configured — using source URLs directly (dev mode)");
    const passthrough: MirroredListing[] = normalized.map((l) => ({
      ...l,
      photos: l.photos.map((p) => ({
        ...p,
        url: p.sourceUrl,
        thumbnailUrl: p.sourceUrl,
      })),
    }));
    const filename = `mirrored-${Date.now()}.json`;
    await writeCacheDir(".cache/mirrored", filename, passthrough);
    console.log(`  Saved to .cache/mirrored/${filename}\n`);
    return passthrough;
  }

  const concurrency = parseInt(process.env.MIRROR_CONCURRENCY ?? "", 10) || DEFAULT_CONCURRENCY;
  const client = getS3Client();

  // Flatten every (listing, photo) pair into a flat task list so concurrency
  // is bounded globally rather than per-listing. A listing with 3 photos
  // doesn't leave 5 worker slots idle while a 20-photo listing finishes.
  const tasks: PhotoTask[] = [];
  for (let i = 0; i < normalized.length; i++) {
    for (const photo of normalized[i].photos) {
      tasks.push({ listingIndex: i, externalId: normalized[i].externalId, photo });
    }
  }

  const total = tasks.length;
  const startTs = Date.now();
  let done = 0;
  let failed = 0;
  const LOG_EVERY = Math.max(50, Math.floor(total / 200)); // ~200 progress lines total

  console.log(`  ${normalized.length} listings, ${total} photos, concurrency=${concurrency}`);

  const results = await runConcurrent(tasks, concurrency, async (task) => {
    const result = await mirrorPhoto(client, task.externalId, task.photo, task.photo.ordering);
    done++;
    if (result === null) failed++;
    if (done % LOG_EVERY === 0 || done === total) {
      const elapsed = (Date.now() - startTs) / 1000;
      const rate = done / elapsed;
      const etaSec = (total - done) / Math.max(rate, 0.001);
      const etaMin = Math.round(etaSec / 60);
      console.log(
        `  [${done}/${total}] ${Math.round((done / total) * 100)}% — ` +
        `${rate.toFixed(1)} photos/sec, ${failed} failed, ETA ${etaMin}min`,
      );
    }
    return { listingIndex: task.listingIndex, result };
  });

  // Reassemble per-listing photo arrays, preserving original order.
  const photosByListing: MirroredPhoto[][] = normalized.map(() => []);
  const failuresByListing: number[] = normalized.map(() => 0);
  for (const { listingIndex, result } of results) {
    if (result) {
      photosByListing[listingIndex].push(result);
    } else {
      failuresByListing[listingIndex]++;
    }
  }

  // Apply the same per-listing quality penalty + 3-photo drop rule as before.
  let ok = 0;
  let dropped = 0;
  const mirrored: MirroredListing[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const listing = normalized[i];
    const photos = photosByListing[i].sort((a, b) => a.ordering - b.ordering);
    if (photos.length < 3) {
      dropped++;
      continue;
    }
    mirrored.push({
      ...listing,
      qualityScore: Math.max(0, listing.qualityScore - failuresByListing[i] * 5),
      photos,
    });
    ok++;
  }

  const totalSec = Math.round((Date.now() - startTs) / 1000);
  console.log(
    `\n  ${ok} listings mirrored, ${dropped} dropped, ` +
    `${total - failed} photos succeeded, ${failed} failed, ${totalSec}s total\n`,
  );

  const filename = `mirrored-${Date.now()}.json`;
  await writeCacheDir(".cache/mirrored", filename, mirrored);
  console.log(`  Saved to .cache/mirrored/${filename}\n`);

  return mirrored;
}
