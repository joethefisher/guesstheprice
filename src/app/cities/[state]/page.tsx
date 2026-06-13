import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  citySlug,
  stateSlug,
  getAllCityCounts,
  getAllTargetCities,
} from "@/lib/city-data";

type Props = {
  params: Promise<{ state: string }>;
};

export const revalidate = 86400;

// Pre-render one page per distinct state in our target-markets list. Adding a
// new market in a never-before-seen state automatically gets a state page.
export function generateStaticParams() {
  const states = Array.from(
    new Set(getAllTargetCities().map(({ state }) => state)),
  );
  return states.map((state) => ({ state: stateSlug(state) }));
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function resolveState(slug: string): { code: string; name: string } | null {
  const code = slug.toUpperCase();
  const name = STATE_NAMES[code];
  if (!name) return null;
  const inTarget = getAllTargetCities().some((m) => m.state === code);
  if (!inTarget) return null;
  return { code, name };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) return { title: "State not found — Pricetag" };
  return {
    title: `${resolved.name} home prices — guess them | Pricetag`,
    description: `Guess the price of real homes across ${resolved.name}. Cities, neighborhoods, and listings sourced from Realtor.com.`,
    alternates: { canonical: `/cities/${stateSlug(resolved.code)}` },
    openGraph: {
      title: `${resolved.name} home prices — Pricetag`,
      description: `Real ${resolved.name} homes. Guess the price.`,
      url: `/cities/${stateSlug(resolved.code)}`,
      type: "website",
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) notFound();

  const allCounts = await getAllCityCounts();
  const cities = allCounts
    .filter((c) => c.state === resolved.code)
    .sort((a, b) => {
      if (b.listingCount !== a.listingCount) return b.listingCount - a.listingCount;
      return a.city.localeCompare(b.city);
    });

  const stateCanonical = `https://guesstheprice.ai/cities/${stateSlug(resolved.code)}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://guesstheprice.ai" },
      { "@type": "ListItem", position: 2, name: "Cities", item: "https://guesstheprice.ai/cities" },
      { "@type": "ListItem", position: 3, name: resolved.name, item: stateCanonical },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="text-ink-mute text-sm mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/cities" className="hover:text-ink">Cities</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{resolved.name}</span>
      </nav>

      <h1 className="display text-4xl text-ink mb-3">
        Guess {resolved.name} home prices
      </h1>
      <p className="text-ink-mute text-base mb-10 max-w-2xl">
        {resolved.name} markets currently covered by Pricetag. Click any city to
        see median price, top neighborhoods, and play that market.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {cities.map((c) => {
          const href = `/cities/${stateSlug(c.state)}/${citySlug(c.city)}`;
          return (
            <li key={c.city} className="border-b border-rule pb-2">
              <Link href={href} className="block group">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="display text-base text-ink group-hover:text-accent">
                    {c.city}
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
        Back to all{" "}
        <Link href="/cities" className="underline">
          cities
        </Link>{" "}
        · methodology behind the dataset at{" "}
        <Link href="/methodology" className="underline">
          /methodology
        </Link>
        .
      </p>
    </main>
  );
}
