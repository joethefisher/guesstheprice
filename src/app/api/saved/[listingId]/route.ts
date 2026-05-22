import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/saved/[listingId] — remove a saved home for the current user.
 *
 * SECURITY: scoped to (userId, listingId) via deleteMany so a row owned by
 * another user can never be deleted. Returns 204 regardless of whether the
 * row existed — prevents listing-enumeration via probe-and-observe.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await params;
  if (!listingId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  await prisma.savedHome.deleteMany({
    where: { userId: session.user.id, listingId },
  });

  return new NextResponse(null, { status: 204 });
}
