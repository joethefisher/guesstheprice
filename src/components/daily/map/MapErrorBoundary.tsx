"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches errors from the Google Maps renderer and falls back to the
 * illustrated variant. Per GOOGLE_MAPS_INTEGRATION.md §9, every failure
 * mode (missing key, referrer mismatch, quota exhausted, "for dev
 * purposes only" watermark) should degrade to the SVG variant, never
 * show a broken map.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log to Sentry if it's wired (otherwise no-op).
    if (typeof window !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Sentry = (window as any).Sentry;
        if (Sentry?.captureException) Sentry.captureException(error);
      } catch {
        // ignore
      }
      // eslint-disable-next-line no-console
      console.warn("[MapRenderer] Google variant failed, falling back to illustrated:", error);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
