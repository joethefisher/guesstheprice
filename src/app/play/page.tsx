import type { Metadata } from "next";
import { fetchOneListing } from "@/lib/listing-fetch";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Play — Guess the Housing Price",
  description:
    "Real homes. Real prices. Try to guess what each one sold for — score is based on how close you get.",
  alternates: { canonical: "/play" },
  openGraph: {
    title: "Play — Guess the Housing Price",
    description: "Real homes. Real prices. How close can you get?",
    url: "/play",
    type: "website",
  },
};

/**
 * /play renders as a server component so round 1 ships inline in the HTML —
 * no JS-then-fetch round-trip for the most common path. Subsequent rounds
 * are handled client-side via the existing /api/listings call + sessionStorage
 * prefetch cache.
 */
export default async function PlayPage() {
  const initialListing = await fetchOneListing();
  return <PlayClient initialListing={initialListing} />;
}
