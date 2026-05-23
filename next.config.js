// @ts-check
const { withSentryConfig } = require("@sentry/nextjs");

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
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  hideSourceMaps: true,
});
