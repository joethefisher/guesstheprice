import type { Metadata } from "next";

// The leaderboard route's page.tsx is a client component. Metadata goes here
// so the leaderboard URL ships canonical + OG correctly.
export const metadata: Metadata = {
  title: "Leaderboard — Pricetag",
  description:
    "Top scores and longest streaks on Pricetag. See who's calibrated their housing-price intuition the best.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Pricetag Leaderboard",
    description: "Top scores and longest streaks across the player base.",
    url: "/leaderboard",
    type: "website",
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
