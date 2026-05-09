import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { scoreGuess } from "@/lib/scoring";
import { getReaction, getSubReaction } from "@/lib/reactions";

export const dynamic = "force-dynamic";

const GuessSchema = z.object({
  listingId: z.string().min(1),
  guess: z.number().int().min(0).max(1_000_000_000),
  gameId: z.string().optional(),
  roundNumber: z.number().int().min(1).max(50).optional()
});

/**
 * POST /api/score
 * Body: { listingId, guess, gameId?, roundNumber? }
 *
 * Validates, scores, optionally records the round, and returns the reveal.
 */
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

  // Optionally record the round
  if (gameId && roundNumber) {
    try {
      await prisma.round.upsert({
        where: { id: `${gameId}-${roundNumber}` },
        update: { guess, score: result.score, guessedAt: new Date() },
        create: {
          id: `${gameId}-${roundNumber}`,
          gameId,
          listingId,
          roundNumber,
          guess,
          score: result.score,
          guessedAt: new Date()
        }
      });
    } catch (err) {
      // Non-fatal — game can continue without persistence
      console.error("round record failed", err);
    }
  }

  return NextResponse.json({
    score: result.score,
    tier: result.tier,
    errorPct: result.errorPct,
    errorDollars: result.errorDollars,
    actualPrice: listing.soldPrice,
    streetAddress: listing.streetAddress,
    reaction,
    subReaction
  });
}
