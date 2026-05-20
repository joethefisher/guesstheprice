"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingScreen } from "./LandingScreen";
import { prefetchBatch } from "@/lib/prefetch";
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
  useEffect(() => { prefetchBatch(5); }, []);
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
