import { ImageResponse } from "next/og";
import { resolveCityFromSlugs, getCityStats, formatPriceUsd } from "@/lib/city-data";

// Per-city OG image. Twitter/iMessage/Slack/LinkedIn share previews now
// show a custom card with the city's name + median price instead of the
// generic site-wide OG. Better click-through, better signal that the
// shared link is about THIS city specifically.

export const runtime = "nodejs"; // prisma + unstable_cache need Node runtime
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pricetag — guess this city's home prices";

type Props = { params: Promise<{ state: string; city: string }> };

export default async function CityOgImage({ params }: Props) {
  const { state, city } = await params;
  const identity = resolveCityFromSlugs(state, city);
  if (!identity) {
    return new ImageResponse(<FallbackOg />, { ...size });
  }
  const stats = await getCityStats(identity.city, identity.state);
  const median = stats.medianPriceUsd ? formatPriceUsd(stats.medianPriceUsd) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #1A1A1A 0%, #2C2C2A 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top row: brand mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
            <path d="M3 6 L17 4 L25 14 L11 24 Z" fill="#F7F4EE" />
            <circle cx="13" cy="9" r="1.6" fill="#1A1A1A" />
          </svg>
          <div
            style={{
              fontSize: 28,
              color: "#F7F4EE",
              fontStyle: "italic",
              letterSpacing: "-1px",
            }}
          >
            pricetag
          </div>
        </div>

        {/* Main copy block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 36,
              color: "rgba(247, 244, 238, 0.6)",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            Guess home prices in
          </div>
          <div
            style={{
              fontSize: 112,
              color: "#F7F4EE",
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-4px",
            }}
          >
            {identity.city}, {identity.state}
          </div>
          {median && (
            <div
              style={{
                fontSize: 28,
                color: "#FF5C39",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                marginTop: 18,
              }}
            >
              Median list around {median}
            </div>
          )}
        </div>

        {/* Bottom row: CTA-ish line */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(247, 244, 238, 0.55)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {stats.listingCount > 0
            ? `${stats.listingCount} real listings · guesstheprice.ai`
            : `Real homes coming soon · guesstheprice.ai`}
        </div>

        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 8,
            height: "100%",
            background: "#FF5C39",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

function FallbackOg() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#1A1A1A",
        color: "#F7F4EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 64,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
      }}
    >
      pricetag
    </div>
  );
}
