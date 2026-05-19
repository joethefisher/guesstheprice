import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreGuess } from "@/lib/scoring";
import { getReaction, getSubReaction } from "@/lib/reactions";

export const dynamic = "force-dynamic";

const GuessSchema = z.object({
  listingId: z.string().min(1),
  guess: z.number().int().min(0).max(1_000_000_000),
  gameId: z.string().optional(),
  roundNumber: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = GuessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { listingId, guess, gameId, roundNumber } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { photos: { orderBy: { ordering: "asc" } } }
  });

  if (!listing) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }

  const result = scoreGuess(guess, listing.soldPrice);
  const reaction = getReaction(result.tier, listingId);
  const subReaction = getSubReaction(result.tier);

  // Persist round for authenticated users with an active game
  if (gameId && roundNumber != null) {
    const session = await auth();
    if (session?.user?.id) {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (game && game.userId === session.user.id && !game.completedAt) {
        await prisma.round.upsert({
          where: { gameId_roundNumber: { gameId, roundNumber } },
          create: { gameId, listingId, roundNumber, guess, score: result.score, guessedAt: new Date() },
          update: { guess, score: result.score, guessedAt: new Date() },
        });
      }
    }
  }

  return NextResponse.json({
    score: result.score,
    tier: result.tier,
    errorPct: result.errorPct,
    errorDollars: result.errorDollars,
    actualPrice: listing.soldPrice,
    streetAddress: listing.streetAddress,
    // Exact coords are only revealed here, post-submit — never in the pre-guess payload.
    exact: listing.latitude != null && listing.longitude != null
      ? { lat: listing.latitude, lng: listing.longitude }
      : null,
    reaction,
    subReaction
  });
}
