import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listingCount = await prisma.listing.count({
    where: { isActive: true, qualityScore: { gte: 50 } },
  });

  return <LandingClient listingCount={listingCount} />;
}
