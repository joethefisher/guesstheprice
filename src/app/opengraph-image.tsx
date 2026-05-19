import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #1A1A1A 0%, #2C2C2A 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Diamond logo mark — matches Wordmark.tsx viewBox 0 0 28 28 */}
        <svg
          width="52"
          height="52"
          viewBox="0 0 28 28"
          fill="none"
          style={{ marginBottom: 24 }}
        >
          <path d="M3 6 L17 4 L25 14 L11 24 Z" fill="#F7F4EE" />
          <circle cx="13" cy="9" r="1.6" fill="#1A1A1A" />
        </svg>

        <div
          style={{
            fontSize: "var(--text-display-xl)",
            fontStyle: "italic",
            color: "#F7F4EE",
            fontFamily: "Georgia, serif",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-3px",
            marginBottom: 24,
          }}
        >
          pricetag
        </div>

        <div
          style={{
            fontSize: "var(--text-2xl)",
            color: "var(--paper-mute)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400,
          }}
        >
          Guess the price of real homes.
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
    { ...size }
  );
}
