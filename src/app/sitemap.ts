import type { MetadataRoute } from "next";
import {
  getAllTargetCities,
  getAllNeighborhoodParams,
  citySlug,
  stateSlug,
  neighborhoodSlug,
} from "@/lib/city-data";

// /sitemap.xml — full map of indexable routes including programmatic city,
// state, and neighborhood pages. Async because the neighborhood list is
// fetched via Prisma (with 24h cache).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://guesstheprice.ai";
  const now = new Date();
  return [
    { url: `${base}/`,             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/play`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/daily`,        lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/leaderboard`,  lastModified: now, changeFrequency: "hourly",  priority: 0.7 },
    // Amazon edition (Phase 0.5 MVP — landing + play)
    { url: `${base}/amazon`,       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/amazon/play`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    // Content pages (Phase 2 — stable evergreen content for long-tail discovery)
    { url: `${base}/about`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/faq`,          lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/methodology`,  lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Cities (Phase 3 — programmatic, generated from data/target-markets.json)
    { url: `${base}/cities`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    // State index pages (one per distinct state in the target list)
    ...Array.from(new Set(getAllTargetCities().map((m) => m.state))).map((state) => ({
      url: `${base}/cities/${stateSlug(state)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
    // Per-city pages
    ...getAllTargetCities().map(({ city, state }) => ({
      url: `${base}/cities/${stateSlug(state)}/${citySlug(city)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // Per-neighborhood pages (only for cities with sufficient coverage)
    ...(await getAllNeighborhoodParams()).map(({ city, state, neighborhood }) => ({
      url: `${base}/cities/${stateSlug(state)}/${citySlug(city)}/neighborhoods/${neighborhoodSlug(neighborhood)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];
}
