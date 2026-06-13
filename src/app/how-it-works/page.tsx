import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works — Pricetag",
  description:
    "How to play Pricetag: round structure, scoring, accuracy buckets, daily streak, and the difference between Daily and Practice modes.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How Pricetag works",
    description:
      "Round structure, scoring, accuracy buckets, and what makes a good guess.",
    url: "/how-it-works",
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="display text-4xl text-ink mb-8">How it works</h1>

      <div className="space-y-8 text-ink text-base leading-relaxed">
        <section>
          <h2 className="display text-2xl text-ink mb-3">The round</h2>
          <p>
            You see photos of a real house plus its public facts: beds, baths,
            square footage, year built, lot size, and the neighborhood + city +
            state. What you do NOT see is the address or the price. Your job
            is to slide a guess between the floor and ceiling on the price
            slider and submit.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Scoring</h2>
          <p>
            We compare your guess to the actual list price and score it as an
            accuracy percentage. The closer you are, the higher your score.
            Accuracy gets bucketed into bands you&apos;ll see across leaderboards
            and shareable results:
          </p>
          <ul className="list-disc list-inside ml-2 mt-3 space-y-1 text-ink-soft">
            <li>
              <strong>90%+</strong> — bullseye. You&apos;ve seen this market.
            </li>
            <li>
              <strong>80–89%</strong> — strong. Right neighborhood, slightly off
              on a detail.
            </li>
            <li>
              <strong>70–79%</strong> — decent. You&apos;d be in the right
              ballpark on a buyer call.
            </li>
            <li>
              <strong>60–69%</strong> — getting warmer.
            </li>
            <li>
              <strong>50–59%</strong> — coin-flip territory.
            </li>
            <li>
              <strong>Under 50%</strong> — your model needs an update.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Daily vs. Practice</h2>
          <p>
            <strong>Daily mode</strong> gives every player the same house at
            midnight UTC. Your score and the bucket you landed in go into a
            global leaderboard, and consecutive days of play build a streak you
            can share with the day-by-day emoji grid.
          </p>
          <p className="mt-3">
            <strong>Practice mode</strong> is unlimited rounds with no
            streak pressure. Useful for warming up before the daily round or
            just for grinding accuracy across more markets.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Streaks</h2>
          <p>
            Play the daily round on consecutive days to build a streak. Miss a
            day and the streak resets. Streaks show up on your profile, the
            leaderboard&apos;s Streaks tab, and on shareable daily results.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-ink mb-3">Save the homes you liked</h2>
          <p>
            Signed-in players can save any house they played to their saved
            list. Useful when you find a property you&apos;d genuinely want to
            see or share with someone.
          </p>
        </section>

        <p className="text-ink-mute text-sm mt-12">
          Ready?{" "}
          <Link
            href="/daily"
            className="text-accent underline underline-offset-2 hover:text-accent-deep"
          >
            Play today&apos;s round
          </Link>{" "}
          or jump into{" "}
          <Link
            href="/play"
            className="text-accent underline underline-offset-2 hover:text-accent-deep"
          >
            practice mode
          </Link>
          . More on{" "}
          <Link href="/methodology" className="underline">
            how the listings are sourced
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
