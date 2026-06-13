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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://guesstheprice.ai" },
    { "@type": "ListItem", position: 2, name: "Leaderboard", item: "https://guesstheprice.ai/leaderboard" },
  ],
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
