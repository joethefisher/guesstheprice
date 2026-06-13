import { ImageResponse } from "next/og";
import { getAllCityCounts, getAllTargetCities, stateSlug } from "@/lib/city-data";

// Per-state OG image. State-level shares (e.g. someone shares
// `/cities/tx` because they like the Texas markets) get a card with the
// state name + city-count callout instead of the generic site-wide OG.

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pricetag — guess this state's home prices";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

type Props = { params: Promise<{ state: string }> };

export default async function StateOgImage({ params }: Props) {
  const { state } = await params;
  const code = state.toUpperCase();
  const name = STATE_NAMES[code];
  if (!name) {
    return new ImageResponse(<FallbackOg />, { ...size });
  }

  const inTarget = getAllTargetCities().some((m) => m.state === code);
  if (!inTarget) {
    return new ImageResponse(<FallbackOg />, { ...size });
  }

  const allCounts = await getAllCityCounts();
  const cities = allCounts.filter((c) => c.state === code);
  const totalListings = cities.reduce((sum, c) => sum + c.listingCount, 0);

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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 36,
              color: "rgba(247, 244, 238, 0.6)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Guess home prices across
          </div>
          <div
            style={{
              fontSize: 128,
              color: "#F7F4EE",
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-5px",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#FF5C39",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
              marginTop: 18,
            }}
          >
            {cities.length} {cities.length === 1 ? "city" : "cities"} covered
          </div>
        </div>

        <div
          style={{
            fontSize: 22,
            color: "rgba(247, 244, 238, 0.55)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {totalListings > 0
            ? `${totalListings} real listings · guesstheprice.ai`
            : `Real homes coming soon · guesstheprice.ai`}
        </div>

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
