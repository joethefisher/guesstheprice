// Shared vi.mock factories for the 409 UX component tests.
import React from "react";

export function framerPassthrough() {
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
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, prop: string) => passthrough(prop) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
}

export function sliderStub() {
  return {
    PriceSlider: ({ onChange }: { onChange: (v: number) => void }) =>
      React.createElement("button", { onClick: () => onChange(400_000) }, "set guess"),
  };
}

export function listing(id: string) {
  return {
    id, neighborhood: "Zilker", city: "Austin", state: "TX", beds: 3, baths: 2,
    sqft: 1500, lotSqft: null, yearBuilt: 1990, yearSold: 2019, homeType: "house",
    photos: [{ url: "https://x/p.jpg", thumbnailUrl: null, caption: null }], map: null,
  };
}

export function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
