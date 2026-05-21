"use client";

import { useState } from "react";
import { MapExpandedModal } from "./MapExpandedModal";
import { MapRenderer } from "./MapRenderer";
import "./map.css";
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

  const eyebrow = revealed ? "EXACT LOCATION" : "NEIGHBORHOOD";
  const headline = neighborhood ?? city;
  const sub = neighborhood ? `${city}, ${state}` : state;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`map-preview-card grid items-center gap-4 w-full p-0 bg-paper rounded-3 overflow-hidden cursor-pointer text-left transition-[border-color,box-shadow,transform] duration-200 ${
          hovered ? "border border-ink -translate-y-px" : "border border-rule translate-y-0"
        }`}
        aria-label={`Open map of ${headline}`}
        style={{
          gridTemplateColumns: "120px 1fr auto",
          boxShadow: hovered
            ? "0 10px 24px -14px rgba(26,26,26,0.35)"
            : "0 1px 0 var(--rule)",
        }}
      >
        {/* Thumbnail */}
        <div
          className="w-[120px] h-[84px] relative border-r border-rule"
          style={{ background: "#f0e9d8" }}
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
        <div className="min-w-0 py-2.5">
          <div className={`eyebrow text-xs mb-1 tracking-[0.12em] ${revealed ? "text-accent" : "text-ink-mute"}`}>
            {eyebrow}
          </div>
          <div className="font-display italic font-medium text-md leading-[1.15] text-ink whitespace-nowrap overflow-hidden text-ellipsis">
            {headline}
          </div>
          <div className="text-sm text-ink-mute mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            {sub}
          </div>
        </div>

        {/* Expand chip */}
        <div
          className={`map-preview-chip flex items-center gap-1.5 py-2 px-3.5 mr-3.5 rounded-pill border border-rule text-sm font-semibold tracking-[0.04em] whitespace-nowrap transition-colors duration-200 ${
            hovered ? "bg-ink text-paper" : "bg-transparent text-ink"
          }`}
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
