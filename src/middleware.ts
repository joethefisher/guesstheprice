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

const limiterScore = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:score" })
  : null;

const limiterListings = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "rl:listings" })
  : null;

// Batch counts as 5 listings — same quota as /api/score (20 req/60s)
const limiterBatch = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:batch" })
  : null;

// Auth: tight limits — bcrypt is CPU-heavy, so even a few parallel calls can pin a Lambda
const limiterLogin = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "rl:login" })
  : null;

const limiterSignup = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "60 m"), prefix: "rl:signup" })
  : null;

export const config = {
  matcher: [
    "/api/score",
    "/api/listings",
    "/api/listings/batch",
    "/api/auth/signup",
    "/api/auth/[...nextauth]",
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
