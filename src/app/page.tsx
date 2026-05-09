import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LandingClient } from "@/components/LandingClient";

export default async function HomePage() {
  const listingCount = await prisma.listing.count({
    where: { isActive: true, qualityScore: { gte: 50 } },
  });

  return <LandingClient listingCount={listingCount} />;
}
