// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NotifyMeControl } from "@/components/daily/NotifyMeControl";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  // fetch is what the component calls; per-test mock keeps behavior clear.
  vi.stubGlobal("fetch", vi.fn());
});

function mockFetchOk() {
  (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
  );
}

function mockFetch400(message = "Please enter a valid email address.") {
  (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: message }), { status: 400 }),
  );
}

describe("NotifyMeControl", () => {
  it("starts as the 'Notify me' button and expands to a form on click", async () => {
    render(<NotifyMeControl />);
    expect(screen.getByRole("button", { name: /notify me/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /notify me/i }));

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("posts the email + source to /api/notify/subscribe and shows the success state", async () => {
    mockFetchOk();
    render(<NotifyMeControl source="daily-locked" />);

    await userEvent.click(screen.getByRole("button", { name: /notify me/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), "jo@example.com");
    await userEvent.click(screen.getByRole("button", { name: /notify me/i }));

    await waitFor(() =>
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument(),
    );

    // Assert the exact request the component made.
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/notify/subscribe",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({ email: "jo@example.com", source: "daily-locked" }),
      }),
    );
  });

  it("surfaces the server's error message and keeps the form open on failure", async () => {
    // Valid client-side format (so HTML5 validation doesn't block submit),
    // but the server rejects it. We're testing the *server-error* branch,
    // not client-side field validation.
    mockFetch400("Couldn't save right now — try again in a moment.");
    render(<NotifyMeControl />);

    await userEvent.click(screen.getByRole("button", { name: /notify me/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), "jo@example.com");
    await userEvent.click(screen.getByRole("button", { name: /notify me/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't save/i),
    );
    // Form still open so the user can retry.
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByText(/you're on the list/i)).not.toBeInTheDocument();
  });
});
