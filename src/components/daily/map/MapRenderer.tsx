"use client";

/**
 * MapRenderer — dispatches to the active provider.
 *
 * In v1 this always returns the illustrated variant. Step 6 expands it
 * to choose between illustrated and Google based on the feature flag
 * + per-listing override, with an error boundary that falls back to
 * illustrated if Google fails.
 */

import { IllustratedMap } from "./IllustratedMap";
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
}

export function MapRenderer({
  listingId,
  city,
  state,
  neighborhood,
  map: _map,
  mode,
  revealed,
  exact,
}: Props) {
  return (
    <IllustratedMap
      listingId={listingId}
      city={city}
      state={state}
      neighborhood={neighborhood}
      mode={mode}
      revealed={revealed}
      centroid={_map.centroid}
      exact={exact}
    />
  );
}
