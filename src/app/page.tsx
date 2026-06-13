import { LandingClient } from "@/components/LandingClient";
import { getRecentStats } from "@/lib/landing-stats";
import { getHeroPool, getTopScorer } from "@/lib/landing-data";
export type { RecentStats } from "@/lib/landing-stats";

// ISR — page is regenerated at most once per 60s. Cuts TTFB from ~600-1200ms
// (force-dynamic, every request hits DB) to ~50-100ms (edge-cached). Hero
// rotation still works because visitors in the same 60s window see the same
// hero, which is acceptable variety. SEO ranking factors LCP + TTFB; this
// helps both materially.
export const revalidate = 60;

export default async function HomePage() {
  // All three data sources are independently cached; running them in parallel
  // keeps landing TTFB tight even on a full cache miss.
  const [heroPool, topScorer, recentStats] = await Promise.all([
    getHeroPool(),
    getTopScorer(),
    getRecentStats(),
  ]);

  // Pick a random hero from the cached pool so visitors in the same 5-minute
  // cache window still see variety. Falls back to the LandingScreen's own
  // hard-coded photo if the pool is empty (DB error / no listings).
  const hero = heroPool.length > 0 ? heroPool[Math.floor(Math.random() * heroPool.length)] : null;

  return (
    <LandingClient
      heroPhotoUrl={hero?.photoUrl ?? null}
      heroLocation={hero ? { neighborhood: hero.neighborhood, city: hero.city, state: hero.state } : null}
      topScorer={topScorer}
      recentStats={recentStats}
    />
  );
}
