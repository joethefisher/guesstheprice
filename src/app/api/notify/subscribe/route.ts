import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Very small: email + optional source tag (so we can tell later where
// each opt-in came from without adding a full analytics event). Actual
// sending is a follow-up — this endpoint just captures intent.
const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  source: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { email, source } = parsed.data;

  try {
    // Upsert so re-subscribing is a no-op and the endpoint stays idempotent.
    // We deliberately don't tell the client whether the email was already
    // subscribed — no enumeration signal, and the UX is the same either way.
    await prisma.notifyWaitlist.upsert({
      where: { email },
      update: {}, // Keep original createdAt + source; don't overwrite on re-sub.
      create: { email, source: source ?? "daily-locked" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify/subscribe] DB error:", err);
    return NextResponse.json(
      { error: "Couldn't save right now — try again in a moment." },
      { status: 500 },
    );
  }
}
