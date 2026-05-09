import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { writeCacheDir } from "../cache";
import type { NormalizedListing, MirroredListing, MirroredPhoto, NormalizedPhoto } from "../types";

const BUCKET = process.env.R2_BUCKET_NAME ?? "pricetag-photos";
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL ?? "";

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
    // Check if already mirrored (idempotent)
    const alreadyMirrored = await objectExists(client, displayKey);

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
    console.warn(`    Photo ${index} failed for ${externalId}: ${(err as Error).message}`);
    return null;
  }
}

export async function mirrorListing(
  client: S3Client,
  listing: NormalizedListing
): Promise<MirroredListing> {
  const mirrored: MirroredPhoto[] = [];
  let qualityPenalty = 0;

  for (const photo of listing.photos) {
    const result = await mirrorPhoto(client, listing.externalId, photo, photo.ordering);
    if (result) {
      mirrored.push(result);
    } else {
      qualityPenalty += 5;
    }
  }

  return {
    ...listing,
    qualityScore: Math.max(0, listing.qualityScore - qualityPenalty),
    photos: mirrored,
  };
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

  const client = getS3Client();
  const mirrored: MirroredListing[] = [];
  let ok = 0;
  let failed = 0;

  for (const listing of normalized) {
    process.stdout.write(`  ${listing.externalId} (${listing.photos.length} photos)… `);
    const result = await mirrorListing(client, listing);
    if (result.photos.length >= 3) {
      mirrored.push(result);
      ok++;
      console.log(`✓ ${result.photos.length} mirrored`);
    } else {
      failed++;
      console.log(`✗ too few photos after mirroring`);
    }
  }

  console.log(`\n  ${ok} listings mirrored, ${failed} dropped\n`);

  const filename = `mirrored-${Date.now()}.json`;
  await writeCacheDir(".cache/mirrored", filename, mirrored);
  console.log(`  Saved to .cache/mirrored/${filename}\n`);

  return mirrored;
}
