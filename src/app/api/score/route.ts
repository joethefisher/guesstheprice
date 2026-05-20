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

  // Materialised 0..1 accuracy stored on the Round so aggregates don't have
  // to recompute + join Listing on every read. Clamped so wild guesses can't
  // make AVG() go negative.
  const accuracy = listing.soldPrice > 0
    ? Math.max(0, 1 - Math.abs(guess - listing.soldPrice) / listing.soldPrice)
    : 0;

  // Persist round for any active game — anonymous or signed-in.
  // Anonymous rounds power the landing "around the world" aggregate; signed-in
  // rounds additionally feed the leaderboard. Authorization: if the game has
  // a userId, the request must come from that user; if the game is anonymous
  // (userId null), the unguessable gameId acts as the bearer.
  if (gameId && roundNumber != null) {
    const session = await auth();
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (game && !game.completedAt) {
      const authorized =
        game.userId === null
          ? true
          : session?.user?.id === game.userId;
      if (authorized) {
        await prisma.round.upsert({
          where: { gameId_roundNumber: { gameId, roundNumber } },
          create: { gameId, listingId, roundNumber, guess, score: result.score, accuracy, guessedAt: new Date() },
          update: { guess, score: result.score, accuracy, guessedAt: new Date() },
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
