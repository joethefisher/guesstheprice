"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapRenderer } from "./MapRenderer";
import "./map.css";
import type { MapBlock, LatLng } from "@/lib/map";

interface Props {
  listingId: string;
  city: string;
  state: string;
  neighborhood: string | null;
  map: MapBlock;
  revealed: boolean;
  exact?: LatLng | null;
  streetAddress?: string | null;
  onClose: () => void;
}

export function MapExpandedModal({
  listingId,
  city,
  state,
  neighborhood,
  map,
  revealed,
  exact,
  streetAddress,
  onClose,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc closes, focus the close button on mount, lock body scroll
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Defer focus so the scale-in animation gets a frame first.
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [onClose]);

  const headline = neighborhood ?? city;

  return (
    <AnimatePresence>
      <motion.div
        key="map-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="map-modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(15, 13, 10, 0.55)",
          backdropFilter: "blur(8px)",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <motion.div
          key="map-modal-card"
          role="dialog"
          aria-modal="true"
          aria-label={`Map of ${headline}`}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="map-modal-card"
          style={{
            width: "100%",
            maxWidth: "var(--w-wide)",
            maxHeight: 660,
            background: "var(--paper)",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--rule)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                className="eyebrow"
                style={{
                  color: revealed ? "var(--accent)" : "var(--ink-mute)",
                  marginBottom: 4,
                }}
              >
                {revealed ? "Exact location" : "Neighborhood"}
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "var(--text-2xl)",
                  lineHeight: 1,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {neighborhood ? `${neighborhood}, ` : ""}
                <span style={{ color: "var(--ink-mute)" }}>
                  {city}, {state}
                </span>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close map"
              className="map-modal-close"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                transition: "background 160ms var(--ease)",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "var(--accent-deep)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "var(--accent)")
              }
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div
            className="map-modal-body"
            style={{
              position: "relative",
              background: "#f0e9d8",
              overflow: "hidden",
              minHeight: 320,
            }}
          >
            <MapRenderer
              listingId={listingId}
              city={city}
              state={state}
              neighborhood={neighborhood}
              map={map}
              mode="full"
              revealed={revealed}
              exact={exact}
            />

            {/* Pre-submit callout pill */}
            {!revealed && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 22,
                  transform: "translateX(-50%)",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "rgba(15, 13, 10, 0.78)",
                  color: "var(--paper)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  backdropFilter: "blur(8px)",
                  whiteSpace: "nowrap",
                }}
              >
                Exact location reveals after you lock in
              </div>
            )}

            {/* Post-reveal address card */}
            {revealed && streetAddress && (
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 22,
                  right: 22,
                  maxWidth: 420,
                  padding: "14px 16px",
                  background: "rgba(247, 244, 238, 0.96)",
                  border: "1px solid var(--rule)",
                  borderRadius: 14,
                  boxShadow: "0 14px 36px -16px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  className="eyebrow"
                  style={{
                    color: "var(--accent)",
                    marginBottom: 4,
                  }}
                >
                  Address
                </div>
                <div
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.3,
                  }}
                >
                  {streetAddress}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--ink-mute)",
                    marginTop: 2,
                  }}
                >
                  {city}, {state}
                </div>
              </div>
            )}
          </div>

          {/* Footer legend */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--rule)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              background: "var(--cream)",
            }}
          >
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <LegendSwatch color="#c8d8b8" label="Park" />
              <LegendSwatch color="#cfe1ec" label="Water" />
              <LegendSwatch color="#f5e1a0" label="Arterial" />
              <LegendSwatch color="#FF5C39" label={revealed ? "Pin" : "Area"} />
            </div>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--ink-quiet)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--mono)",
              }}
            >
              Stylized · Not to scale
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
 <div className="flex items-center gap-2">
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: color,
          border: "1px solid rgba(26,26,26,0.1)",
        }}
      />
      <span
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--ink-mute)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}
