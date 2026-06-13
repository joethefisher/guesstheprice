import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  citySlug,
  stateSlug,
  resolveCityFromSlugs,
  getAllTargetCities,
  getCityStats,
  getNearbyMarkets,
  formatPriceUsd,
  formatSqft,
} from "@/lib/city-data";

type Props = {
  params: Promise<{ state: string; city: string }>;
};

// Pre-render every city we have a target for at build time. New markets land
// in target-markets.json -> new static pages on next deploy. 24h ISR layered
// on top so listing counts + medians refresh daily.
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllTargetCities().map(({ city, state }) => ({
    state: stateSlug(state),
    city: citySlug(city),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const identity = resolveCityFromSlugs(state, city);
  if (!identity) return { title: "City not found — Pricetag" };

  const stats = await getCityStats(identity.city, identity.state);
  const priceCopy = stats.medianPriceUsd
    ? ` Median list around ${formatPriceUsd(stats.medianPriceUsd)}.`
    : "";

  return {
    title: `${identity.city}, ${identity.state} home prices — guess them | Pricetag`,
    description: `Guess the price of real homes in ${identity.city}, ${identity.state}.${priceCopy} ${stats.listingCount} active listings, sourced from Realtor.com.`,
    alternates: {
      canonical: `/cities/${stateSlug(identity.state)}/${citySlug(identity.city)}`,
    },
    openGraph: {
      title: `${identity.city}, ${identity.state} home prices — Pricetag`,
      description: `Real ${identity.city} homes. Guess the price.${priceCopy}`,
      url: `/cities/${stateSlug(identity.state)}/${citySlug(identity.city)}`,
      type: "website",
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const identity = resolveCityFromSlugs(state, city);
  if (!identity) notFound();

  const stats = await getCityStats(identity.city, identity.state);
  const cityCanonical = `https://guesstheprice.ai/cities/${stateSlug(identity.state)}/${citySlug(identity.city)}`;

  // BreadcrumbList lets Google show a breadcrumb trail in the SERP instead of
  // raw URL paths. Cheap structured-data win for hierarchical sites like this.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://guesstheprice.ai",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cities",
        item: "https://guesstheprice.ai/cities",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${identity.city}, ${identity.state}`,
        item: cityCanonical,
      },
    ],
  };

  // Game schema names this page as a playable instance of the game scoped to
  // a market — qualifies for richer Google sitelinks + rich result eligibility.
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: `Guess ${identity.city}, ${identity.state} Home Prices`,
    description: `A real-estate price guessing game scoped to ${identity.city}, ${identity.state} listings.`,
    url: cityCanonical,
    gameItem: {
      "@type": "Thing",
      name: `Real ${identity.city} home listings`,
    },
    playMode: "SinglePlayer",
  };

  const medianPriceStr = formatPriceUsd(stats.medianPriceUsd);
  const medianSqftStr = formatSqft(stats.medianSqft);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />

      <nav className="text-ink-mute text-sm mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/cities" className="hover:text-ink">Cities</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{identity.city}, {identity.state}</span>
      </nav>

      <h1 className="display text-4xl text-ink mb-3">
        Guess {identity.city}, {identity.state} home prices
      </h1>
      <p className="text-ink-mute text-base mb-10 max-w-2xl">
        Real homes in {identity.city}. Real prices. See how close you can get on
        each one.
      </p>

      {stats.listingCount > 0 ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 border-y border-rule py-6">
            <div>
              <div className="text-ink-mute text-xs uppercase tracking-wide">Listings</div>
              <div className="display text-2xl text-ink mt-1">{stats.listingCount}</div>
            </div>
            {medianPriceStr && (
              <div>
                <div className="text-ink-mute text-xs uppercase tracking-wide">Median price</div>
                <div className="display text-2xl text-ink mt-1">{medianPriceStr}</div>
              </div>
            )}
            {stats.medianBeds != null && (
              <div>
                <div className="text-ink-mute text-xs uppercase tracking-wide">Median size</div>
                <div className="display text-2xl text-ink mt-1">
                  {stats.medianBeds} bd
                  {medianSqftStr && (
                    <span className="text-ink-mute text-sm ml-2">{medianSqftStr}</span>
                  )}
                </div>
              </div>
            )}
          </section>

          {stats.topNeighborhoods.length > 0 && (
            <section className="mb-10">
              <h2 className="display text-xl text-ink mb-3">Top neighborhoods in our dataset</h2>
              <ul className="flex flex-wrap gap-2">
                {stats.topNeighborhoods.map((n) => (
                  <li
                    key={n}
                    className="px-3 py-1 bg-cream text-ink rounded-full text-sm"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="mb-10 border-y border-rule py-6">
          <p className="text-ink-soft">
            We&apos;re still building our {identity.city} dataset. Practice mode
            covers all our active markets — including upcoming {identity.city}
            listings as they come online.
          </p>
        </section>
      )}

      <section className="mb-10">
        <h2 className="display text-xl text-ink mb-3">Play</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/play"
            className="px-5 py-3 bg-ink text-paper-strong rounded-md hover:bg-accent display text-base"
          >
            Practice mode →
          </Link>
          <Link
            href="/daily"
            className="px-5 py-3 border border-ink text-ink rounded-md hover:bg-cream display text-base"
          >
            Today&apos;s daily round
          </Link>
        </div>
        <p className="text-ink-mute text-xs mt-3">
          Practice mode draws from all active markets. A market-specific play
          mode is on the roadmap.
        </p>
      </section>

      <NearbyMarkets current={identity} />

      <p className="text-ink-mute text-sm mt-12">
        See other cities at{" "}
        <Link href="/cities" className="underline">
          /cities
        </Link>{" "}
        · how listings are sourced at{" "}
        <Link href="/methodology" className="underline">
          methodology
        </Link>
        .
      </p>
    </main>
  );
}

// Renders 3-4 cross-links to related cities. Lifts crawl coverage off the
// homepage onto neighbor city pages so each city earns internal-link equity
// from N other city pages, not just the /cities index.
async function NearbyMarkets({
  current,
}: {
  current: { city: string; state: string };
}) {
  const nearby = await getNearbyMarkets(current, 4);
  if (nearby.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="display text-xl text-ink mb-3">Nearby markets</h2>
      <ul className="flex flex-wrap gap-2">
        {nearby.map((c) => {
          const href = `/cities/${stateSlug(c.state)}/${citySlug(c.city)}`;
          return (
            <li key={`${c.state}-${c.city}`}>
              <Link
                href={href}
                className="inline-block px-4 py-2 border border-rule rounded-md text-ink hover:bg-cream text-sm"
              >
                {c.city}, {c.state} →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
