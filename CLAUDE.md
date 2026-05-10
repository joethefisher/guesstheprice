# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (watch mode)
npm run test:run         # Vitest (single run, no watch)

# Database
npm run db:setup         # Create initial SQLite migration
npm run db:seed          # Seed from data/sample-listings.json
npm run db:studio        # Prisma Studio UI
npm run db:reset         # Drop + reseed

# Ingestion pipeline
npm run ingest:plan                              # Stage 1 dry-run: print market distribution
npm run ingest:full                              # Full 5-stage pipeline
npm run ingest:full -- --quota=1000             # Custom quota
npm run ingest:full -- --markets=Austin,TX      # Single market
npm run ingest:full -- --dry-run                # Fetch only, no persist
npm run ingest:fetch -- --market=Austin,TX      # Stage 2 only
npm run ingest:normalize                        # Stage 3 only (reads .cache/raw/)
npm run ingest:mirror                           # Stage 4 only (reads .cache/normalized/)
npm run ingest:persist                          # Stage 5 only (reads .cache/mirrored/)
```

Run a single test file: `npx vitest run src/lib/ingestion/__tests__/quality.test.ts`

## Architecture

### Core principle
**Ingest once, serve forever.** The game runtime never calls any third-party API. All listings, photos, and sold prices live in Postgres with photos cached to Cloudflare R2. The ingestion pipeline is a batch job (nightly/weekly), not part of the request path.

### Frontend (Next.js App Router)

**Routes:**
- `/` — Landing (`src/app/page.tsx` + `src/components/LandingClient.tsx` + `src/components/LandingScreen.tsx`)
- `/play` — Full game loop: fetch listing → guess → reveal (`src/app/play/page.tsx`)
- `/play/summary` — End-of-game results, share card. Receives `?data=` JSON param from `/play`.
- `/saved` — Masonry grid of locally-persisted saved homes (`src/app/saved/page.tsx`)

**State management:** Client-only. No auth, no server state for game progress. `localStorage` keys:
- `pricetag_streak` — integer, incremented on game completion
- `pricetag_saved` — JSON array of `SavedHome` objects

**Component structure:**
- `src/components/Icons.tsx` — Custom SVG line icons (1.6–1.8 stroke). No icon libraries.
- `src/components/Wordmark.tsx` — SVG logo + italic Fraunces wordmark
- `src/components/GameChips.tsx` — `Stat`, `StreakFlame`, `RoundPill`, `TierBadge`
- `src/components/NumberTicker.tsx` — RAF-based count-up animation (ease-out cubic, 1100ms)
- `src/components/Confetti.tsx` — 80 mixed-shape pieces, only fires on "expert"/"nailed" tier
- `src/components/PhotoCarousel.tsx` — Framer Motion crossfade, dot pagination, keyboard arrows
- `src/components/PriceSlider.tsx` — Custom logarithmic slider ($50K–$20M), no HTML range input
- `src/components/RevealOverlay.tsx` — Modal with Framer Motion scale-in, NumberTicker actual price
- `src/components/LandingScreen.tsx` — Full-bleed hero, grain overlay, bottom stats strip

**Design system:** Tokens live in `tailwind.config.js` and mirrored as CSS custom props in `globals.css`. Fonts: Fraunces (variable, via `next/font/google`), General Sans (via Fontshare link tag), JetBrains Mono (via `next/font/google`). Use `--ease` and `--ease-out` CSS vars for animations, not Tailwind's default. Use `.tnum` class on all prices/scores.

### API Routes

- `GET /api/listings?exclude=id1,id2` — Returns a random listing without `soldPrice` or `streetAddress` (server-side stripped). Quality gate: `isActive: true, qualityScore >= 50`.
- `POST /api/score` — Body: `{ listingId, guess }`. Returns actual price, score, tier, reaction copy. Game state is client-only (localStorage); rounds are not persisted server-side.

Scoring lives in `src/lib/scoring.ts` — pure functions, well-tested. Do not change the scoring formula without updating the tests.

**Rate limiting**: `src/middleware.ts` applies Upstash sliding-window limits to both API routes (20 req/60s for score, 60 req/60s for listings). Gracefully disabled when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent.

### Ingestion Pipeline (5 stages)

Code lives in `src/lib/ingestion/`. Each stage is independently runnable via CLI scripts.

| Stage | File | Input | Output |
|---|---|---|---|
| 1. Discover | `stages/discover.ts` | `data/target-markets.json` | `MarketPlan[]` |
| 2. Fetch | `stages/fetch.ts` | `MarketPlan[]` + API key | `Map<market, RawListing[]>` + `.cache/raw/*.json` |
| 3. Normalize | `stages/normalize.ts` | Raw listings | `NormalizedListing[]` + `.cache/normalized/` |
| 4. Mirror | `stages/mirror.ts` | Normalized listings | `MirroredListing[]` + `.cache/mirrored/` + R2 uploads |
| 5. Persist | `stages/persist.ts` | Mirrored listings | Postgres upserts |

**Quality scoring** (`quality.ts`): 0–100 rubric. Hard reject if missing address/beds/price, price out of $50K–$50M range, or fewer than 3 photos. Listings with `qualityScore < 50` are in DB but excluded from runtime queries.

**Photo mirroring**: Sharp resizes to 1600w (display) + 400w (thumbnail) and uploads to R2 with `Cache-Control: immutable`. Dev mode (R2 not configured): uses source URLs directly.

**API source**: "Realty US" by ntd119 (`realty-us.p.rapidapi.com`). Endpoint: `GET /properties/search-buy`. Location slug format: `city:{state_lower}_{city_lower}` (e.g. `city:il_chicago`). Page-based pagination via `?page=N`, 20 results/page, hard cap at page 475 (offset 9500). Sold price in `last_sold_price` (top-level, only on resale listings — new construction is filtered out at fetch time).

**Caching**: Raw API responses cached to `.cache/raw/` with 30-day TTL. Re-running the pipeline reads from cache, not the API. This prevents burning RapidAPI quota.

**`IngestionRun` model** tracks every pipeline run (status, counts, error log) for observability. Check it via Prisma Studio or `SELECT * FROM IngestionRun ORDER BY startedAt DESC LIMIT 5;`.

### Data model highlights

The Prisma schema (`prisma/schema.prisma`) uses SQLite for dev. Switch `provider` to `"postgresql"` for production. Key design decisions:
- `Listing.soldPrice` is never sent to the client until after guess submission
- `Listing.streetAddress` is similarly held server-side until reveal
- `Photo.thumbnailUrl` is the 400w R2 URL; `Photo.sourceUrl` is the original third-party URL kept for debugging
- `Listing.qualityScore` is indexed with `isActive` for efficient random selection

### Infrastructure

**OG image**: `src/app/opengraph-image.tsx` — branded 1200×630 card served at `/opengraph-image`. `layout.tsx` metadata wires it up with `metadataBase`, `openGraph.images`, and `twitter.card`. No dependencies — uses `next/og` built into Next.js 14.

**Error tracking**: Sentry via `instrumentation.ts` (server + edge) and `instrumentation-client.ts` (browser). `src/app/global-error.tsx` catches React rendering errors. Wrapped in `next.config.js` via `withSentryConfig`. Requires `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (same value).

**Database connection**: Supabase transaction pooler (port 6543, `?pgbouncer=true`) with a Prisma singleton at `src/lib/db.ts`. `DIRECT_URL` (port 5432) is used only for `prisma migrate deploy`.

### Environment variables

See `.env.example`. Required for ingestion: `RAPIDAPI_KEY`. Optional (dev works without them):
- R2: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — mirror stage uses source URLs if absent
- Rate limiting: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — middleware is a no-op if absent
- Sentry: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` — errors are silently dropped if absent; `SENTRY_ORG`/`SENTRY_PROJECT` only needed for CI source map uploads
