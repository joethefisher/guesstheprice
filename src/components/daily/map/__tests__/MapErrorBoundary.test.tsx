// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { MapErrorBoundary } from "../MapErrorBoundary";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function Throwing({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

describe("MapErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <MapErrorBoundary fallback={<div>fallback</div>}>
        <div>ok</div>
      </MapErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("shows the fallback when a child throws — and captures the error to Sentry with the component tag", () => {
    // React logs the caught error to console.error even though we recover.
    // Silence it so test output stays clean.
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <MapErrorBoundary fallback={<div>illustrated-fallback</div>}>
        <Throwing message="boom" />
      </MapErrorBoundary>,
    );

    expect(screen.getByText("illustrated-fallback")).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledOnce();
    const [errorArg, ctx] = (Sentry.captureException as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((errorArg as Error).message).toBe("boom");
    expect(ctx).toMatchObject({ tags: { component: "MapErrorBoundary", fallback: "illustrated" } });

    err.mockRestore();
    warn.mockRestore();
  });
});
