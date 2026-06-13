import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  citySlug,
  stateSlug,
  neighborhoodSlug,
  resolveCityFromSlugs,
  resolveNeighborhoodFromSlugs,
  getAllNeighborhoodParams,
  getNeighborhoodStats,
  formatPriceUsd,
  formatSqft,
} from "@/lib/city-data";

type Props = {
  params: Promise<{ state: string; city: string; neighborhood: string }>;
};

export const revalidate = 86400;

// SSG every neighborhood with sufficient coverage. Cities below threshold don't
// generate per-neighborhood pages — prevents thin content + bounded build size.
export async function generateStaticParams() {
  const all = await getAllNeighborhoodParams();
  return all.map(({ city, state, neighborhood }) => ({
    state: stateSlug(state),
    city: citySlug(city),
    neighborhood: neighborhoodSlug(neighborhood),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, neighborhood } = await params;
  const identity = await resolveNeighborhoodFromSlugs(state, city, neighborhood);
  if (!identity) return { title: "Neighborhood not found — Pricetag" };

  const stats = await getNeighborhoodStats(
    identity.city,
    identity.state,
    identity.neighborhood,
  );
  const priceCopy = stats.medianPriceUsd
    ? ` Median list around ${formatPriceUsd(stats.medianPriceUsd)}.`
    : "";

  return {
    title: `${identity.neighborhood}, ${identity.city}, ${identity.state} home prices | Pricetag`,
    description: `Guess the price of real homes in ${identity.neighborhood}, ${identity.city}, ${identity.state}.${priceCopy} ${stats.listingCount} active listings.`,
    alternates: {
      canonical: `/cities/${stateSlug(identity.state)}/${citySlug(identity.city)}/neighborhoods/${neighborhoodSlug(identity.neighborhood)}`,
    },
    openGraph: {
      title: `${identity.neighborhood}, ${identity.city}, ${identity.state} — Pricetag`,
      description: `Real ${identity.neighborhood} homes. Guess the price.${priceCopy}`,
      url: `/cities/${stateSlug(identity.state)}/${citySlug(identity.city)}/neighborhoods/${neighborhoodSlug(identity.neighborhood)}`,
      type: "website",
    },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { state, city, neighborhood } = await params;
  const identity = await resolveNeighborhoodFromSlugs(state, city, neighborhood);
  if (!identity) notFound();

  const cityIdentity = resolveCityFromSlugs(state, city);
  if (!cityIdentity) notFound();

  const stats = await getNeighborhoodStats(
    identity.city,
    identity.state,
    identity.neighborhood,
  );

  const stateSlugStr = stateSlug(identity.state);
  const citySlugStr = citySlug(identity.city);
  const nhdSlugStr = neighborhoodSlug(identity.neighborhood);
  const canonical = `https://guesstheprice.ai/cities/${stateSlugStr}/${citySlugStr}/neighborhoods/${nhdSlugStr}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://guesstheprice.ai" },
      { "@type": "ListItem", position: 2, name: "Cities", item: "https://guesstheprice.ai/cities" },
      {
        "@type": "ListItem",
        position: 3,
        name: `${identity.city}, ${identity.state}`,
        item: `https://guesstheprice.ai/cities/${stateSlugStr}/${citySlugStr}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: identity.neighborhood,
        item: canonical,
      },
    ],
  };

  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: `Guess ${identity.neighborhood}, ${identity.city} home prices`,
    description: `A real-estate price guessing game scoped to ${identity.neighborhood} (${identity.city}, ${identity.state}) listings.`,
    url: canonical,
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
        <Link
          href={`/cities/${stateSlugStr}/${citySlugStr}`}
          className="hover:text-ink"
        >
          {identity.city}, {identity.state}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{identity.neighborhood}</span>
      </nav>

      <h1 className="display text-4xl text-ink mb-3">
        Guess {identity.neighborhood} home prices
      </h1>
      <p className="text-ink-mute text-base mb-10 max-w-2xl">
        Real {identity.neighborhood} homes (in {identity.city}, {identity.state}).
        Real prices. See how close you can get on each one.
      </p>

      {stats.listingCount > 0 ? (
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
      ) : (
        <section className="mb-10 border-y border-rule py-6">
          <p className="text-ink-soft">
            We&apos;re still building our {identity.neighborhood} dataset. Practice
            mode covers all our active markets.
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
      </section>

      <p className="text-ink-mute text-sm mt-12">
        Back to{" "}
        <Link
          href={`/cities/${stateSlugStr}/${citySlugStr}`}
          className="underline"
        >
          all {identity.city} markets
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
