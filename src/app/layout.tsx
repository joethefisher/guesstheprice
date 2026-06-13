import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Footer } from "@/components/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://guesstheprice.ai"),
  title: "Guess the Housing Price!",
  description:
    "Real homes. Real prices. How close can you get? A real-estate guessing game.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Guess the Housing Price!",
    description: "Guess the price of real homes. It's harder than you think.",
    type: "website",
    url: "/",
    siteName: "Pricetag",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Guess the Housing Price!" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Housing Price!",
    description: "Guess the price of real homes. It's harder than you think.",
  },
};

// schema.org WebSite — Google uses this for sitelinks search box eligibility
// and brand-name disambiguation. Lives in the root layout so every page ships
// it. Search-action target points at /play because there is no /search route;
// pointing at a 404 would be worse than no SearchAction at all.
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pricetag",
  alternateName: "Guess the Housing Price",
  url: "https://guesstheprice.ai",
  description:
    "Real homes. Real prices. How close can you get? A real-estate price guessing game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* General Sans via Fontshare — not available in next/font/google */}
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
          <Providers>
            {children}
            <Footer />
          </Providers>
        </body>
    </html>
  );
}
