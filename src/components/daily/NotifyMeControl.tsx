"use client";

import { useState } from "react";

/**
 * Small opt-in control shown on DailyLocked. Captures an email into the
 * NotifyWaitlist table. Sending is a follow-up — this endpoint just
 * banks intent (see /api/notify/subscribe).
 *
 * States: idle (button) → input (email field + submit) → submitting →
 * success (persistent "you're in" state) OR error (returns to input).
 */
type Mode = "idle" | "input" | "submitting" | "success" | "error";

interface Props {
  /** Source tag persisted with the row — helps distinguish opt-ins by
   *  surface later without needing a full analytics event. */
  source?: string;
}

export function NotifyMeControl({ source = "daily-locked" }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (mode === "success") {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-3 text-sm rounded-[10px] bg-[rgba(46,111,74,0.18)] text-emerald"
        style={{ boxShadow: "inset 0 0 0 1px rgba(46,111,74,0.4)" }}
        role="status"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12l4 4 10-10" />
        </svg>
        You&apos;re on the list
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <button
        type="button"
        className="btn px-4 py-3 text-sm rounded-[10px] bg-[rgba(247,244,238,0.1)] text-paper"
        style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.25)" }}
        onClick={() => setMode("input")}
      >
        Notify me
      </button>
    );
  }

  const submitting = mode === "submitting";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMode("submitting");
    try {
      const res = await fetch("/api/notify/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const message =
          typeof body === "object" && body !== null && "error" in body
            ? String((body as { error: unknown }).error)
            : "Something went wrong. Try again in a moment.";
        setError(message);
        setMode("error");
        return;
      }
      setMode("success");
    } catch {
      setError("Network hiccup — try again.");
      setMode("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (mode === "error") setMode("input");
          }}
          disabled={submitting}
          aria-label="Email address"
          className="px-3 py-2.5 text-md rounded-[10px] bg-[rgba(247,244,238,0.08)] text-paper placeholder:text-paper-40 outline-none flex-1 min-w-0 sm:min-w-[220px] sm:flex-none"
          style={{ boxShadow: "inset 0 0 0 1px rgba(247,244,238,0.2)" }}
        />
        <button
          type="submit"
          disabled={submitting || email.length === 0}
          className="btn px-3 py-2.5 text-sm rounded-[10px] bg-spot text-ink font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "…" : "Notify me"}
        </button>
      </div>
      {error && (
        <div className="text-xs text-accent" role="alert">{error}</div>
      )}
    </form>
  );
}
