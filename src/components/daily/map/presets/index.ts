/**
 * Preset registry.
 *
 * Looks up a hand-tuned `IllustratedMap` variant by `${city}|${state}`
 * (case-insensitive). When a preset is registered for a city, that
 * component renders in place of the generic procedural map.
 *
 * To add a new city: build a `<NewCityMap>` component that accepts
 * `PresetProps`, import it here, and register it in `PRESETS`.
 */

import type { IllustratedPreset } from "./types";
import { BrooklynMap } from "./BrooklynMap";
import { SanFranciscoMap } from "./SanFranciscoMap";

const PRESETS: Record<string, IllustratedPreset> = {
  "brooklyn|ny": BrooklynMap,
  "san francisco|ca": SanFranciscoMap,
};

export function getPreset(city: string, state: string): IllustratedPreset | null {
  const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
  return PRESETS[key] ?? null;
}

export type { PresetProps, IllustratedPreset } from "./types";
