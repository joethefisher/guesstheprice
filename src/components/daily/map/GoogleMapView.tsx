"use client";

/**
 * Google Maps variant — variant B per GOOGLE_MAPS_INTEGRATION.md.
 *
 * Behavior:
 *   - "compact" mode (preview card) uses the Static Maps API as a plain
 *     <img> tag. Cheaper, faster, no JS init cost.
 *   - "full" mode (modal) uses the interactive JS <Map> component so
 *     users can pan and zoom.
 *
 * Both modes:
 *   - Pre-submit: a translucent accent circle at the centroid, NO marker
 *     and NO clickable POIs (those leak the answer).
 *   - Post-reveal: an <AdvancedMarker> with the price-tag pin at the
 *     exact coords.
 *
 * If the API key is missing or invalid, this component throws — the
 * <MapErrorBoundary> above it will fall back to the illustrated variant.
 */

import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { getGoogleMapsApiKey, getGoogleMapId } from "@/lib/map/config";
import { STATIC_MAP_STYLES } from "@/lib/map/style";
import type { LatLng } from "@/lib/map";

interface Props {
  centroid: LatLng;
  zoom: number;
  mode: "compact" | "full";
  revealed: boolean;
  exact?: LatLng | null;
  city?: string;
}

export function GoogleMapView({
  centroid,
  zoom,
  mode,
  revealed,
  exact,
  city,
}: Props) {
  const key = getGoogleMapsApiKey();
  if (!key) {
    // Throws so the error boundary catches and falls back.
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY is not configured");
  }

  if (mode === "compact") {
    return <StaticMapImage centroid={centroid} zoom={zoom} revealed={revealed} exact={exact} apiKey={key} city={city} />;
  }

  return <InteractiveMap centroid={centroid} zoom={zoom} revealed={revealed} exact={exact} />;
}

// ─── Compact: Static Maps ─────────────────────────────────────────────────────

function StaticMapImage({
  centroid,
  zoom,
  revealed,
  exact,
  apiKey,
  city,
}: {
  centroid: LatLng;
  zoom: number;
  revealed: boolean;
  exact?: LatLng | null;
  apiKey: string;
  city?: string;
}) {
  const center = revealed && exact ? `${exact.lat},${exact.lng}` : `${centroid.lat},${centroid.lng}`;

  const params = new URLSearchParams({
    center,
    zoom: String(zoom),
    size: "240x168",
    scale: "2",
    maptype: "roadmap",
    key: apiKey,
  });

  // Repeat the &style= URL param for each style entry.
  for (const s of STATIC_MAP_STYLES) params.append("style", s);

  if (revealed && exact) {
    // Post-reveal: drop the orange pin.
    params.append("markers", `color:0xFF5C39|${exact.lat},${exact.lng}`);
  } else {
    // Pre-submit: a translucent area circle approximated via a polygon
    // (the Static API has no native "circle" primitive).
    const circle = encodeCircle(centroid, 600, 24);
    params.append("path", `fillcolor:0xFF5C3933|color:0xFF5C39|weight:2|${circle}`);
  }

  return (
    <img
      src={`https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`}
      alt={city ? `Map near ${city}` : "Neighborhood map"}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

/** Build a `points:` value for the Static Maps `path` param. */
function encodeCircle(center: LatLng, radiusMeters: number, segments: number): string {
  const pts: string[] = [];
  const earthR = 6371_000;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.cos(t)) / earthR;
    const dLng =
      (radiusMeters * Math.sin(t)) / (earthR * Math.cos((center.lat * Math.PI) / 180));
    const lat = center.lat + (dLat * 180) / Math.PI;
    const lng = center.lng + (dLng * 180) / Math.PI;
    pts.push(`${lat.toFixed(5)},${lng.toFixed(5)}`);
  }
  return pts.join("|");
}

// ─── Full: Interactive Map ────────────────────────────────────────────────────

function InteractiveMap({
  centroid,
  zoom,
  revealed,
  exact,
}: {
  centroid: LatLng;
  zoom: number;
  revealed: boolean;
  exact?: LatLng | null;
}) {
  const mapId = getGoogleMapId();

  const defaultCenter = revealed && exact ? exact : centroid;
  const defaultZoom = revealed ? Math.max(zoom + 2, 16) : zoom;

  return (
    <Map
      {...(mapId ? { mapId } : {})}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      gestureHandling="greedy"
      disableDefaultUI={false}
      streetViewControl={false}
      mapTypeControl={false}
      fullscreenControl={false}
      // clickableIcons prevents users from clicking nearby POI labels
      // which would surface place cards with exact addresses.
      clickableIcons={false}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Pre-submit: translucent circle. We render a Circle by overlaying
          a div via the Map's overlay layer is complex, so we use a marker
          with a custom DOM element to draw a soft halo for now. The full
          spec calls for a <Circle> primitive — TODO(map): switch to a
          proper Circle once @vis.gl/react-google-maps exposes one. */}
      {!revealed && (
        <AdvancedMarker position={centroid}>
          <div
            aria-hidden
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255, 92, 57, 0.18)",
              border: "2px solid rgba(255, 92, 57, 0.7)",
              transform: "translate(0, 0)",
            }}
          />
        </AdvancedMarker>
      )}

      {revealed && exact && (
        <AdvancedMarker position={exact}>
          <PriceTagPin />
        </AdvancedMarker>
      )}
    </Map>
  );
}

function PriceTagPin() {
  return (
    <div style={{ transform: "translate(-50%, -100%)" }}>
      <svg width={36} height={46} viewBox="0 0 32 42">
        <path
          d="M16 0 C 25 0 32 7 32 16 C 32 27 16 42 16 42 C 16 42 0 27 0 16 C 0 7 7 0 16 0 Z"
          fill="#FF5C39"
          stroke="#fff"
          strokeWidth={2.5}
        />
        <circle cx={16} cy={16} r={5.5} fill="#fff" />
      </svg>
    </div>
  );
}
