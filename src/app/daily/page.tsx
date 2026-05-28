"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import "./daily.css";

import {
  loadStorage,
  saveStorage,
  getDailyEntryState,
  recordResult,
  checkMilestone,
  accuracyToBucket,
  type DailyStorage,
  type DailyResult,
} from "@/lib/daily/service";
import type { ListingPublic } from "@/lib/game";
import { readDailyCache } from "@/lib/prefetch";

import { DailyIntro } from "@/components/daily/DailyIntro";
import { DailyPlay } from "@/components/daily/DailyPlay";
import { DailyReveal } from "@/components/daily/DailyReveal";
import { DailyLocked } from "@/components/daily/DailyLocked";
import { DailyStats } from "@/components/daily/DailyStats";
import { DailyShare } from "@/components/daily/DailyShare";
import { DailyMilestone } from "@/components/daily/DailyMilestone";
import { DailyMapsProvider } from "@/components/daily/map/DailyMapsProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DailyRoute =
  | "loading"
  | "intro"
  | "play"
  | "reveal"
  | "milestone"
  | "stats"
  | "locked";

interface DailyListing {
  dailyNumber: number;
  dateET: string;
  listing: ListingPublic;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DailyPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [route, setRoute] = useState<DailyRoute>("loading");
  const [storage, setStorage] = useState<DailyStorage | null>(null);
  const [dailyData, setDailyData] = useState<DailyListing | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [milestoneThreshold, setMilestoneThreshold] = useState<number | null>(null);
  const [streakBroken, setStreakBroken] = useState(false);
  const syncedRef = useRef(false);

  const onExit = useCallback(() => router.push("/"), [router]);
  const onPractice = useCallback(() => router.push("/play"), [router]);

  const syncToServer = useCallback((s: DailyStorage) => {
    if (!session) return;
    fetch("/api/user/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }).catch(() => {});
  }, [session]);

  // Load state on mount (localStorage first pass)
  useEffect(() => {
    const stored = loadStorage();

    // Try the prefetched daily payload first — landing warms this on visit, so
    // most users arrive at /daily with it already in sessionStorage.
    const cached = readDailyCache<DailyListing>();
    if (cached?.listing) {
      setDailyData(cached);
    } else {
      fetch("/api/daily")
        .then((r) => r.json())
        .then((data) => {
          if (data.listing) setDailyData(data as DailyListing);
          else setFetchError(true);
        })
        .catch(() => setFetchError(true));
    }

    // If session is still loading, defer route decision to the session effect
    if (sessionStatus === "loading") {
      setStorage(stored);
      return;
    }

    // No session — use localStorage directly
    applyStorage(stored);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once session resolves, sync from server if authenticated
  useEffect(() => {
    if (sessionStatus === "loading" || syncedRef.current) return;
    syncedRef.current = true;

    const localStored = loadStorage();

    if (!session) {
      // Not signed in — use localStorage
      applyStorage(localStored);
      return;
    }

    // Signed in — try to get server state
    fetch("/api/user/daily")
      .then((r) => r.json())
      .then((serverData) => {
        if (serverData && serverData.played != null) {
          // Server has data — use it as source of truth
          const merged: DailyStorage = {
            version: 1,
            lastPlayedDateET: serverData.lastPlayedDateET ?? null,
            lastResult: serverData.lastResult ?? null,
            currentStreak: serverData.currentStreak ?? 0,
            bestStreak: serverData.bestStreak ?? 0,
            played: serverData.played ?? 0,
            history: serverData.history ?? [],
            distribution: serverData.distribution ?? { "90+": 0, "80": 0, "70": 0, "60": 0, "50": 0, "<50": 0 },
          };
          saveStorage(merged);
          applyStorage(merged);
        } else if (localStored.played > 0) {
          // Server has no data but local does — migrate
          syncToServer(localStored);
          applyStorage(localStored);
        } else {
          applyStorage(localStored);
        }
      })
      .catch(() => applyStorage(localStored));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  function applyStorage(stored: DailyStorage) {
    setStorage(stored);
    const entryState = getDailyEntryState(stored);
    if (entryState.type === "locked") {
      if (stored.lastResult) setResult(stored.lastResult);
      setRoute("locked");
    } else {
      setStreakBroken(entryState.streakBroken);
      if (entryState.streakBroken) {
        const reset = { ...stored, currentStreak: 0 };
        saveStorage(reset);
        setStorage(reset);
      }
      setRoute("intro");
    }
  }

  // Handle guess submission from DailyPlay
  const handleSubmit = useCallback(
    (guess: number, scoreResponse: {
      actualPrice: number;
      score: number;
      errorPct: number;
      streetAddress: string;
      exact?: { lat: number; lng: number } | null;
    }) => {
      if (!dailyData || !storage) return;

      const accuracy = Math.round((1 - Math.min(1, scoreResponse.errorPct)) * 100);
      const bucket = accuracyToBucket(accuracy);

      const newResult: DailyResult = {
        listingId: dailyData.listing.id,
        guess,
        actual: scoreResponse.actualPrice,
        accuracy,
        pctOff: scoreResponse.errorPct,
        bucket,
        submittedAt: Date.now(),
        dailyNumber: dailyData.dailyNumber,
        streetAddress: scoreResponse.streetAddress,
        city: dailyData.listing.city,
        state: dailyData.listing.state,
        photoUrl: dailyData.listing.photos[0]?.url ?? "",
        exact: scoreResponse.exact ?? null,
      };

      const oldStreak = storage.currentStreak;
      const updated = recordResult(storage, newResult);
      const milestone = checkMilestone(oldStreak, updated.currentStreak);

      setResult(newResult);
      setStorage(updated);
      syncToServer(updated);

      if (milestone) {
        setMilestoneThreshold(milestone);
        setRoute("reveal");
        // milestone fires after reveal — DailyReveal calls onMilestone
      } else {
        setRoute("reveal");
      }
    },
    [dailyData, storage]
  );

  const handleRevealToMilestone = useCallback(() => {
    if (milestoneThreshold) setRoute("milestone");
    else setRoute("stats");
  }, [milestoneThreshold]);

  // Loading / error states
  if (route === "loading") {
    return (
      <div className="stage-bg fixed inset-0 grid place-items-center">
        <div className="text-paper-40 text-sm font-mono">
          Loading today's house…
        </div>
      </div>
    );
  }

  if (fetchError && route !== "locked" && route !== "stats") {
    return (
      <div className="fixed inset-0 grid place-items-center" style={{ background: "#15110d" }}>
        <div className="text-center text-paper">
          <div className="display text-3xl mb-4">Couldn't load today's house.</div>
          <button className="btn btn-primary" onClick={onExit}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <DailyMapsProvider>
    <div className="fixed inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {route === "intro" && (
          <Slide key="intro">
            <DailyIntro
              dailyNumber={dailyData?.dailyNumber ?? 1}
              dateET={dailyData?.dateET ?? ""}
              currentStreak={storage?.currentStreak ?? 0}
              streakBroken={streakBroken}
              onBegin={() => setRoute("play")}
              onExit={onExit}
            />
          </Slide>
        )}

        {route === "play" && dailyData && (
          <Slide key="play">
            <DailyPlay
              listing={dailyData.listing}
              dailyNumber={dailyData.dailyNumber}
              dateET={dailyData.dateET}
              currentStreak={storage?.currentStreak ?? 0}
              onSubmit={handleSubmit}
              onExit={onExit}
            />
          </Slide>
        )}

        {route === "reveal" && result && dailyData && storage && (
          <Slide key="reveal">
            <DailyReveal
              result={result}
              listing={dailyData.listing}
              dailyNumber={dailyData.dailyNumber}
              newStreak={storage.currentStreak}
              onShare={() => setShowShare(true)}
              onContinue={handleRevealToMilestone}
              onPractice={onPractice}
              onExit={onExit}
            />
            {showShare && (
              <DailyShare
                result={result}
                storage={storage}
                dailyNumber={dailyData.dailyNumber}
                listing={dailyData.listing}
                onClose={() => setShowShare(false)}
              />
            )}
          </Slide>
        )}

        {route === "milestone" && storage && milestoneThreshold && (
          <Slide key="milestone">
            <DailyMilestone
              threshold={milestoneThreshold}
              streak={storage.currentStreak}
              avgAccuracy={storage.played > 0
                ? Math.round(storage.history.filter((v) => v !== null).reduce((a, b) => a + (b ?? 0), 0) / storage.history.filter((v) => v !== null).length)
                : 0}
              onContinue={() => setRoute("stats")}
            />
          </Slide>
        )}

        {route === "stats" && storage && (
          <Slide key="stats">
            <DailyStats
              storage={storage}
              dailyNumber={dailyData?.dailyNumber ?? 1}
              onExit={onExit}
            />
          </Slide>
        )}

        {route === "locked" && storage && (
          <Slide key="locked">
            <DailyLocked
              result={result}
              storage={storage}
              dailyNumber={dailyData?.dailyNumber ?? 1}
              listing={dailyData?.listing ?? null}
              onPractice={onPractice}
              onStats={() => setRoute("stats")}
              onExit={onExit}
            />
          </Slide>
        )}
      </AnimatePresence>
    </div>
    </DailyMapsProvider>
  );
}

// Simple fade-through slide wrapper
function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}
