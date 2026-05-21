import { type Metadata } from "next";
import Link from "next/link";
import { parseSharePayloadServer, bucketEmoji, accuracyToBucket } from "@/lib/daily/service";

interface Props {
  searchParams: Promise<{ v?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { v } = await searchParams;
  const payload = v ? parseSharePayloadServer(v) : null;
  if (!payload) {
    return { title: "Daily Result · Pricetag" };
  }
  const recent = payload.h.slice(-7);
  const emojiRow = recent.map((v) => (v != null ? bucketEmoji(accuracyToBucket(v)) : "⬜")).join("");
  return {
    title: `Pricetag #${payload.n} — ${payload.a}% · ${payload.c}, ${payload.t}`,
    description: `${emojiRow} · 🔥${payload.s} day streak. Can you beat it?`,
    openGraph: {
      title: `Pricetag #${payload.n} — ${payload.a}% accurate`,
      description: `${emojiRow} · Can you guess the price of a home in ${payload.c}, ${payload.t}?`,
    },
    twitter: {
      card: "summary",
      title: `Pricetag #${payload.n} — ${payload.a}%`,
      description: `${emojiRow} · Can you do better?`,
    },
  };
}

export default async function DailySharePage({ searchParams }: Props) {
  const { v } = await searchParams;
  const payload = v ? parseSharePayloadServer(v) : null;

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-paper">
        <h2 className="display m-0 text-2xl text-ink">
          This link has expired.
        </h2>
        <p className="text-ink-mute text-base m-0">
          Daily results are only shareable for a limited time.
        </p>
        <Link href="/daily" className="btn btn-primary text-base">
          Play today's house →
        </Link>
      </div>
    );
  }

  const recent = payload.h.slice(-7);
  const date = new Date(payload.d + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function accuracyColor(v: number): string {
    if (v >= 90) return "#4CAF50";
    if (v >= 80) return "#8BC34A";
    if (v >= 70) return "#FFC107";
    if (v >= 60) return "#FF9800";
    return "#9E9E9E";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink py-10 px-5">
      <div
        className="w-full max-w-narrow rounded-7 bg-[rgba(247,244,238,0.04)] overflow-hidden"
        style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1), 0 40px 80px -20px rgba(0,0,0,0.6)" }}
      >
        {/* Header strip */}
        <div className="px-6 pt-5 pb-4 border-b border-[rgba(247,244,238,0.08)] flex justify-between items-center">
          <div>
            <div className="eyebrow text-paper-40 text-xs mb-1">
              DAILY #{payload.n} · {date}
            </div>
            <div className="text-paper font-semibold text-sm">
              {payload.c}, {payload.t}
            </div>
          </div>
          <div className="display tnum text-display-l leading-none text-accent tracking-[-0.03em]">
            {payload.a}
            <span className="text-lg text-paper-40">%</span>
          </div>
        </div>

        {/* Emoji history grid */}
        <div className="px-6 pt-5 pb-4">
          <div className="eyebrow text-paper-40 text-xs mb-3">
            LAST 7 DAYS
          </div>
          <div className="flex gap-[5px]">
            {recent.map((v, i) => {
              const isToday = i === recent.length - 1;
              const bg = v == null ? "rgba(247,244,238,0.06)" : accuracyColor(v) + "40";
              const border = isToday ? "2px solid var(--accent)" : "1px solid rgba(247,244,238,0.08)";
              return (
                <div
                  key={i}
                  className="flex-1 h-9 rounded-md grid place-items-center text-md"
                  style={{ background: bg, border }}
                >
                  {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 text-sm text-paper-40 text-right">
            🔥 {payload.s} day streak
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <Link href="/daily" className="btn btn-primary text-base justify-between">
            <span>Play today's house</span>
            <span>→</span>
          </Link>
          <div className="text-center text-sm text-paper-40">
            Can you get closer to the actual price?
          </div>
        </div>
      </div>

      {/* Wordmark below card */}
      <div className="mt-7 text-paper-40 text-sm font-semibold tracking-[0.12em]">
        PRICETAG
      </div>
    </div>
  );
}
