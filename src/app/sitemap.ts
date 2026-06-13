import type { MetadataRoute } from "next";
import { getAllTargetCities, citySlug, stateSlug } from "@/lib/city-data";

// /sitemap.xml — full map of indexable routes including programmatic city
// pages. Static base + every target city. Sitemap regenerates when adjacent
// pages revalidate or on each deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://guesstheprice.ai";
  const now = new Date();
  return [
    { url: `${base}/`,             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/play`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/daily`,        lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/leaderboard`,  lastModified: now, changeFrequency: "hourly",  priority: 0.7 },
    // Content pages (Phase 2 — stable evergreen content for long-tail discovery)
    { url: `${base}/about`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/faq`,          lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/methodology`,  lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Cities (Phase 3 — programmatic, generated from data/target-markets.json)
    { url: `${base}/cities`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    ...getAllTargetCities().map(({ city, state }) => ({
      url: `${base}/cities/${stateSlug(state)}/${citySlug(city)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
