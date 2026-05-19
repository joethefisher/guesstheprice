import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

type SeedListing = {
  externalId: string;
  streetAddress: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  beds: number;
  baths: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  homeType?: string;
  soldPrice: number;
  soldDate?: string;
  photos: string[];
};

async function main() {
  const dataPath = join(process.cwd(), "data", "sample-listings.json");
  const raw = readFileSync(dataPath, "utf-8");
  const listings: SeedListing[] = JSON.parse(raw);

  console.log(`Seeding ${listings.length} listings...`);

  // Wipe existing data so re-seeding is clean
  await prisma.round.deleteMany();
  await prisma.game.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.listing.deleteMany();

  for (const l of listings) {
    await prisma.listing.create({
      data: {
        externalId: l.externalId,
        source: "seed",
        streetAddress: l.streetAddress,
        neighborhood: l.neighborhood,
        city: l.city,
        state: l.state,
        zipCode: l.zipCode,
        latitude: l.latitude,
        longitude: l.longitude,
        beds: l.beds,
        baths: l.baths,
        sqft: l.sqft,
        lotSqft: l.lotSqft,
        yearBuilt: l.yearBuilt,
        homeType: l.homeType,
        soldPrice: l.soldPrice,
        soldDate: l.soldDate ? new Date(l.soldDate) : undefined,
        isSold: true,
        qualityScore: 80,
        photos: {
          create: l.photos.map((url, i) => ({
            url,
            ordering: i
          }))
        }
      }
    });
    console.log(`  ✓ ${l.streetAddress}, ${l.city}`);
  }

  const count = await prisma.listing.count();
  console.log(`\nDone. ${count} listings in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
