import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pricetag — Guess the home.",
  description:
    "Real homes. Real prices. How close can you get? A daily real-estate guessing game.",
  openGraph: {
    title: "Pricetag",
    description: "Guess the price of real homes. It's harder than you think.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
