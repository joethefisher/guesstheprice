// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Same framer-motion → plain-tag mock as DailyReveal.test.tsx.
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough = (Tag: string) => (props: Record<string, unknown>) => {
    const {
      initial, animate, exit, transition, variants, custom,
      whileHover, whileTap, whileInView, whileDrag, whileFocus,
      layout, layoutId, layoutDependency,
      ...rest
    } = props;
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

// MapExpandedModal isn't opened by default (mapOpen state starts false), but
// stub the import so any transitive dependencies stay out of jsdom.
vi.mock("../map/MapExpandedModal", () => ({
  MapExpandedModal: () => null,
}));

import { DailyLocked } from "@/components/daily/DailyLocked";

afterEach(cleanup);

function baseProps() {
  return {
    // Minimal shapes — DailyLocked treats result and listing as nullable.
    result: null,
    storage: { played: 0, currentStreak: 0, bestStreak: 0, history: [] },
    dailyNumber: 42,
    listing: null,
    onPractice: vi.fn(),
    onStats: vi.fn(),
    onExit: vi.fn(),
  } as unknown as React.ComponentProps<typeof DailyLocked>;
}

describe("DailyLocked — navigation wiring (regression)", () => {
  it('"Play practice rounds" calls onPractice, not onExit — this was the exact bug we fixed in page.tsx', async () => {
    const props = baseProps();
    render(<DailyLocked {...props} />);

    await userEvent.click(
      screen.getByRole("button", { name: /play practice rounds/i }),
    );

    expect(props.onPractice).toHaveBeenCalledOnce();
    expect(props.onExit).not.toHaveBeenCalled();
  });

  it('"See your stats" calls onStats', async () => {
    const props = baseProps();
    render(<DailyLocked {...props} />);

    await userEvent.click(
      screen.getByRole("button", { name: /see your stats/i }),
    );

    expect(props.onStats).toHaveBeenCalledOnce();
    expect(props.onExit).not.toHaveBeenCalled();
    expect(props.onPractice).not.toHaveBeenCalled();
  });

  it("top-right close button calls onExit", async () => {
    const props = baseProps();
    render(<DailyLocked {...props} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(props.onExit).toHaveBeenCalledOnce();
    expect(props.onPractice).not.toHaveBeenCalled();
    expect(props.onStats).not.toHaveBeenCalled();
  });
});
