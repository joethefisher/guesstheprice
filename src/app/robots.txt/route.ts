// /robots.txt — tells crawlers what to index and where to find the sitemap.
// Auth/profile/saved are user-private; the API surface isn't user-facing content.
//
// Served as a route handler (not app/robots.ts) because Next's
// MetadataRoute.Robots type has no field for Content-Signal directives.
// Content signals (https://contentsignals.org/) declare how the content may be
// used once accessed: classic search and real-time AI answers (with citation)
// are welcome; model training is not — listings derive from Realtor.com data.

export const dynamic = "force-static";

const ROBOTS_TXT = `# Content signals: search=yes (indexing and search results),
# ai-input=yes (use as real-time input to AI answers), ai-train=no (no model
# training or fine-tuning). See https://contentsignals.org/
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /profile
Disallow: /saved
Disallow: /md/

Host: https://guesstheprice.ai
Sitemap: https://guesstheprice.ai/sitemap.xml
`;

export function GET() {
  return new Response(ROBOTS_TXT, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
