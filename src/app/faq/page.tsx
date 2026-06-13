import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Pricetag",
  description:
    "Frequently asked questions about Pricetag: where the listings come from, whether the data is real, how scoring works, mobile play, and account questions.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Pricetag FAQ",
    description:
      "Where the listings come from, how scoring works, and other common questions.",
    url: "/faq",
    type: "website",
  },
};

const faqs = [
  {
    q: "Are the houses real?",
    a: "Yes. Every listing in Pricetag is a real home sourced from public Realtor.com data. Same square footage, same bedroom count, same photos. The address is hidden until you make your guess so the round isn't trivially Google-able.",
  },
  {
    q: "Where does the price come from?",
    a: "The list price as published when the listing was ingested. Some homes have been updated since; the price we score against is the one our ingest captured. We disclose the ingest date on the reveal screen so you know whether you're guessing a fresh listing or a few-months-old one.",
  },
  {
    q: "Why are some markets shown more than others?",
    a: "Our target-markets list is tier-weighted — top metros (NYC, LA, Chicago, Houston) appear more often than secondary cities (Buffalo, Tulsa, Des Moines). That keeps the daily round recognizable for most players while still introducing markets people haven't seen.",
  },
  {
    q: "Can I see my past guesses?",
    a: "Signed-in players have a profile page with daily history, streaks, and the bucket distribution of past rounds. Anonymous play works but doesn't persist past a session.",
  },
  {
    q: "Is it free?",
    a: "Yes. No paywall, no ads. Pricetag is built as a public project, not a commercial product. The hosting and listings ingest costs are absorbed by the author.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes — the game is built mobile-first, with photo carousel + price slider designed for touch. Daily mode is especially mobile-friendly: one round, share the result, done.",
  },
  {
    q: "How do you decide who's at the top of the leaderboard?",
    a: "Two leaderboards. High Scores ranks players by their best single-round accuracy. Streaks ranks by consecutive days of daily play. Both reset never — they're cumulative.",
  },
  {
    q: "Why is the address hidden until I guess?",
    a: "If we showed you the address, you could Google the listing and look up the price in three seconds. The address is the answer; the game is about your real-estate intuition, not your ability to search.",
  },
  {
    q: "Will you add more cities / countries?",
    a: "More US cities, yes — the target-markets list grows as we expand. International markets are not currently planned; Realtor.com's coverage is US-only, and other data sources have their own quirks we'd need to handle separately.",
  },
  {
    q: "I'd guess better if I could see the year sold and the original price",
    a: "Some rounds show the year-sold pill. We deliberately limit how much sale history is visible so the game stays a guessing exercise, not a search exercise.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="display text-4xl text-ink mb-8">FAQ</h1>

      <div className="space-y-8 text-ink text-base leading-relaxed">
        {faqs.map((item) => (
          <section key={item.q}>
            <h2 className="display text-xl text-ink mb-2">{item.q}</h2>
            <p className="text-ink-soft">{item.a}</p>
          </section>
        ))}

        <p className="text-ink-mute text-sm mt-12">
          More on{" "}
          <Link href="/methodology" className="underline">
            data sources and methodology
          </Link>{" "}
          or jump into{" "}
          <Link href="/play" className="underline">
            practice mode
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
