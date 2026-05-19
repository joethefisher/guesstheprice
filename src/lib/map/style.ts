/**
 * Google Maps custom style — Pricetag paper palette.
 * Mirrors the JSON in GOOGLE_MAPS_INTEGRATION.md §6.1.
 *
 * Two ways to apply this:
 *   - Cloud-based Map ID (recommended): create in Google Cloud Console,
 *     paste this JSON into the editor, then set NEXT_PUBLIC_GOOGLE_MAPS_ID.
 *   - Inline: pass to <Map styles={MAP_STYLES} /> (works without a Map ID
 *     but reloads on every mount and can't be edited without a deploy).
 */

// Loose typing — @types/google.maps would tighten this but isn't installed.
type MapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
};

export const MAP_STYLES: MapStyle[] = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#4a4540" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f7f4ee" }, { weight: 2 }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0e9d8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe1ec" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8e0cd" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c8d8b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }, { weight: 1.5 }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5e1a0" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e0d8c5" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d8d0bd" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
];

/** Static Maps API uses a different format — repeat `&style=...` URL params. */
export const STATIC_MAP_STYLES = [
  "feature:all|element:labels.text.fill|color:0x4a4540",
  "feature:all|element:labels.text.stroke|color:0xf7f4ee|weight:2",
  "feature:landscape|element:geometry|color:0xf0e9d8",
  "feature:water|element:geometry|color:0xcfe1ec",
  "feature:poi|element:geometry|color:0xe8e0cd",
  "feature:poi.park|element:geometry|color:0xc8d8b8",
  "feature:road|element:geometry|color:0xffffff",
  "feature:road.arterial|element:geometry|color:0xffffff|weight:1.5",
  "feature:road.highway|element:geometry|color:0xf5e1a0",
  "feature:transit|element:geometry|color:0xe0d8c5",
  "feature:administrative|element:geometry.stroke|color:0xd8d0bd",
  "feature:poi.business|visibility:off",
];
