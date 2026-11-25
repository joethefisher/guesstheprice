// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

vi.mock("framer-motion", async () => (await import("../../../../test/score-409-mocks")).framerPassthrough());
vi.mock("@/components/PriceSlider", async () => (await import("../../../../test/score-409-mocks")).sliderStub());
vi.mock("@/components/PhotoCarousel", () => ({ PhotoCarousel: () => null }));
vi.mock("@/components/daily/map/MapPreviewCard", () => ({ MapPreviewCard: () => null }));
vi.mock("@/lib/analytics", () => ({ events: { homeSaved: vi.fn() } }));
vi.mock("@/lib/saved-homes-client", () => ({
  useSavedHomes: () => ({ homes: [], add: vi.fn(), remove: vi.fn() }),
}));

import { DailyPlay } from "@/components/daily/DailyPlay";
import { DAILY_UNAVAILABLE_MESSAGE } from "@/lib/score-response";
import { listing, jsonResponse } from "../../../../test/score-409-mocks";

function renderDaily(onSubmit = vi.fn()) {
  render(
    <DailyPlay listing={listing("d1")} dailyNumber={42} dateET="2026-11-24"
      currentStreak={0} onSubmit={onSubmit} onExit={vi.fn()} />
  );
  return onSubmit;
}

describe("DailyPlay — /api/score 409", () => {
  it("shows a terminal 'unavailable' state and does not allow retrying the same home", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(409, { error: "listing not playable" }));
    vi.stubGlobal("fetch", fetchMock);
    const onSubmit = renderDaily();

    await userEvent.click(screen.getByRole("button", { name: /lock in my final answer/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(DAILY_UNAVAILABLE_MESSAGE);
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    const cta = screen.getByRole("button", { name: /unavailable today/i });
    expect(cta).toBeDisabled();
    await userEvent.click(cta);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the generic retry for non-409 failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, {})));
    renderDaily();
    await userEvent.click(screen.getByRole("button", { name: /lock in my final answer/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(screen.getByRole("button", { name: /lock in my final answer/i })).toBeEnabled();
  });
});
