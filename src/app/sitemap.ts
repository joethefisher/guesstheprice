import type { MetadataRoute } from "next";

// /sitemap.xml — static map of the public, indexable routes.
//
// When programmatic city pages land (Phase 3 of the SEO audit), this file
// will be extended to read from prisma.listing or data/target-markets.json
// and emit one entry per city. For now it covers the canonical user-facing
// routes that don't change shape.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://guesstheprice.ai";
  const now = new Date();
  return [
    { url: `${base}/`,            lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: `${base}/play`,        lastModified: now, changeFrequency: "daily",  priority: 0.9 },
    { url: `${base}/daily`,       lastModified: now, changeFrequency: "daily",  priority: 0.9 },
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
  ];
}
