import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({
  totalScore: z.number().int().min(0).max(100_000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: params.id } });
  if (!game || game.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.game.update({
    where: { id: params.id },
    data: { completedAt: new Date(), totalScore: parsed.data.totalScore },
  });

  return NextResponse.json({ id: updated.id, totalScore: updated.totalScore });
}
