import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_SAVES_PER_USER = 500;

const TIER_ENUM = z.enum(["expert", "nailed", "solid", "ballpark", "off", "yikes"]);

const MigrateBody = z.object({
  items: z
    .array(
      z.object({
        listingId: z.string().min(1),
        guess: z.number().int().min(0).max(1_000_000_000).nullable(),
        tier: TIER_ENUM.nullable(),
        accuracy: z.number().min(0).max(100).nullable(),
        savedAt: z.number().int().positive(),
      })
    )
    .max(500),
});

/**
 * POST /api/saved/migrate — one-time batch migration of localStorage saves
 * to the server after a user signs in.
 *
 * SECURITY:
 * - userId comes from session.
 * - All upserts scoped to (userId, listingId).
 * - actualPrice derived from Listing.soldPrice; never trusted from body.
 * - Per-user cap enforced; extras are skipped (not errored — clients with
 *   localStorage bloat shouldn't break their sign-in).
 * - Items with non-existent or inactive listingIds are silently skipped so
 *   one stale local entry doesn't fail the whole batch.
 * - Idempotent: re-running with the same items is a no-op (upsert preserves
 *   existing rows).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = MigrateBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const items = parsed.data.items;
  if (items.length === 0) {
    return NextResponse.json({ migrated: 0, skipped: 0 });
  }

  // Pre-fetch existing saved listingIds + the listings referenced so we can
  // skip cap-overflow, duplicate, and missing-listing items in a single pass.
  const [count, existing, listings] = await Promise.all([
    prisma.savedHome.count({ where: { userId } }),
    prisma.savedHome.findMany({
      where: { userId, listingId: { in: items.map((i) => i.listingId) } },
      select: { listingId: true },
    }),
    prisma.listing.findMany({
      where: { id: { in: items.map((i) => i.listingId) }, isActive: true },
      select: { id: true, soldPrice: true },
    }),
  ]);

  const existingSet = new Set(existing.map((e) => e.listingId));
  const listingMap = new Map(listings.map((l) => [l.id, l.soldPrice]));

  let available = Math.max(0, MAX_SAVES_PER_USER - count);
  let migrated = 0;
  let skipped = 0;

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  for (const item of items) {
    if (existingSet.has(item.listingId)) {
      // Idempotent: client thinks this is missing, server already has it.
      skipped++;
      continue;
    }
    if (!listingMap.has(item.listingId)) {
      // Deleted/inactive listing — drop silently.
      skipped++;
      continue;
    }
    if (available <= 0) {
      skipped++;
      continue;
    }
    available--;
    migrated++;
    const hasScore = item.guess != null;
    ops.push(
      prisma.savedHome.create({
        data: {
          userId,
          listingId: item.listingId,
          guess: hasScore ? item.guess : null,
          tier: hasScore ? item.tier : null,
          accuracy: hasScore ? item.accuracy : null,
          actualPrice: hasScore ? listingMap.get(item.listingId)! : null,
          savedAt: new Date(item.savedAt),
        },
      })
    );
  }

  if (ops.length > 0) {
    try {
      await prisma.$transaction(ops);
    } catch {
      return NextResponse.json({ error: "migration failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ migrated, skipped });
}
