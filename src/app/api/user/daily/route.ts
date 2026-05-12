import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ProgressBody = z.object({
  lastPlayedDateET: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  lastResult: z.record(z.unknown()).nullable().optional(),
  currentStreak: z.number().int().min(0).max(9999),
  bestStreak: z.number().int().min(0).max(9999),
  played: z.number().int().min(0).max(99999),
  history: z.array(z.number().nullable()).max(200),
  distribution: z.record(z.number().int().min(0)).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await prisma.userDailyProgress.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(progress ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ProgressBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const body = parsed.data;

  // Anti-rollback: prevent clients from sending lower played/bestStreak than what's on record
  const existing = await prisma.userDailyProgress.findUnique({
    where: { userId: session.user.id },
    select: { played: true, bestStreak: true },
  });
  if (existing) {
    if (body.played < existing.played) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    if (body.bestStreak < existing.bestStreak) {
      body.bestStreak = existing.bestStreak;
    }
  }

  const safeHistory = body.history.slice(-35);
  // Prisma requires Prisma.JsonNull for nullable JSON columns — plain null is rejected
  const lastResult: Prisma.InputJsonValue | typeof Prisma.JsonNull =
    body.lastResult != null ? (body.lastResult as Prisma.InputJsonValue) : Prisma.JsonNull;

  const progress = await prisma.userDailyProgress.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body, history: safeHistory, lastResult },
    update: { ...body, history: safeHistory, lastResult },
  });
  return NextResponse.json(progress);
}
