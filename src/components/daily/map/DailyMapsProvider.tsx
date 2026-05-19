"use client";

/**
 * Wraps the daily route with the Google Maps APIProvider so the SDK
 * loads once for the whole flow rather than re-initializing each time
 * the modal opens.
 *
 * No-op when:
 *   - The global provider is "illustrated" (most installs)
 *   - The NEXT_PUBLIC_GOOGLE_MAPS_KEY env var is missing
 *
 * Loading the provider only when needed keeps the daily route's
 * bundle small for the common case.
 */

import { APIProvider } from "@vis.gl/react-google-maps";
import {
  getGoogleMapsApiKey,
  resolveMapProvider,
} from "@/lib/map/config";

export function DailyMapsProvider({ children }: { children: React.ReactNode }) {
  // Use a city-agnostic resolve — the provider needs to load before any
  // listing's city is known. If even one listing might use Google, load
  // the SDK; otherwise skip it.
  const globalProvider = resolveMapProvider({ city: "", state: "" });
  const key = getGoogleMapsApiKey();

  if (globalProvider !== "google" || !key) {
    return <>{children}</>;
  }

  return <APIProvider apiKey={key}>{children}</APIProvider>;
}
