import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { Footer } from "@/components/Footer";

// Viewport-level PWA hints. theme-color drives the address-bar tint on
// mobile (Chrome / Safari); paired with manifest.ts which declares the
// PWA shell. Pricetag is mobile-first; Daily mode pairs perfectly with
// Add-to-Home-Screen.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  // viewportFit=cover lets env(safe-area-inset-*) report real notch /
  // home-indicator insets on iPhones. Without this the insets return 0
  // and pinned top/bottom bars disappear behind the notch or home bar.
  viewportFit: "cover",
  // Don't lock maximum-scale — WCAG 2.2 1.4.4 requires users can zoom.
  // iOS field-focus zoom is suppressed via input font-size:16px (globals.css).
};

// Fonts are self-hosted (src/app/fonts/, latin subset, SIL OFL 1.1;
// Fraunces latin-ext lives in public/fonts/, declared in globals.css)
// rather than loaded via next/font/google: the Google variant downloads
// the files from fonts.gstatic.com on every build, and a flaky fetch
// there failed a production deploy (58d431b, 2026-11-15). Same files
// Google serves — Fraunces is a variable font carrying the opsz / SOFT /
// WONK axes; JetBrains Mono is a variable-weight file (400–800), declared 400–500
// to keep today's rendering (bold is synthesized from 500).
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/fraunces-italic-latin.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
  // next/font/local would size the fallback from the file's default
  // instance (weight 900), ~10% wider than Google's Regular-based
  // metrics. Keep Google's exact values instead: "Fraunces Fallback"
  // is declared in globals.css.
  adjustFontFallback: false,
  fallback: ["Fraunces Ext", "Fraunces Fallback"],
});

const jetbrainsMono = localFont({
  src: [{ path: "./fonts/jetbrains-mono-latin.woff2", weight: "400 500", style: "normal" }],
  variable: "--font-mono",
  display: "swap",
  // No metric-adjusted Arial stand-in: the Tailwind stack falls back to
  // ui-monospace / SF Mono, a closer match for a monospace face.
  adjustFontFallback: false,
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
          {/* Vercel Analytics — page views, referrers, country/browser.
              Zero-config on Vercel deploys (it auto-detects the project).
              Custom events via `track()` from "@vercel/analytics". */}
          <Analytics />
          {/* Speed Insights — Core Web Vitals (LCP, INP, CLS) measured
              from real user devices in the field. Vercel dashboard. */}
          <SpeedInsights />
        </body>
    </html>
  );
}
