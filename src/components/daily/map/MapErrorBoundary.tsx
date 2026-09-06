"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches errors from the Google Maps renderer and falls back to the
 * illustrated variant. Every failure mode (missing key, referrer
 * mismatch, quota exhausted, billing lapse, "for dev purposes only"
 * watermark) should degrade to the SVG variant, never show a broken map.
 *
 * Fires a tagged Sentry event on every fallback so ops notices when the
 * Google integration silently regresses (e.g. billing lapse) — otherwise
 * a silent fallback would let the problem sit for days.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    Sentry.captureException(error, {
      tags: { component: "MapErrorBoundary", fallback: "illustrated" },
    });
    // eslint-disable-next-line no-console
    console.warn("[MapRenderer] Google variant failed, falling back to illustrated:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
