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

export const config = { matcher: ["/api/score", "/api/listings", "/api/listings/batch"] };

export async function middleware(req: NextRequest) {
  if (!limiterScore || !limiterListings || !limiterBatch) return NextResponse.next();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anonymous";
  const path = req.nextUrl.pathname;
  const limiter =
    path === "/api/score" ? limiterScore :
    path === "/api/listings/batch" ? limiterBatch :
    limiterListings;

  const { success } = await limiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  return NextResponse.next();
}
