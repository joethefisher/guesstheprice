import type { Metadata } from "next";

// The daily route's page.tsx is a client component (useEffect, useState,
// motion). Client components can't export metadata, so we put it here in
// a server-component layout. The canonical and OG live across the whole
// /daily subtree.
export const metadata: Metadata = {
  title: "Daily — Pricetag",
  description:
    "Today's daily Pricetag round. One house, one guess. Build a streak across days.",
  alternates: { canonical: "/daily" },
  openGraph: {
    title: "Daily round — Pricetag",
    description: "One house, one guess, one streak. Pricetag's daily mode.",
    url: "/daily",
    type: "website",
  },
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
