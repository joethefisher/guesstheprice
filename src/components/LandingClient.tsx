"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingScreen } from "./LandingScreen";
import { prefetchBatch } from "@/lib/prefetch";

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
  useEffect(() => { prefetchBatch(5); }, []);
  return (
    <LandingScreen
      listingCount={listingCount}
      heroPhotoUrl={heroPhotoUrl}
      heroLocation={heroLocation}
      onPlay={() => router.push("/play")}
      onDaily={() => router.push("/daily")}
    />
  );
}
