import { type Metadata } from "next";
import Link from "next/link";
import { parseSharePayloadServer, bucketEmoji, accuracyToBucket } from "@/lib/daily/service";

interface Props {
  searchParams: { v?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const payload = searchParams.v ? parseSharePayloadServer(searchParams.v) : null;
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

export default function DailySharePage({ searchParams }: Props) {
  const payload = searchParams.v ? parseSharePayloadServer(searchParams.v) : null;

  if (!payload) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "var(--paper)" }}
      >
        <h2 className="display m-0" style={{ fontSize: "var(--text-2xl)", color: "var(--ink)" }}>
          This link has expired.
        </h2>
        <p style={{ color: "var(--ink-mute)", fontSize: "var(--text-base)", margin: 0 }}>
          Daily results are only shareable for a limited time.
        </p>
        <Link href="/daily" className="btn btn-primary" style={{ fontSize: "var(--text-base)" }}>
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
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--ink)", padding: "40px 20px" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--w-narrow)",
          borderRadius: 28,
          background: "rgba(247,244,238,0.04)",
          boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.1), 0 40px 80px -20px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(247,244,238,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: "var(--paper-quiet)", fontSize: "var(--text-xs)", marginBottom: 4 }}
            >
              DAILY #{payload.n} · {date}
            </div>
            <div style={{ color: "var(--paper)", fontWeight: 600, fontSize: "var(--text-sm)" }}>
              {payload.c}, {payload.t}
            </div>
          </div>
          <div
            className="display tnum"
            style={{ fontSize: "var(--text-display-l)", lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.03em" }}
          >
            {payload.a}
            <span style={{ fontSize: "var(--text-lg)", color: "var(--paper-quiet)" }}>%</span>
          </div>
        </div>

        {/* Emoji history grid */}
        <div style={{ padding: "20px 24px 16px" }}>
          <div
            className="eyebrow"
            style={{ color: "var(--paper-quiet)", fontSize: "var(--text-xs)", marginBottom: 12 }}
          >
            LAST 7 DAYS
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {recent.map((v, i) => {
              const isToday = i === recent.length - 1;
              const bg = v == null ? "rgba(247,244,238,0.06)" : accuracyColor(v) + "40";
              const border = isToday ? "2px solid var(--accent)" : "1px solid rgba(247,244,238,0.08)";
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 6,
                    background: bg,
                    border,
                    display: "grid",
                    placeItems: "center",
                    fontSize: "var(--text-md)",
                  }}
                >
                  {v == null ? "·" : bucketEmoji(accuracyToBucket(v))}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: "var(--text-sm)",
              color: "var(--paper-quiet)",
              textAlign: "right",
            }}
          >
            🔥 {payload.s} day streak
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/daily"
            className="btn btn-primary"
            style={{ fontSize: "var(--text-base)", justifyContent: "space-between" }}
          >
            <span>Play today's house</span>
            <span>→</span>
          </Link>
          <div
            style={{
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--paper-quiet)",
            }}
          >
            Can you get closer to the actual price?
          </div>
        </div>
      </div>

      {/* Wordmark below card */}
      <div style={{ marginTop: 28, color: "var(--paper-quiet)", fontSize: "var(--text-sm)", fontWeight: 600, letterSpacing: "0.12em" }}>
        PRICETAG
      </div>
    </div>
  );
}
