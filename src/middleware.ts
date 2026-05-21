import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

const RL_ENABLED = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = RL_ENABLED
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Per-route sliding-window quotas. Tune these here — anything else is downstream.
 *
 * - score / listings / batch: tight enough to block scrapers, loose enough
 *   for a real game session (≤5 rounds in flight + photo prefetch).
 * - login / signup: very tight because bcrypt is CPU-heavy on Vercel
 *   Functions; a handful of parallel attempts can pin a Lambda.
 */
const RATE_LIMITS = {
  score:    { count: 20, window: "60 s" as const },
  listings: { count: 60, window: "60 s" as const },
  batch:    { count: 20, window: "60 s" as const },
  login:    { count: 5,  window: "10 m" as const },
  signup:   { count: 3,  window: "60 m" as const },
};

function makeLimiter(name: keyof typeof RATE_LIMITS) {
  if (!redis) return null;
  const cfg = RATE_LIMITS[name];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.count, cfg.window),
    prefix: `rl:${name}`,
  });
}

const limiterScore = makeLimiter("score");
const limiterListings = makeLimiter("listings");
const limiterBatch = makeLimiter("batch");
const limiterLogin = makeLimiter("login");
const limiterSignup = makeLimiter("signup");

export const config = {
  matcher: [
    "/api/score",
    "/api/listings",
    "/api/listings/batch",
    "/api/auth/signup",
    // Use the path-to-regexp `:path*` syntax so all NextAuth subpaths
    // (callback/credentials, session, csrf, signout, etc.) fire the
    // login limiter. The previous `[...nextauth]` syntax is file-system
    // routing, not path-to-regexp — it matched no URLs and the
    // bcrypt-heavy login rate limit was silently a no-op.
    "/api/auth/:path*",
  ],
};

/**
 * Extract the client IP for rate-limit bucketing.
 *
 * SECURITY NOTE: `x-forwarded-for` is set by upstream proxies. On Vercel the
 * edge layer overwrites this header with the verified client IP before the
 * function runs, so we can trust the first entry. On any other host (bare
 * metal, custom proxy, local dev), `x-forwarded-for` can be spoofed by the
 * client — set `RATE_LIMIT_TRUST_FORWARDED=0` to fall back to a single
 * "anonymous" bucket (which trades per-IP fidelity for safety).
 */
function clientIp(req: NextRequest): string {
  const trustForwarded = process.env.RATE_LIMIT_TRUST_FORWARDED !== "0";
  if (!trustForwarded) return "anonymous";
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export async function middleware(req: NextRequest) {
  const ip = clientIp(req);
  const path = req.nextUrl.pathname;

  // Auth routes always rate-limited when Redis is available
  if (path === "/api/auth/signup") {
    if (!limiterSignup) return NextResponse.next();
    const { success } = await limiterSignup.limit(ip);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    return NextResponse.next();
  }

  if (path.startsWith("/api/auth/")) {
    if (!limiterLogin) return NextResponse.next();
    const { success } = await limiterLogin.limit(ip);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    return NextResponse.next();
  }

  // Game routes
  if (!limiterScore || !limiterListings || !limiterBatch) return NextResponse.next();

  const limiter =
    path === "/api/score" ? limiterScore :
    path === "/api/listings/batch" ? limiterBatch :
    limiterListings;

  const { success } = await limiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  return NextResponse.next();
}
