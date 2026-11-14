import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from the daily notification list.
 *
 * GET  — the human clicks the "Unsubscribe" link in the email footer.
 *        Returns a small branded HTML confirmation page.
 * POST — RFC 8058 List-Unsubscribe-Post one-click (Gmail/Apple native
 *        "Unsubscribe" button). Returns 200 with no body.
 *
 * Both look up the subscriber by their stable `unsubToken` and delete
 * the row (clean removal; no "unsubscribed" tombstone to leak later).
 * Unknown/!matched tokens still return success — we never reveal whether
 * a token was valid (no enumeration signal).
 */

async function unsubscribe(token: string | null): Promise<void> {
  if (!token) return;
  // deleteMany (not delete) so a non-matching token is a no-op, not a throw.
  await prisma.notifyWaitlist.deleteMany({ where: { unsubToken: token } });
}

export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  await unsubscribe(token);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  await unsubscribe(token);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed · Pricetag</title>
<style>
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:#F7F4EE; color:#1A1A1A;
         font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; padding:24px; }
  .card { max-width:420px; text-align:center; }
  .mark { font-family:Georgia,serif; font-style:italic; font-weight:600; font-size:20px; margin-bottom:24px; }
  h1 { font-family:Georgia,serif; font-style:italic; font-weight:500; font-size:30px; line-height:1.1; margin:0 0 12px; }
  p { font-size:16px; line-height:1.55; color:#3a3832; margin:0 0 24px; }
  a { display:inline-block; padding:13px 24px; border-radius:14px; background:#FF5C39; color:#fff;
      text-decoration:none; font-weight:600; font-size:15px; }
</style>
</head>
<body>
  <div class="card">
    <div class="mark">Pricetag</div>
    <h1>You're unsubscribed.</h1>
    <p>You won't get any more daily notifications. Changed your mind? You can rejoin anytime from the daily game.</p>
    <a href="https://guesstheprice.ai/daily">Back to the daily &rarr;</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
