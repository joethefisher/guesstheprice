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

/**
 * Radius (in meters) of the pre-submit "area" circle drawn around the
 * centroid: the half-diagonal of the 0.01° grid cell from
 * `centroidFromExact`, so the circle circumscribes the cell and every
 * possible house position is inside it. Longitude degrees shrink with
 * latitude, hence the cos(lat) term (≈766m at 19°N, ≈674m at 47°N).
 * Reveals nothing beyond the centroid itself. Shared by the static
 * thumbnail and the interactive map so both render the same size.
 */
export function preSubmitAreaRadiusM(lat: number): number {
  const METERS_PER_DEG_LAT = 111_320;
  const halfCellLat = 0.005 * METERS_PER_DEG_LAT;
  const halfCellLng = halfCellLat * Math.cos((lat * Math.PI) / 180);
  return Math.ceil(Math.hypot(halfCellLat, halfCellLng));
}

/** Build a MapBlock from a listing's exact coords. Returns null if no coords. */
export function buildMapBlock(lat: number | null, lng: number | null): MapBlock | null {
  if (lat == null || lng == null) return null;
  return {
    centroid: centroidFromExact(lat, lng),
    zoom: DEFAULT_NEIGHBORHOOD_ZOOM,
  };
}
