"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingScreen } from "./LandingScreen";
import { prefetchBatch, prefetchDaily } from "@/lib/prefetch";
import type { RecentStats } from "@/app/page";

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
  heroPhotoUrl,
  heroLocation,
  topScorer,
  recentStats,
}: {
  heroPhotoUrl: string | null;
  heroLocation: HeroLocation | null;
  topScorer: TopScorer | null;
  recentStats: RecentStats;
}) {
  const router = useRouter();
  useEffect(() => {
    // Warm sessionStorage so /play and /daily render their first listing
    // without waiting on a network round-trip.
    prefetchBatch(5);
    prefetchDaily();
  }, []);
  return (
    <LandingScreen
      heroPhotoUrl={heroPhotoUrl}
      heroLocation={heroLocation}
      topScorer={topScorer}
      recentStats={recentStats}
      onPlay={() => router.push("/play")}
      onDaily={() => router.push("/daily")}
      onLeaderboard={() => router.push("/leaderboard")}
      onSaved={() => router.push("/saved")}
    />
  );
}
