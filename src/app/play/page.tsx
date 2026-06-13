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

// schema.org Game — qualifies /play for richer Google rich-results
// eligibility (game card, related links). Lives here rather than in the root
// layout because it's specific to the play surface, not the whole site.
const playGameSchema = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "Guess the Housing Price",
  alternateName: "Pricetag",
  url: "https://guesstheprice.ai/play",
  description:
    "Real-estate price guessing game. Real homes, real prices, scored by accuracy.",
  genre: "Trivia",
  playMode: "SinglePlayer",
  inLanguage: "en-US",
};

// schema.org BreadcrumbList — completes the breadcrumb story for the
// game-route surface so SERPs render a clean hierarchy.
const playBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://guesstheprice.ai" },
    { "@type": "ListItem", position: 2, name: "Play", item: "https://guesstheprice.ai/play" },
  ],
};

/**
 * /play renders as a server component so round 1 ships inline in the HTML —
 * no JS-then-fetch round-trip for the most common path. Subsequent rounds
 * are handled client-side via the existing /api/listings call + sessionStorage
 * prefetch cache.
 */
export default async function PlayPage() {
  const initialListing = await fetchOneListing();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(playGameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(playBreadcrumbSchema) }}
      />
      <PlayClient initialListing={initialListing} />
    </>
  );
}
