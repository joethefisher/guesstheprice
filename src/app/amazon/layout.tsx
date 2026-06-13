import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricetag — Amazon edition",
  description:
    "Guess the price of real, weird Amazon products. From gorilla chairs to existential duck lamps. Real listings. Real prices. Honest reactions.",
  alternates: { canonical: "/amazon" },
  openGraph: {
    title: "Pricetag — Amazon edition",
    description:
      "Guess the price of real, weird Amazon products. From gorilla chairs to existential duck lamps.",
    url: "/amazon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricetag — Amazon edition",
    description: "Guess the price of weird real Amazon products.",
  },
};

export default function AmazonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
