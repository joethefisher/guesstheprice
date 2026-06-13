import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Pricetag",
  description:
    "Pricetag is a house-price guessing game built on real Realtor.com listings. About the project, the data, and the people behind it.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — Pricetag",
    description:
      "Real homes. Real prices. A guessing game built on the open real-estate market.",
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="display text-4xl text-ink mb-8">About Pricetag</h1>

      <div className="space-y-6 text-ink text-base leading-relaxed">
        <p>
          Pricetag is a game about real homes. Every round shows you photos of an
          actual listing — a real address, a real square footage, a real bedroom
          count — and asks the only question that ever matters in real estate:
          how much.
        </p>

        <p>
          The pitch is simple: you think you know how houses are priced. You
          probably don&apos;t, at least not across neighborhoods you haven&apos;t
          shopped in. Pricetag is a small, persistent way to find out where your
          intuition is sharp and where it&apos;s wildly off.
        </p>

        <h2 className="display text-2xl text-ink mt-12 mb-4">Why it exists</h2>
        <p>
          Real estate is the largest asset class most people will ever interact
          with, and the prices are completely opaque until you&apos;ve looked at
          the market in a specific area for months. Other sites show you data;
          Pricetag asks you to calibrate against it. A few rounds in, you start
          noticing what actually moves prices — lot size, year built, what
          counts as a &quot;walkable&quot; neighborhood in different cities.
        </p>

        <h2 className="display text-2xl text-ink mt-12 mb-4">Who built it</h2>
        <p>
          Pricetag is built by{" "}
          <a
            href="https://joeking.ai"
            className="text-accent underline underline-offset-2 hover:text-accent-deep"
          >
            Joe Fisher
          </a>
          , an engineer working in marketing systems at Notion. Same author
          behind F1 Oracle, a Formula 1 betting model. Both are projects in
          public — built honestly, shipped, and iterated on.
        </p>

        <h2 className="display text-2xl text-ink mt-12 mb-4">Get started</h2>
        <p>
          The fastest path is{" "}
          <Link
            href="/daily"
            className="text-accent underline underline-offset-2 hover:text-accent-deep"
          >
            today&apos;s daily round
          </Link>{" "}
          — one house, one guess, scoring tied to a streak you can share. Or
          jump straight into{" "}
          <Link
            href="/play"
            className="text-accent underline underline-offset-2 hover:text-accent-deep"
          >
            practice mode
          </Link>{" "}
          if you want to grind on as many homes as you can.
        </p>

        <p className="text-ink-mute text-sm mt-12">
          More on{" "}
          <Link href="/how-it-works" className="underline">
            how the game works
          </Link>{" "}
          ·{" "}
          <Link href="/methodology" className="underline">
            data + methodology
          </Link>{" "}
          ·{" "}
          <Link href="/faq" className="underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
