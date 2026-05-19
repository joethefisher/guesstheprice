/**
 * Map provider configuration.
 *
 * Flag: daily.map.provider
 *   - "illustrated" (default) — paper-styled SVG, no API cost
 *   - "google" — real Google Maps via @vis.gl/react-google-maps
 *
 * Defaults to illustrated. The Google variant is opt-in until we have
 * a working API key with referrer restrictions and a billing cap.
 *
 * Per-listing override: cities without a custom illustrated preset can
 * be flipped to google individually. (Right now every city uses the
 * generic illustrated renderer, so no overrides are configured.)
 */

export type MapProvider = "illustrated" | "google";

export const DEFAULT_MAP_PROVIDER: MapProvider = "illustrated";

/**
 * Read the global feature-flag value.
 *
 * On the client we honor NEXT_PUBLIC_DAILY_MAP_PROVIDER so QA can flip
 * the provider per environment without a code change. Anywhere else it
 * falls back to the compiled default.
 */
function readGlobalProvider(): MapProvider {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DAILY_MAP_PROVIDER
      : undefined;
  if (raw === "google" || raw === "illustrated") return raw;
  return DEFAULT_MAP_PROVIDER;
}

/**
 * Cities that should bypass the global flag and force a specific provider.
 *
 * Use case: a city that has a hand-illustrated preset stays on
 * illustrated even when the global flag is "google", and vice versa.
 *
 * Key is `${city}|${state}` (case-insensitive).
 *
 * TODO(map): populate this as hand-drawn city presets land.
 */
const CITY_OVERRIDES: Record<string, MapProvider> = {
  // "charleston|sc": "illustrated",
  // "brooklyn|ny": "illustrated",
};

interface ResolveArgs {
  city: string;
  state: string;
  /** If set, wins over both the per-city override and the global flag. */
  override?: MapProvider | null;
}

export function resolveMapProvider({ city, state, override }: ResolveArgs): MapProvider {
  if (override) return override;
  const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
  const cityOverride = CITY_OVERRIDES[key];
  if (cityOverride) return cityOverride;
  return readGlobalProvider();
}

export function getGoogleMapsApiKey(): string | null {
  if (typeof process === "undefined") return null;
  const k = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  return k && k.length > 0 ? k : null;
}

/** Map ID for the custom paper-palette styling. Optional. */
export function getGoogleMapId(): string | null {
  if (typeof process === "undefined") return null;
  const id = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;
  return id && id.length > 0 ? id : null;
}
