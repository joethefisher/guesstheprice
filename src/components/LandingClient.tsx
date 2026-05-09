"use client";

import { useRouter } from "next/navigation";
import { LandingScreen } from "./LandingScreen";

export function LandingClient({ listingCount }: { listingCount: number }) {
  const router = useRouter();
  return (
    <LandingScreen
      listingCount={listingCount}
      onPlay={() => router.push("/play")}
    />
  );
}
