import type { Metadata } from "next";
import { shuffleDeck } from "@/lib/amazon-products";
import PlayClient from "./PlayClient";

export const metadata: Metadata = {
  title: "Play — Pricetag Amazon",
  description:
    "Play the Pricetag Amazon round. Real weird products. Guess the price.",
  alternates: { canonical: "/amazon/play" },
  openGraph: {
    title: "Play — Pricetag Amazon",
    description: "Real weird products. Guess the price.",
    url: "/amazon/play",
    type: "website",
  },
};

// Cached at the route level — every visitor in a 60s window gets the same
// initial deck order. Reasonable for a Phase 0.5 MVP; later we'll
// session-bind the deck.
export const revalidate = 60;

export default function PlayPage() {
  const deck = shuffleDeck();
  return <PlayClient deck={deck} />;
}
