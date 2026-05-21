import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const passwordHash = await hash(password, 12);

  try {
    await prisma.user.create({ data: { username, passwordHash } });
  } catch (e: unknown) {
    // P2002 = unique constraint violation — username already taken.
    // Returning a username-specific 409 here lets a script enumerate which
    // usernames exist, but the same set is already exposed publicly on
    // /api/leaderboard — usernames are public-by-design. The UX win
    // (telling the user exactly why signup failed) is worth keeping.
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Username taken" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
