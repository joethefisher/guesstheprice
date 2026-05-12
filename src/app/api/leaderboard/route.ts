import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60; // cache for 1 minute

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  completedAt: string;
}

export interface StreakEntry {
  rank: number;
  username: string;
  bestStreak: number;
  played: number;
}

export interface LeaderboardResponse {
  highScores: LeaderboardEntry[];
  streaks: StreakEntry[];
  topScore: LeaderboardEntry | null;
}

export async function GET() {
  const [rawGames, rawStreaks] = await Promise.all([
    prisma.game.findMany({
      where: {
        completedAt: { not: null },
        userId: { not: null },
        totalScore: { not: null },
        gameType: "freeplay",
      },
      orderBy: { totalScore: "desc" },
      take: 100,
      select: {
        userId: true,
        totalScore: true,
        completedAt: true,
        user: { select: { username: true } },
      },
    }),
    prisma.userDailyProgress.findMany({
      where: { bestStreak: { gt: 0 } },
      orderBy: { bestStreak: "desc" },
      take: 20,
      select: {
        bestStreak: true,
        played: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  // Best game per user (games are already sorted by score desc, so first occurrence wins)
  const seen = new Set<string>();
  const deduped = rawGames.filter((g) => {
    if (!g.userId || seen.has(g.userId)) return false;
    seen.add(g.userId);
    return true;
  });

  const highScores: LeaderboardEntry[] = deduped.slice(0, 10).map((g, i) => ({
    rank: i + 1,
    username: g.user?.username ?? "unknown",
    score: g.totalScore!,
    completedAt: g.completedAt!.toISOString(),
  }));

  const streaks: StreakEntry[] = rawStreaks.slice(0, 10).map((s, i) => ({
    rank: i + 1,
    username: s.user.username,
    bestStreak: s.bestStreak,
    played: s.played,
  }));

  return NextResponse.json({
    highScores,
    streaks,
    topScore: highScores[0] ?? null,
  } satisfies LeaderboardResponse);
}
