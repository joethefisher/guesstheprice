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

    if (listingCount > 0) {
      const skip = Math.floor(Math.random() * listingCount);
      const hero = await prisma.listing.findFirst({
        where: { isActive: true, qualityScore: { gte: 50 } },
        skip,
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
