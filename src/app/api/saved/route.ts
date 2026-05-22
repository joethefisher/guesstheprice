import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_SAVES_PER_USER = 500;

const TIER_ENUM = z.enum(["expert", "nailed", "solid", "ballpark", "off", "yikes"]);

const PostBody = z.object({
  listingId: z.string().min(1),
  // Pre-reveal saves omit these. Reveal-upgrade saves send guess + tier + accuracy.
  guess: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  tier: TIER_ENUM.nullable().optional(),
  accuracy: z.number().min(0).max(100).nullable().optional(),
});

/**
 * GET /api/saved — list current user's saved homes.
 *
 * SECURITY: userId is read from session only. Query is scoped to (userId,
 * isActive listings). Returns the shape the client SavedHome type expects.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.savedHome.findMany({
    where: { userId: session.user.id, listing: { isActive: true } },
    include: {
      listing: {
        select: {
          neighborhood: true,
          city: true,
          state: true,
          photos: {
            take: 1,
            orderBy: { ordering: "asc" },
            select: { url: true },
          },
        },
      },
    },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json(
    rows.map((r) => ({
      listingId: r.listingId,
      neighborhood: r.listing.neighborhood,
      city: r.listing.city,
      state: r.listing.state,
      photoUrl: r.listing.photos[0]?.url ?? "",
      guess: r.guess,
      actualPrice: r.actualPrice,
      tier: r.tier,
      accuracy: r.accuracy,
      savedAt: r.savedAt.getTime(),
    }))
  );
}

/**
 * POST /api/saved — add (or reveal-upgrade) a saved home for the current user.
 *
 * SECURITY:
 * - userId comes from session.
 * - actualPrice is derived from Listing.soldPrice (server-side), never trusted from body.
 * - Per-user cap of 500 saves enforced before insert (skipped when this is an
 *   upgrade to an existing row).
 * - FK on listingId catches non-existent listings.
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

  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { listingId, guess, tier, accuracy } = parsed.data;

  // Look up listing for soldPrice (and to fast-fail on a bad id without the
  // generic FK 400 below).
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, isActive: true, soldPrice: true },
  });
  if (!listing || !listing.isActive) {
    return NextResponse.json({ error: "listing not found" }, { status: 400 });
  }

  const existing = await prisma.savedHome.findUnique({
    where: { userId_listingId: { userId, listingId } },
    select: { id: true },
  });

  if (!existing) {
    const count = await prisma.savedHome.count({ where: { userId } });
    if (count >= MAX_SAVES_PER_USER) {
      return NextResponse.json(
        { error: "save limit reached", limit: MAX_SAVES_PER_USER },
        { status: 400 }
      );
    }
  }

  // Score fields only get written when this is a reveal-upgrade (guess != null).
  // A subsequent pre-reveal click on an existing saved row must not clobber the
  // user's actual score data with nulls.
  const hasScore = guess != null;
  const scoreData = hasScore
    ? {
        guess,
        tier: tier ?? null,
        accuracy: accuracy ?? null,
        actualPrice: listing.soldPrice,
      }
    : null;

  try {
    await prisma.savedHome.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: {
        userId,
        listingId,
        ...(scoreData ?? {}),
      },
      update: scoreData ?? {},
    });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2003") {
      return NextResponse.json({ error: "listing not found" }, { status: 400 });
    }
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
