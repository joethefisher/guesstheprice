"use client";

import { useRouter } from "next/navigation";
import { LandingScreen } from "./LandingScreen";

interface HeroLocation {
  neighborhood: string | null;
  city: string;
  state: string;
}

export function LandingClient({
  listingCount,
  heroPhotoUrl,
  heroLocation,
}: {
  listingCount: number;
  heroPhotoUrl: string | null;
  heroLocation: HeroLocation | null;
}) {
  const router = useRouter();
  return (
    <LandingScreen
      listingCount={listingCount}
      heroPhotoUrl={heroPhotoUrl}
      heroLocation={heroLocation}
      onPlay={() => router.push("/play")}
    />
  );
}
