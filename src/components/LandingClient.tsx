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

interface TopScorer {
  username: string;
  score: number;
}

export function LandingClient({
  listingCount,
  heroPhotoUrl,
  heroLocation,
  topScorer,
}: {
  listingCount: number;
  heroPhotoUrl: string | null;
  heroLocation: HeroLocation | null;
  topScorer: TopScorer | null;
}) {
  const router = useRouter();
  useEffect(() => { prefetchBatch(5); }, []);
  return (
    <LandingScreen
      listingCount={listingCount}
      heroPhotoUrl={heroPhotoUrl}
      heroLocation={heroLocation}
      topScorer={topScorer}
      onPlay={() => router.push("/play")}
      onDaily={() => router.push("/daily")}
      onLeaderboard={() => router.push("/leaderboard")}
      onSaved={() => router.push("/saved")}
    />
  );
}
