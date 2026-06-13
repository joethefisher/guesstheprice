import type { Metadata } from "next";
import Link from "next/link";
import {
  citySlug,
  stateSlug,
  getAllCityCounts,
  formatPriceUsd,
} from "@/lib/city-data";

export const metadata: Metadata = {
  title: "Cities — Pricetag",
  description:
    "Guess home prices city by city across 39 U.S. metros and secondary markets. Real Realtor.com listings, scored against your guess.",
  alternates: { canonical: "/cities" },
  openGraph: {
    title: "Pricetag — Cities",
    description:
      "Guess home prices across 39 U.S. metro and secondary markets.",
    url: "/cities",
    type: "website",
  },
};

// 24h ISR keeps the index fresh as new markets are added without burning the
// DB on every visit.
export const revalidate = 86400;

export default async function CitiesIndexPage() {
  const cities = await getAllCityCounts();

  // Sort by listing count desc (markets we've covered most go first), then
  // alphabetical within ties. Markets with zero listings still show — they
  // signal coverage scope honestly. The page state for those tells the user
  // we're still ingesting that market.
  const sorted = [...cities].sort((a, b) => {
    if (b.listingCount !== a.listingCount) return b.listingCount - a.listingCount;
    return a.city.localeCompare(b.city);
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="display text-4xl text-ink mb-3">Cities</h1>
      <p className="text-ink-mute text-base mb-10 max-w-2xl">
        Each city below has its own dataset of real homes you can guess. Listing
        counts grow as our ingest expands; click into a city to see the median
        price, top neighborhoods, and play that market specifically.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
        {sorted.map((c) => {
          const href = `/cities/${stateSlug(c.state)}/${citySlug(c.city)}`;
          return (
            <li key={`${c.state}-${c.city}`} className="border-b border-rule pb-3">
              <Link
                href={href}
                className="block group"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="display text-lg text-ink group-hover:text-accent">
                    {c.city}, {c.state}
                  </span>
                  <span className="text-ink-quiet text-xs">
                    {c.listingCount > 0
                      ? `${c.listingCount} ${c.listingCount === 1 ? "home" : "homes"}`
                      : "coming soon"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-ink-mute text-sm mt-12">
        Not seeing a city you want? Listings are ingested from Realtor.com — see{" "}
        <Link href="/methodology" className="underline">
          methodology
        </Link>{" "}
        for how market coverage is decided.
      </p>
    </main>
  );
}

// Quick price formatter export so the JSX above stays readable. Not actually
// rendered here but kept in case sidebar median display is added later.
export const _formatPriceUsd = formatPriceUsd;
