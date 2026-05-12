import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Called weekly by Vercel cron (see vercel.json). Protected by CRON_SECRET header.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.session.deleteMany({
    where: { expires: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result.count });
}
