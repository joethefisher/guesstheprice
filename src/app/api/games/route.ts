import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({
  sessionId: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const session = await auth();

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const game = await prisma.game.create({
    data: {
      sessionId: parsed.data.sessionId,
      userId: session?.user?.id ?? null,
      gameType: "freeplay",
      totalRounds: 5,
    },
  });

  return NextResponse.json({ id: game.id });
}
