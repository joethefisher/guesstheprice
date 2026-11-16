import { PrismaClient } from "@prisma/client";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * During `next build`, cap each process's connection pool.
 *
 * The build prerenders hundreds of city/neighborhood pages across many
 * worker processes, each with its own Prisma pool. With no
 * `connection_limit` in DATABASE_URL, Prisma sizes each pool at
 * 2 × CPUs + 1 — 37 on an 18-core laptop, times ~17 workers — which blew
 * through the Supabase pooler's 200-client cap (EMAXCONN) on a local
 * build and starved the live site. Two connections per worker keeps a
 * local build to a few dozen clients; pool_timeout is raised because
 * concurrent prerenders now queue for a connection instead of opening
 * new ones. Runtime (Vercel functions) is unaffected.
 *
 * Next sets NEXT_PHASE before spawning its build workers, so they all
 * inherit it. An explicit connection_limit in the URL always wins.
 */
export const BUILD_CONNECTION_LIMIT = 2;
export const BUILD_POOL_TIMEOUT_S = 60;

export function buildTimeDatabaseUrl(
  url: string | undefined,
  phase: string | undefined,
): string | undefined {
  if (phase !== PHASE_PRODUCTION_BUILD || !url) return undefined;
  if (!/^postgres(ql)?:\/\//.test(url)) return undefined;
  const u = new URL(url);
  if (u.searchParams.has("connection_limit")) return undefined;
  u.searchParams.set("connection_limit", String(BUILD_CONNECTION_LIMIT));
  if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", String(BUILD_POOL_TIMEOUT_S));
  return u.toString();
}

function createClient() {
  const buildUrl = buildTimeDatabaseUrl(process.env.DATABASE_URL, process.env.NEXT_PHASE);
  return new PrismaClient({
    log: ["error"],
    ...(buildUrl ? { datasources: { db: { url: buildUrl } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Cache in all environments — prevents multiple client instances in the same Lambda container
globalForPrisma.prisma = prisma;
