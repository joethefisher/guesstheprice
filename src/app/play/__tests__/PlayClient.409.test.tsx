// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

vi.mock("framer-motion", async () => (await import("../../../../test/score-409-mocks")).framerPassthrough());
vi.mock("@/components/PriceSlider", async () => (await import("../../../../test/score-409-mocks")).sliderStub());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@/components/PhotoCarousel", () => ({ PhotoCarousel: () => null }));
vi.mock("@/components/RevealOverlay", () => ({ RevealOverlay: () => null }));
vi.mock("@/components/daily/map/MapPreviewCard", () => ({ MapPreviewCard: () => null }));
vi.mock("@/components/daily/map/DailyMapsProvider", () => ({
  DailyMapsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/prefetch", () => ({ popFromCache: () => null }));
vi.mock("@/lib/analytics", () => ({
  events: { gameStarted: vi.fn(), roundSubmitted: vi.fn(), homeSaved: vi.fn(), gameCompleted: vi.fn() },
}));
vi.mock("@/lib/saved-homes-client", () => ({
  useSavedHomes: () => ({ homes: [], add: vi.fn(), remove: vi.fn() }),
}));

import PlayClient from "@/app/play/PlayClient";
import { PLAY_UNPLAYABLE_MESSAGE } from "@/lib/score-response";
import { listing, jsonResponse } from "../../../../test/score-409-mocks";

describe("PlayClient — /api/score 409", () => {
  it("loads a different home for the same round with a short notice", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      if (url === "/api/games") return jsonResponse(200, {});
      if (url === "/api/score") return jsonResponse(409, { error: "listing not playable" });
      if (url.startsWith("/api/listings")) return jsonResponse(200, listing("l2"));
      throw new Error(`unexpected ${url}`);
    }));

    render(<PlayClient initialListing={listing("l1")} />);
    await userEvent.click(screen.getByRole("button", { name: "set guess" }));
    await userEvent.click(screen.getByRole("button", { name: /lock it in/i }));

    await waitFor(() => expect(calls).toContain("/api/listings?exclude=l1"));
    expect(await screen.findByRole("status")).toHaveTextContent(PLAY_UNPLAYABLE_MESSAGE);
    // Same round: the swapped-in home is still round 1.
    expect(screen.getByText("01", { selector: "span" }).parentElement).toHaveTextContent(/ROUND\s*01/);
    expect(calls.filter((u) => u === "/api/score")).toHaveLength(1);
    expect(screen.queryByText(/please try again/i)).not.toBeInTheDocument();
  });
});
