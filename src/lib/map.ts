/**
 * Map data helpers — the centroid/exact split.
 *
 * SECURITY: the pre-submit payload sent to clients must NEVER contain
 * the exact lat/lng of a listing. Doing so would let a cheater read the
 * raw network response and reverse-geocode the answer. The exact pin is
 * only returned by /api/score (after the guess is locked in).
 *
 * The pre-submit "centroid" is an obfuscated point derived from the
 * exact coords: snapped to a 0.01° grid (~1.1 km in most US latitudes)
 * with a deterministic 0.005° offset to the cell center. Good enough to
 * convey neighborhood vibe; not precise enough to identify a house.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBlock {
  /** Obfuscated, ~1 km accurate. Safe to send pre-submit. */
  centroid: LatLng;
  /** Suggested map zoom level — 14 ≈ neighborhood. */
  zoom: number;
}

/** Snap an exact lat/lng to a coarser grid so it can be sent pre-submit. */
export function centroidFromExact(lat: number, lng: number): LatLng {
  // 0.01° grid ≈ 1.1km. Round down, offset to cell center.
  const snapLat = Math.floor(lat * 100) / 100 + 0.005;
  const snapLng = Math.floor(lng * 100) / 100 + 0.005;
  return { lat: snapLat, lng: snapLng };
}

export const DEFAULT_NEIGHBORHOOD_ZOOM = 14;

/** Build a MapBlock from a listing's exact coords. Returns null if no coords. */
export function buildMapBlock(lat: number | null, lng: number | null): MapBlock | null {
  if (lat == null || lng == null) return null;
  return {
    centroid: centroidFromExact(lat, lng),
    zoom: DEFAULT_NEIGHBORHOOD_ZOOM,
  };
}
