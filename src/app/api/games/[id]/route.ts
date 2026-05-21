import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeGameAggregates } from "@/lib/scoring";

const Body = z.object({
  totalScore: z.number().int().min(0).max(100_000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id } = await params;

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game || game.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Denormalized aggregates: cheaper than re-joining Round + Listing on every
  // profile/leaderboard render. Computed once at completion using whatever
  // rounds the player actually finished.
  const rounds = await prisma.round.findMany({
    where: { gameId: id },
    select: {
      score: true,
      accuracy: true,
      guess: true,
      listing: { select: { soldPrice: true } },
    },
  });
  const aggregates = computeGameAggregates(
    rounds.map((r) => ({
      score: r.score,
      accuracy: r.accuracy,
      guess: r.guess,
      soldPrice: r.listing.soldPrice,
    })),
  );
  const durationMs = Date.now() - game.startedAt.getTime();

  const updated = await prisma.game.update({
    where: { id },
    data: {
      completedAt: new Date(),
      totalScore: parsed.data.totalScore,
      ...aggregates,
      durationMs,
    },
  });

  return NextResponse.json({ id: updated.id, totalScore: updated.totalScore });
}
