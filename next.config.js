// @ts-check
const { withSentryConfig } = require("@sentry/nextjs");

// Requests asking for markdown (see rewrites below). Case-insensitive,
// as media types are.
/** @type {import('next/dist/lib/load-custom-routes').RouteHas[]} */
const acceptsMarkdown = ([
  { type: "header", key: "accept", value: ".*[Tt][Ee][Xx][Tt]/[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" },
]);

// Content pages that have a markdown representation: [source, its path].
const MARKDOWN_PAGES = [
  ["/", "/"],
  ["/:page(about|how-it-works|methodology|faq)", "/:page"],
  ["/cities", "/cities"],
  ["/cities/:path+", "/cities/:path+"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow-list only known sources so the /_next/image proxy can't be turned
    // into an open SSRF / DoS amplifier. Photos come from photos.guesstheprice.ai
    // (R2 mirror) once the backfill completes. Until then, the **.rdcpix.com
    // entries cover Realtor.com's CDN (ap/nh subdomains observed). Landing
    // hero falls back to Unsplash.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.rdcpix.com" },
      { protocol: "https", hostname: "photos.guesstheprice.ai" },
    ],
  },
  async rewrites() {
    // Markdown for Agents: content negotiation on content pages. Requests
    // that ask for text/markdown are served by /md/<path> (HTML converted
    // to markdown); everyone else gets the normal HTML page. `beforeFiles`
    // so the rewrite wins over the page routes themselves. The path
    // allow-list is enforced again inside the route (src/lib/agent-markdown.ts).
    // An explicit `q=0` refusal is re-checked in the route, which then
    // passes the HTML through.
    return {
      beforeFiles: MARKDOWN_PAGES.map(([source, path]) => ({
        source,
        has: acceptsMarkdown,
        destination: path === "/" ? "/md" : `/md${path}`,
      })),
    };
  },
  async headers() {
    // Baseline security headers Vercel doesn't set by default. CSP is
    // intentionally left out for now — needs nonce wiring + a per-page
    // allow-list, tracked separately.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Self-hosted latin-ext font files (public/fonts, loaded on demand
      // by globals.css). Not content-hashed: rename a file if it changes.
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // (No `Vary: Accept` on the HTML pages: Next overwrites Vary on
      // page responses, and Vercel's CDN keys on Accept regardless.)
      //
      // RFC 8288 Link headers for agent discovery on the same content
      // pages the markdown rewrites cover: each page advertises its own
      // markdown representation (same URL, Accept: text/markdown) and the
      // sitemap. Only point at resources that actually exist. Skipped on
      // markdown responses, which send their own canonical Link.
      ...MARKDOWN_PAGES.map(([source, path]) => ({
        source,
        missing: acceptsMarkdown,
        headers: [
          {
            key: "Link",
            value: `<${path}>; rel="alternate"; type="text/markdown", </sitemap.xml>; rel="sitemap"; type="application/xml"`,
          },
        ],
      })),
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  hideSourceMaps: true,
});
