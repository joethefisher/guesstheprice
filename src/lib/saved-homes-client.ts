"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { SavedHome } from "@/lib/game";

const STORAGE_KEY = "pricetag_saved";

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota or disabled — best-effort persistence */
  }
}

function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readLocalStorage(): SavedHome[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedHome[];
  } catch {
    safeRemoveItem(STORAGE_KEY);
    return [];
  }
}

async function fetchServerHomes(): Promise<SavedHome[] | null> {
  try {
    const res = await fetch("/api/saved");
    if (!res.ok) return null;
    return (await res.json()) as SavedHome[];
  } catch {
    return null;
  }
}

/**
 * Hybrid persistence for saved homes.
 *
 * - **Anonymous**: read/write `localStorage["pricetag_saved"]`.
 * - **Signed in**: read/write `/api/saved/*`. On the first signed-in load, any
 *   localStorage entries that haven't yet been migrated are POSTed to
 *   `/api/saved/migrate`; on success the localStorage shadow is cleared.
 *
 * Optimistic updates: UI updates first, network follows. If the request fails
 * the next `useSavedHomes()` mount re-fetches and the optimistic state is
 * corrected.
 */
export function useSavedHomes() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const [homes, setHomes] = useState<SavedHome[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    async function load() {
      if (userId) {
        const serverHomes = (await fetchServerHomes()) ?? [];
        if (cancelled) return;

        const local = readLocalStorage();
        if (local.length === 0) {
          setHomes(serverHomes);
        } else {
          const serverIds = new Set(serverHomes.map((s) => s.listingId));
          const toMigrate = local.filter((l) => !serverIds.has(l.listingId));

          if (toMigrate.length === 0) {
            // localStorage is a stale shadow of what's already on the server.
            safeRemoveItem(STORAGE_KEY);
            setHomes(serverHomes);
          } else {
            let migrationOk = false;
            try {
              const res = await fetch("/api/saved/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: toMigrate.slice(0, 500).map((h) => ({
                    listingId: h.listingId,
                    guess: h.guess,
                    tier: h.tier,
                    accuracy: h.accuracy,
                    savedAt: h.savedAt,
                  })),
                }),
              });
              migrationOk = res.ok;
            } catch {
              migrationOk = false;
            }
            if (cancelled) return;

            if (migrationOk) {
              safeRemoveItem(STORAGE_KEY);
              const fresh = (await fetchServerHomes()) ?? serverHomes;
              if (!cancelled) setHomes(fresh);
            } else {
              // Migration failed: keep localStorage intact so a future
              // mount can retry. Show whatever the server already had.
              setHomes(serverHomes);
            }
          }
        }
      } else {
        // Anonymous
        setHomes(readLocalStorage());
      }
      if (!cancelled) setReady(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, status]);

  const add = useCallback(
    async (home: SavedHome) => {
      setHomes((prev) => [home, ...prev.filter((h) => h.listingId !== home.listingId)]);
      if (userId) {
        try {
          await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: home.listingId,
              guess: home.guess,
              tier: home.tier,
              accuracy: home.accuracy,
            }),
          });
        } catch {
          /* keep optimistic state — next mount re-syncs */
        }
      } else {
        // Anonymous: persist to localStorage. Read current state via
        // functional update so we don't race with React batching.
        setHomes((prev) => {
          safeSetItem(STORAGE_KEY, JSON.stringify(prev));
          return prev;
        });
      }
    },
    [userId]
  );

  const remove = useCallback(
    async (listingId: string) => {
      setHomes((prev) => prev.filter((h) => h.listingId !== listingId));
      if (userId) {
        try {
          await fetch(`/api/saved/${encodeURIComponent(listingId)}`, { method: "DELETE" });
        } catch {
          /* keep optimistic state */
        }
      } else {
        setHomes((prev) => {
          safeSetItem(STORAGE_KEY, JSON.stringify(prev));
          return prev;
        });
      }
    },
    [userId]
  );

  return { homes, add, remove, ready, signedIn: !!userId };
}
