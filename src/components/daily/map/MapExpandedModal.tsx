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
        className="map-modal-backdrop fixed inset-0 z-[60] grid place-items-center p-6"
        style={{
          background: "rgba(15, 13, 10, 0.55)",
          backdropFilter: "blur(8px)",
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
          className="map-modal-card w-full max-w-wide max-h-[660px] bg-paper rounded-6 overflow-hidden shadow-modal grid"
          style={{ gridTemplateRows: "auto 1fr auto" }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-rule flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className={`eyebrow mb-1 ${revealed ? "text-accent" : "text-ink-mute"}`}>
                {revealed ? "Exact location" : "Neighborhood"}
              </div>
              <div className="font-display italic font-medium text-2xl leading-none text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {neighborhood ? `${neighborhood}, ` : ""}
                <span className="text-ink-mute">
                  {city}, {state}
                </span>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close map"
              className="map-modal-close w-10 h-10 rounded-2 border-none bg-accent text-white cursor-pointer grid place-items-center transition-colors flex-shrink-0 hover:bg-accent-deep"
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
            className="map-modal-body relative overflow-hidden min-h-[320px]"
            style={{ background: "#f0e9d8" }}
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
                className="absolute left-1/2 bottom-[22px] -translate-x-1/2 py-2.5 px-4 rounded-pill text-paper text-sm font-semibold tracking-[0.06em] whitespace-nowrap"
                style={{
                  background: "rgba(15, 13, 10, 0.78)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Exact location reveals after you lock in
              </div>
            )}

            {/* Post-reveal address card */}
            {revealed && streetAddress && (
              <div
                className="absolute left-[22px] bottom-[22px] right-[22px] max-w-[420px] py-3.5 px-4 bg-paper-95 border border-rule rounded-3"
                style={{ boxShadow: "0 14px 36px -16px rgba(0,0,0,0.4)" }}
              >
                <div className="eyebrow text-accent mb-1">
                  Address
                </div>
                <div className="text-base font-semibold text-ink leading-[1.3]">
                  {streetAddress}
                </div>
                <div className="text-sm text-ink-mute mt-0.5">
                  {city}, {state}
                </div>
              </div>
            )}
          </div>

          {/* Footer legend */}
          <div className="py-3.5 px-6 border-t border-rule flex items-center justify-between gap-3 flex-wrap bg-cream">
            <div className="flex gap-[18px] flex-wrap">
              <LegendSwatch color="#c8d8b8" label="Park" />
              <LegendSwatch color="#cfe1ec" label="Water" />
              <LegendSwatch color="#f5e1a0" label="Arterial" />
              <LegendSwatch color="#FF5C39" label={revealed ? "Pin" : "Area"} />
            </div>
            <div className="text-xs text-ink-quiet tracking-[0.06em] uppercase font-mono">
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
        className="w-3.5 h-3.5 rounded-[4px] border border-ink-08"
        style={{ background: color }}
      />
      <span className="text-sm text-ink-mute font-medium">
        {label}
      </span>
    </div>
  );
}
