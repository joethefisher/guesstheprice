import type { MetadataRoute } from "next";

// /robots.txt — tells crawlers what to index and where to find the sitemap.
// Auth/profile/saved are user-private; the API surface isn't user-facing content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/profile", "/saved"],
    },
    sitemap: "https://guesstheprice.ai/sitemap.xml",
    host: "https://guesstheprice.ai",
  };
}
