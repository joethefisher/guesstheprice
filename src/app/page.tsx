import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let listingCount = 0;
  try {
    listingCount = await prisma.listing.count({
      where: { isActive: true, qualityScore: { gte: 50 } },
    });
  } catch {
    // DB unavailable — landing still renders, count shows as 0
  }

  return <LandingClient listingCount={listingCount} />;
}
