import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDailyNumber } from "@/lib/daily/service";
import { isResendConfigured, sendDailyNotifications, sendTestNotification } from "@/lib/email/resend";

// Prisma needs the Node runtime (not edge). force-dynamic so it's never
// statically optimised — it must run on every cron invocation.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily notification cron.
 *
 * Triggered by Vercel Cron (see vercel.json) at ~8-9am ET. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is
 * set in the project env.
 *
 * Query params (all require auth):
 *   ?dryRun=1              compute the recipient list, send nothing.
 *   ?testEmail=you@x.com   send ONE test email to that address, bypassing
 *                          the waitlist + delivery ledger.
 *
 * Idempotency: a (email, dailyNumber) row in NotifyDelivery marks a
 * successful send. Re-running only picks up subscribers not yet notified
 * for today's dailyNumber — so re-runs after a partial failure are safe,
 * and subscribers who join mid-day still get today's email.
 */
export async function GET(req: NextRequest) {
  // ─── Auth ──────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const testEmail = url.searchParams.get("testEmail");
  const dailyNumber = getDailyNumber();

  // ─── Provisioning gate ─────────────────────────────────────────────
  // No RESEND_API_KEY → safe no-op. Nothing sends until the operator
  // provisions Resend. dryRun is still allowed (it computes, doesn't send).
  if (!isResendConfigured() && !dryRun) {
    return NextResponse.json({
      skipped: "RESEND_API_KEY not set — notification sender is not provisioned yet",
      dailyNumber,
    });
  }

  // ─── Test send ─────────────────────────────────────────────────────
  if (testEmail) {
    try {
      await sendTestNotification(testEmail, dailyNumber);
      return NextResponse.json({ ok: true, mode: "test", sentTo: testEmail, dailyNumber });
    } catch (err) {
      return NextResponse.json(
        { error: `test send failed: ${(err as Error).message}`, dailyNumber },
        { status: 502 },
      );
    }
  }

  // ─── Compute recipients (waitlist minus already-delivered-today) ───
  const [waitlist, delivered] = await Promise.all([
    prisma.notifyWaitlist.findMany({ select: { email: true, unsubToken: true } }),
    prisma.notifyDelivery.findMany({ where: { dailyNumber }, select: { email: true } }),
  ]);
  const deliveredSet = new Set(delivered.map((d) => d.email));
  const recipients = waitlist.filter((w) => !deliveredSet.has(w.email));

  if (dryRun) {
    return NextResponse.json({
      mode: "dryRun",
      dailyNumber,
      totalWaitlist: waitlist.length,
      alreadyDelivered: deliveredSet.size,
      wouldSend: recipients.length,
      sample: recipients.slice(0, 5).map((r) => r.email),
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, dailyNumber, sent: 0, note: "nobody new to notify" });
  }

  // ─── Send ──────────────────────────────────────────────────────────
  const result = await sendDailyNotifications(recipients, dailyNumber);

  // Record deliveries for the ones that sent. skipDuplicates guards
  // against a race if two cron invocations overlap.
  if (result.sentEmails.length > 0) {
    await prisma.notifyDelivery.createMany({
      data: result.sentEmails.map((email) => ({ email, dailyNumber })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    ok: true,
    dailyNumber,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors.slice(0, 10),
  });
}
