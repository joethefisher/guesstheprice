// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vitest doesn't expose afterEach as a global by default, so RTL's
// auto-cleanup doesn't register. Do it explicitly so DOM from one test
// doesn't leak into the next.
afterEach(cleanup);

// Framer-motion → plain-tag passthrough. Strips framer-only props so React
// doesn't warn about unknown DOM attributes. Keeps children rendering
// synchronously, which is what our tests care about.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough = (Tag: string) => (props: Record<string, unknown>) => {
    const {
      initial, animate, exit, transition, variants, custom,
      whileHover, whileTap, whileInView, whileDrag, whileFocus,
      layout, layoutId, layoutDependency,
      ...rest
    } = props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void initial; void animate; void exit; void transition; void variants; void custom;
    void whileHover; void whileTap; void whileInView; void whileDrag; void whileFocus;
    void layout; void layoutId; void layoutDependency;
    return React.createElement(Tag, rest);
  };
  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_t, prop: string) => passthrough(prop),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Not the subject under test; stub so we don't render 80 confetti pieces.
vi.mock("@/components/Confetti", () => ({ Confetti: () => null }));

// Save-home hook talks to localStorage/network — irrelevant to nav tests.
vi.mock("@/lib/saved-homes-client", () => ({
  useSavedHomes: () => ({ homes: [], add: vi.fn(), remove: vi.fn() }),
}));

import { DailyReveal } from "@/components/daily/DailyReveal";

function baseProps() {
  return {
    result: { guess: 300_000, actual: 400_000, accuracy: 75 },
    listing: {
      id: "listing-1",
      neighborhood: null,
      city: "Lexington",
      state: "KY",
      photos: [{ url: "" }],
    },
    dailyNumber: 17,
    newStreak: 1,
    onShare: vi.fn(),
    onContinue: vi.fn(),
    onPractice: vi.fn(),
    onExit: vi.fn(),
  } as unknown as React.ComponentProps<typeof DailyReveal>;
}

describe("DailyReveal — navigation wiring (regression)", () => {
  it('the "Practice rounds" button calls onPractice, not onExit', async () => {
    const props = baseProps();
    render(<DailyReveal {...props} />);

    await userEvent.click(
      screen.getByRole("button", { name: /practice rounds/i }),
    );

    expect(props.onPractice).toHaveBeenCalledOnce();
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('the top-right close button calls onExit', async () => {
    const props = baseProps();
    render(<DailyReveal {...props} />);

    await userEvent.click(
      screen.getByRole("button", { name: /back to home/i }),
    );

    expect(props.onExit).toHaveBeenCalledOnce();
    expect(props.onPractice).not.toHaveBeenCalled();
  });
});
