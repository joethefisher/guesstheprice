"use client";

import { useState } from "react";
import { MapExpandedModal } from "./MapExpandedModal";
import { MapRenderer } from "./MapRenderer";
import type { MapBlock, LatLng } from "@/lib/map";

interface Props {
  listingId: string;
  city: string;
  state: string;
  neighborhood: string | null;
  map: MapBlock | null | undefined;
  /** True once the guess has been locked in. */
  revealed: boolean;
  /** Set only when revealed. */
  exact?: LatLng | null;
  /** Set only when revealed. */
  streetAddress?: string | null;
}

export function MapPreviewCard({
  listingId,
  city,
  state,
  neighborhood,
  map,
  revealed,
  exact,
  streetAddress,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  // If we have no map data at all, don't render the card.
  if (!map) return null;

  const eyebrow = revealed ? "EXACT LOCATION" : "APPROX. AREA";
  const headline = neighborhood ?? city;
  const sub = neighborhood ? `${city}, ${state}` : state;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="map-preview-card"
        aria-label={`Open map of ${headline}`}
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr auto",
          alignItems: "center",
          gap: 16,
          width: "100%",
          padding: 0,
          background: "var(--paper)",
          border: `1px solid ${hovered ? "var(--ink)" : "var(--rule)"}`,
          borderRadius: 14,
          overflow: "hidden",
          cursor: "pointer",
          textAlign: "left",
          boxShadow: hovered
            ? "0 10px 24px -14px rgba(26,26,26,0.35)"
            : "0 1px 0 var(--rule)",
          transition: "border-color 180ms var(--ease), box-shadow 180ms var(--ease), transform 180ms var(--ease)",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 120,
            height: 84,
            position: "relative",
            background: "#f0e9d8",
            borderRight: "1px solid var(--rule)",
          }}
        >
          <MapRenderer
            listingId={listingId}
            city={city}
            state={state}
            neighborhood={neighborhood}
            map={map}
            mode="compact"
            revealed={revealed}
            exact={exact}
          />
        </div>

        {/* Middle */}
        <div style={{ minWidth: 0, padding: "10px 0" }}>
          <div
            className="eyebrow"
            style={{
              fontSize: 10,
              color: revealed ? "var(--accent)" : "var(--ink-mute)",
              marginBottom: 4,
              letterSpacing: "0.12em",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "var(--display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 18,
              lineHeight: 1.15,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        </div>

        {/* Expand chip */}
        <div
          className="map-preview-chip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            marginRight: 14,
            borderRadius: 999,
            background: hovered ? "var(--ink)" : "transparent",
            color: hovered ? "var(--paper)" : "var(--ink)",
            border: "1px solid var(--rule)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            transition: "background 180ms var(--ease), color 180ms var(--ease)",
            whiteSpace: "nowrap",
          }}
        >
          <span className="map-preview-chip-label">View map</span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
      </button>

      {open && (
        <MapExpandedModal
          listingId={listingId}
          city={city}
          state={state}
          neighborhood={neighborhood}
          map={map}
          revealed={revealed}
          exact={exact}
          streetAddress={streetAddress}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
