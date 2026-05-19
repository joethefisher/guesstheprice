/**
 * Hand-tuned illustrated map preset.
 *
 * The default IllustratedMap is procedural — seeded by listingId. A preset
 * replaces that generator with a city-specific component that knows the
 * place's character (BK = strict grid, SF = peninsula water on 3 sides).
 *
 * When hand-drawn SVG art exists for a city, drop it here and it slots
 * straight into the dispatch chain without touching the renderer.
 */

import type { LatLng } from "@/lib/map";

export interface PresetProps {
  listingId: string;
  revealed: boolean;
  centroid?: LatLng | null;
  exact?: LatLng | null;
  mode: "compact" | "full";
}

export type IllustratedPreset = React.ComponentType<PresetProps>;
