import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  // Live count of available listings, displayed in subhead
  const listingCount = await prisma.listing.count({
    where: { isActive: true }
  });

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 md:px-10 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          Pricetag<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/play" className="hover:text-accent transition-colors">
            Play
          </Link>
          <span className="text-ink/30">·</span>
          <span className="caption text-ink/50">Daily soon</span>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 px-6 md:px-10 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full">
        {/* Left: type-driven hero */}
        <div className="space-y-8">
          <p className="caption text-ink/60">A real estate guessing game</p>
          <h1 className="font-display text-display-l md:text-display-xl font-semibold leading-[0.95] tracking-tight">
            Guess
            <br />
            the
            <br />
            <span className="italic text-accent">home.</span>
          </h1>
          <p className="text-lg md:text-xl text-ink/70 max-w-md leading-relaxed">
            Real photos. Real homes. Real sold prices. How close can you actually get?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/play"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent text-paper font-semibold rounded-xl hover:bg-ink transition-all duration-300 ease-snappy hover:scale-[1.02] active:scale-[0.98] shadow-card text-lg"
            >
              Play now →
            </Link>
            <button
              disabled
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-ink/20 text-ink/40 font-semibold rounded-xl cursor-not-allowed text-lg"
              aria-label="Daily challenge coming soon"
            >
              Daily challenge
              <span className="ml-2 caption text-ink/30">soon</span>
            </button>
          </div>

          <div className="pt-8 flex items-center gap-3 text-sm text-ink/50">
            <span className="inline-block w-2 h-2 rounded-full bg-moss animate-pulse" />
            <span className="tnum">{listingCount.toLocaleString()}</span> homes loaded
            <span className="text-ink/30">·</span>
            <span>10 rounds per game</span>
          </div>
        </div>

        {/* Right: layered photo collage */}
        <div className="relative aspect-[4/5] md:aspect-square hidden md:block">
          <div className="absolute inset-0 -rotate-3 rounded-2xl overflow-hidden shadow-lift bg-cream">
            <img
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 translate-x-12 translate-y-12 rotate-2 rounded-2xl overflow-hidden shadow-lift bg-cream">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 translate-x-24 translate-y-24 -rotate-1 rounded-2xl overflow-hidden shadow-lift bg-cream">
            <img
              src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200"
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Mock price tag overlay */}
            <div className="absolute bottom-6 left-6 bg-paper px-4 py-2 rounded-full shadow-card">
              <span className="caption text-ink/50">Your guess</span>
              <div className="font-display text-2xl font-semibold tnum">$1,250,000</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <footer className="px-6 md:px-10 py-6 border-t border-ink/10 flex items-center justify-between text-sm text-ink/50">
        <span>© Pricetag 2026 — a game, not a tool.</span>
        <span className="caption">v0.1 · prototype</span>
      </footer>
    </main>
  );
}
