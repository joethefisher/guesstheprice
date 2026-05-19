"use client";

export function YearSoldPill({ year }: { year: number | null | undefined }) {
  if (year == null) return null;
  return (
    <span
      role="img"
      aria-label={`Sold in ${year}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px 6px 8px",
        borderRadius: 999,
        background: "var(--accent)",
        color: "var(--paper)",
        boxShadow: "0 6px 14px -6px rgba(255, 92, 57, 0.45)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12 L12 3 L21 3 L21 12 L12 21 Z" />
        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--mono)",
          letterSpacing: "0.12em",
          opacity: 0.78,
          fontSize: 10,
          fontWeight: 500,
        }}
      >
        SOLD
      </span>
      <span
        aria-hidden="true"
        className="tnum"
        style={{
          fontFamily: "var(--display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        {year}
      </span>
    </span>
  );
}
