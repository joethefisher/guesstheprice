import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology — Pricetag",
  description:
    "Where Pricetag listings come from, how they're ingested, why some markets are weighted higher, and how the scoring math works.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "Pricetag — methodology",
    description:
      "Data sources, ingest pipeline, market weighting, and scoring math.",
    url: "/methodology",
    type: "website",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pricetag — methodology",
  description:
    "Where Pricetag listings come from, how they're ingested, why some markets are weighted higher, and how the scoring math works.",
  url: "https://guesstheprice.ai/methodology",
  author: {
    "@type": "Person",
    name: "Joe Fisher",
    url: "https://joeking.ai",
  },
  publisher: {
    "@type": "Organization",
    name: "Pricetag",
    url: "https://guesstheprice.ai",
  },
  datePublished: "2026-06-12",
  inLanguage: "en-US",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <h1 className="display text-4xl text-ink mb-8">Methodology</h1>

      <div className="space-y-8 text-ink text-base leading-relaxed">
        <section>
          <h2 className="display text-2xl text-ink mb-3">Listings source</h2>
          <p>
            Pricetag sources its homes from Realtor.com&apos;s public listings
            via their structured API. Each listing carries the publisher&apos;s
            published list price, address, beds, baths, square footage, lot size,
            year built, and the photo set the publisher uploaded. We mirror
            photos to our own CDN (Cloudflare R2) so the game keeps working
            even if a listing is removed from Realtor.com after ingest.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Ingest pipeline</h2>
          <p>
            Ingest runs in four staged passes:
          </p>
          <ol className="list-decimal list-inside ml-2 mt-3 space-y-1 text-ink-soft">
            <li>
              <strong>Plan</strong> — pick which markets to query, how many homes
              from each.
            </li>
            <li>
              <strong>Fetch</strong> — pull raw listing JSON from the source API,
              cache to R2.
            </li>
            <li>
              <strong>Normalize</strong> — parse fields, validate addresses,
              compute neighborhood from coordinates where missing.
            </li>
            <li>
              <strong>Persist</strong> — write to Postgres only the listings
              that pass a quality gate (has photos, has a valid price, has a
              parseable address).
            </li>
          </ol>
          <p className="mt-3">
            The staged design means a failure at one step doesn&apos;t corrupt
            the database — bad data fails at normalize and never makes it to
            the gameable pool.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Why some markets show up more</h2>
          <p>
            Our target-markets list weights cities by tier. Top metros (NYC,
            LA, Chicago, Houston, Dallas, Miami, Atlanta, Boston, Seattle,
            Washington DC, Denver, Phoenix, Philadelphia, San Francisco) are
            weighted 1.0 — they show up most often. Secondary cities (Buffalo,
            Memphis, Tulsa, Birmingham, Des Moines, Columbus, Pittsburgh, etc.)
            are weighted 0.4–0.6 — they show up sometimes, which keeps the
            game from feeling like only the same five cities.
          </p>
          <p className="mt-3">
            The weighting is editable; it&apos;s in{" "}
            <code className="bg-cream px-1 py-0.5 rounded text-sm">
              data/target-markets.json
            </code>{" "}
            in the public repo. If a market you care about is missing, that&apos;s
            the file to change.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Scoring math</h2>
          <p>
            Each guess is scored as 1 minus the absolute percent difference from
            the actual price, clamped to [0, 1] and reported as a percentage.
            A guess of $850k on a $1M home scores 85% accuracy. A guess of $400k
            on a $1M home scores 40%. Guesses above or below the actual price
            are symmetric — we don&apos;t penalize over-guesses more than
            under-guesses.
          </p>
          <p className="mt-3">
            The accuracy gets binned into the buckets you see on the result
            screen and the leaderboard. The bucket cutoffs are 90/80/70/60/50;
            see{" "}
            <Link href="/how-it-works" className="text-accent underline">
              How it works
            </Link>{" "}
            for the bucket labels.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Address redaction</h2>
          <p>
            The full street address is never displayed until you submit a guess.
            On the play screen you see neighborhood + city + state — enough to
            calibrate against the market, not enough to look up the listing
            directly. After your guess, the reveal screen shows the address, the
            list price, and a link to the original listing.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Listing freshness</h2>
          <p>
            We re-ingest on a schedule that varies by market tier. Top metros
            refresh every few days; secondary cities refresh weekly. Each home&apos;s
            reveal screen shows the ingest date, so you know whether the price
            you guessed against was captured this week or last month.
          </p>
        </section>

        <p className="text-ink-mute text-sm mt-12">
          Questions we didn&apos;t cover are probably in the{" "}
          <Link href="/faq" className="underline">
            FAQ
          </Link>
          . Story of the project on the{" "}
          <Link href="/about" className="underline">
            About page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
