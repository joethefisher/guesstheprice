import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let listingCount = 0;
  let heroPhotoUrl: string | null = null;
  let heroLocation: { neighborhood: string | null; city: string; state: string } | null = null;

  try {
    listingCount = await prisma.listing.count({
      where: { isActive: true, qualityScore: { gte: 50 } },
    });

    const heroRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE "isActive" = true
      AND "qualityScore" >= 50
      AND "soldPrice" >= 1000000
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (heroRows.length > 0) {
      const hero = await prisma.listing.findUnique({
        where: { id: heroRows[0].id },
        include: { photos: { orderBy: { ordering: "asc" }, take: 1 } },
      });
      if (hero) {
        heroPhotoUrl = hero.photos[0]?.url ?? null;
        heroLocation = { neighborhood: hero.neighborhood, city: hero.city, state: hero.state };
      }
    }
  } catch {
    // DB unavailable — landing still renders with fallback photo
  }

  return <LandingClient listingCount={listingCount} heroPhotoUrl={heroPhotoUrl} heroLocation={heroLocation} />;
}
