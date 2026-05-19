/* global React */
// src/daily/shared.jsx — Daily-specific reusable bits

const { useState: useStateS, useEffect: useEffectS } = React;

// Today's daily — single shared listing across all users
const TODAY = {
  number: 142,
  date: "Sunday, May 10, 2026",
  shortDate: "May 10",
  listing: {
    id: "daily-142",
    nickname: "Charleston single house",
    neighborhood: "South of Broad",
    city: "Charleston",
    state: "SC",
    address: "47 Tradd St",
    beds: 4, baths: 3.5, sqft: 3240, year: 1854, lot: 4800,
    price: 2_495_000,
    bandColor: "#C4A788",
    blurb: "Antebellum single house, three-story piazza, brick courtyard.",
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1600&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
    ],
    photoCount: 18,
  },
};

// Player state (mocked)
const PLAYER = {
  streak: 12,
  bestStreak: 28,
  played: 47,
  avgAccuracy: 78,
  guessTimePct: 73, // % of players who got within 10%
  distribution: [
    { bucket: "90+", count: 3, tone: "var(--emerald)" },
    { bucket: "80",  count: 11, tone: "var(--moss)" },
    { bucket: "70",  count: 14, tone: "var(--accent)" },
    { bucket: "60",  count: 9, tone: "var(--gold)" },
    { bucket: "50",  count: 5, tone: "var(--ink-mute)" },
    { bucket: "<50", count: 5, tone: "var(--ink-quiet)" },
  ],
  // 35 days of history; null = not played, number = accuracy %
  history: [
    92, 78, 84, null, 71, 88, 95,
    62, 79, 81, 90, 73, 68, 84,
    null, 77, 82, 94, 71, 85, 80,
    72, 69, 88, 91, 86, 75, 79,
    83, 88, 92, 76, 81, 87, 79,
  ],
};

// Shape the existing app's brand stamp: small wordmark + daily badge
function DailyBadge({ size = "md", subtle = false }) {
  const big = size === "lg";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: big ? "8px 14px" : "5px 11px",
      borderRadius: 999,
      background: subtle ? "rgba(255,214,107,0.18)" : "var(--gold)",
      color: subtle ? "var(--gold)" : "#15110d",
      boxShadow: subtle ? "inset 0 0 0 1px rgba(200,163,72,0.45)" : "0 4px 14px -6px rgba(200,163,72,0.7)",
    }}>
      <svg width={big ? 16 : 12} height={big ? 16 : 12} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0l2 5.5h6L11 9l2 6-5-3.5L3 15l2-6-5-3.5h6z"/>
      </svg>
      <span className="caption" style={{
        fontSize: big ? 12 : 10, letterSpacing: "0.16em", fontWeight: 700,
      }}>DAILY · #{TODAY.number}</span>
    </div>
  );
}

// Countdown to next midnight ET
function NextDailyCountdown({ size = 28, color = "var(--ink)" }) {
  const [now, setNow] = useStateS(Date.now());
  useEffectS(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // mock: 6h 42m 18s
  const total = 6 * 3600 + 42 * 60 + 18 - Math.floor((now / 1000) % 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = n => String(Math.max(0, n)).padStart(2, "0");
  return (
    <span className="countdown" style={{ fontSize: size, color }}>
      <span>{pad(h)}</span>
      <span style={{ opacity: 0.4, fontSize: size * 0.7 }}>:</span>
      <span>{pad(m)}</span>
      <span style={{ opacity: 0.4, fontSize: size * 0.7 }}>:</span>
      <span>{pad(s)}</span>
    </span>
  );
}

// Mini distribution chart — Wordle-style
function Distribution({ highlight = "70" }) {
  const max = Math.max(...PLAYER.distribution.map(d => d.count));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {PLAYER.distribution.map(d => {
        const isMe = d.bucket === highlight;
        const w = `${Math.max(8, (d.count / max) * 100)}%`;
        return (
          <div key={d.bucket} className="dist-row">
            <span style={{ color: "var(--ink-mute)", textAlign: "right" }}>{d.bucket}</span>
            <div style={{ position: "relative", height: "100%", background: "rgba(26,26,26,0.05)", borderRadius: 3 }}>
              <div className="dist-bar" style={{
                width: w, background: isMe ? "var(--accent)" : "var(--ink)",
                boxShadow: isMe ? "0 2px 10px -4px var(--accent)" : "none",
              }}>{d.count}</div>
            </div>
            <span style={{ color: isMe ? "var(--accent)" : "var(--ink-quiet)", textAlign: "right" }}>
              {isMe ? "← you" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Tiny stat block
function StatBlock({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="display tnum" style={{
        fontSize: 44, lineHeight: 1, color: accent || "var(--ink)",
        letterSpacing: "-0.025em",
      }}>{value}</div>
      <div className="eyebrow" style={{ marginTop: 8, fontSize: 9.5 }}>{label}</div>
    </div>
  );
}

window.TODAY = TODAY;
window.PLAYER = PLAYER;
window.DailyBadge = DailyBadge;
window.NextDailyCountdown = NextDailyCountdown;
window.Distribution = Distribution;
window.StatBlock = StatBlock;
