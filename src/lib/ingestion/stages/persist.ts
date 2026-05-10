import { PrismaClient } from "@prisma/client";
import type { MirroredListing } from "../types";

export async function persistOne(listing: MirroredListing, prisma: PrismaClient): Promise<boolean> {
  if (listing.photos.length < 3) return false;

  await prisma.$transaction(async (tx) => {
    // Delete existing photos for this external ID (so we can recreate fresh)
    const existing = await tx.listing.findUnique({
      where: { externalId: listing.externalId },
      select: { id: true },
    });

    if (existing) {
      await tx.photo.deleteMany({ where: { listingId: existing.id } });
    }

    await tx.listing.upsert({
      where: { externalId: listing.externalId },
      update: {
        soldPrice: listing.soldPrice,
        qualityScore: listing.qualityScore,
        updatedAt: new Date(),
        photos: {
          create: listing.photos.map((p) => ({
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
            sourceUrl: p.sourceUrl,
            width: p.mirroredWidth ?? p.width,
            height: p.mirroredHeight ?? p.height,
            ordering: p.ordering,
          })),
        },
      },
      create: {
        externalId: listing.externalId,
        source: listing.source,
        streetAddress: listing.streetAddress,
        neighborhood: listing.neighborhood,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zipCode,
        latitude: listing.latitude,
        longitude: listing.longitude,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        lotSqft: listing.lotSqft,
        yearBuilt: listing.yearBuilt,
        homeType: listing.homeType,
        soldPrice: listing.soldPrice,
        soldDate: listing.soldDate,
        isSold: true,
        isActive: true,
        qualityScore: listing.qualityScore,
        photos: {
          create: listing.photos.map((p) => ({
            url: p.url,
            thumbnailUrl: p.thumbnailUrl,
            sourceUrl: p.sourceUrl,
            width: p.mirroredWidth ?? p.width,
            height: p.mirroredHeight ?? p.height,
            ordering: p.ordering,
          })),
        },
      },
    });
  });

  return true;
}

export async function runPersist(mirrored: MirroredListing[], prisma: PrismaClient): Promise<{
  ingested: number;
  skipped: number;
}> {
  console.log("\n── Stage 5: Persist ───────────────────────────────");
  let ingested = 0;
  let skipped = 0;

  for (const listing of mirrored) {
    try {
      const ok = await persistOne(listing, prisma);
      if (ok) {
        ingested++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  Failed ${listing.externalId}:`, (err as Error).message);
      skipped++;
    }
  }

  console.log(`  Persisted: ${ingested} listings`);
  console.log(`  Skipped:   ${skipped} listings\n`);

  return { ingested, skipped };
}
