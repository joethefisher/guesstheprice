import Link from "next/link";
import { PRODUCTS } from "@/lib/amazon-products";

// schema.org Game schema scoped to the Amazon variant.
const gameSchema = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "Pricetag Amazon edition",
  alternateName: "Guess the Amazon Price",
  url: "https://guesstheprice.ai/amazon",
  description:
    "Real-estate's price-guessing format applied to the weirdest products on Amazon.",
  genre: "Trivia",
  playMode: "SinglePlayer",
  inLanguage: "en-US",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://guesstheprice.ai" },
    { "@type": "ListItem", position: 2, name: "Amazon", item: "https://guesstheprice.ai/amazon" },
  ],
};

export default function AmazonLandingPage() {
  const sample = PRODUCTS.slice(0, 3);
  const totalProducts = PRODUCTS.length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="text-ink-mute text-sm mb-10" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Amazon</span>
      </nav>

      <p className="caption text-ink-mute text-xs uppercase tracking-widest mb-3">
        Pricetag · Amazon Edition
      </p>
      <h1 className="display text-5xl text-ink mb-5 leading-[1.05]">
        Real homes was the warm-up. <br/>
        Now: weird Amazon products.
      </h1>
      <p className="text-ink-soft text-base mb-10 max-w-2xl">
        An 8-foot gorilla chair. An existential-crisis duck lamp. A pillow shaped like a single
        dinosaur chicken nugget. Real listings, real prices. How close can you get?
      </p>

      <div className="flex flex-wrap gap-3 mb-12">
        <Link
          href="/amazon/play"
          className="px-6 py-3 bg-ink text-paper-strong rounded-md hover:bg-accent display text-base"
        >
          Start guessing →
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-ink text-ink rounded-md hover:bg-cream display text-base"
        >
          Play the house version
        </Link>
      </div>

      <section className="border-t border-rule pt-8 mb-10">
        <h2 className="display text-2xl text-ink mb-3">What you&apos;re guessing</h2>
        <p className="text-ink-soft text-base mb-6">
          {totalProducts} hand-picked Amazon listings. None are normal. Categories
          range from {" "}
          <em>What Even Is This?</em> to {" "}
          <em>Suspiciously Expensive</em>. The whole point is you have no idea what
          half of these things should cost.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sample.map((p) => (
            <li key={p.id} className="border border-rule rounded-md overflow-hidden bg-cream">
              <div
                className="aspect-square w-full"
                style={{
                  background: `${p.bandColor} url(${p.photos[0]}) center/cover no-repeat`,
                }}
              />
              <div className="p-3">
                <div className="text-ink-mute text-xs uppercase tracking-wide">{p.category}</div>
                <div className="text-ink text-sm mt-1">{p.displayTitle}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-rule pt-8">
        <h2 className="display text-2xl text-ink mb-3">How the rounds work</h2>
        <ol className="list-decimal list-inside text-ink-soft space-y-2 text-base">
          <li>You see the product photo + a redacted title + bullet specs.</li>
          <li>You slide your guess from $5 to $10,000+.</li>
          <li>Reveal: actual price, full title, brand, sometimes a story.</li>
          <li>Your accuracy across the round set is your score.</li>
        </ol>
        <p className="text-ink-mute text-sm mt-6">
          Phase 0.5 MVP — no streaks, no leaderboard yet. {" "}
          See {" "}
          <Link href="/methodology" className="underline">methodology</Link>
          {" "} for how this layers onto the house game architecture.
        </p>
      </section>
    </main>
  );
}
