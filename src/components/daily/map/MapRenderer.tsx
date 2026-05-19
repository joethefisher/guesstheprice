"use client";

/**
 * MapRenderer — dispatches to the active provider.
 *
 * The provider is decided by:
 *   1. Explicit per-listing override (prop), if set
 *   2. `daily.map.provider` global flag (env-backed)
 *   3. Falls back to illustrated if the Google variant throws
 */

import { IllustratedMap } from "./IllustratedMap";
import { GoogleMapView } from "./GoogleMapView";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { resolveMapProvider, type MapProvider } from "@/lib/map/config";
import type { MapBlock, LatLng } from "@/lib/map";

interface Props {
  listingId: string;
  city: string;
  state: string;
  neighborhood: string | null;
  map: MapBlock;
  mode: "compact" | "full";
  revealed: boolean;
  exact?: LatLng | null;
  /** Per-listing override — wins over the global flag. */
  providerOverride?: MapProvider | null;
}

export function MapRenderer({
  listingId,
  city,
  state,
  neighborhood,
  map,
  mode,
  revealed,
  exact,
  providerOverride = null,
}: Props) {
  const provider = resolveMapProvider({ city, state, override: providerOverride });

  const illustrated = (
    <IllustratedMap
      listingId={listingId}
      city={city}
      state={state}
      neighborhood={neighborhood}
      mode={mode}
      revealed={revealed}
      centroid={map.centroid}
      exact={exact}
    />
  );

  if (provider === "google") {
    return (
      <MapErrorBoundary fallback={illustrated}>
        <GoogleMapView
          centroid={map.centroid}
          zoom={map.zoom}
          mode={mode}
          revealed={revealed}
          exact={exact}
          city={city}
        />
      </MapErrorBoundary>
    );
  }

  return illustrated;
}
