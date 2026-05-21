# Guesstheprice

A real-estate price-guessing game. You see a real home — photos, beds, baths, square footage — and guess what it sold for. The closer you get, the higher you score. Ten rounds per game.

Think GeoGuessr, but for the housing market.

**Live at [guesstheprice.ai](https://guesstheprice.ai)**

## Features

- **10-round game loop** with a logarithmic price slider ($50K–$20M) and manual entry
- **Reveal moment** with animated number ticker, accuracy tier, and reaction copy
- **Saved homes** persisted to localStorage with masonry browsing
- **Streaks** across sessions
- **Shareable score cards** with Wordle-style emoji grids
- **Ingestion pipeline** that fetches, normalizes, and caches real listings from the Realtor.com API
- **Photo mirroring** to Cloudflare R2 (resized variants with immutable cache headers)
- **Rate limiting** via Upstash Redis on public API routes
- **Error tracking** via Sentry (server, edge, and browser)
- **Open Graph share images** generated on-demand with `next/og`

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) via Prisma |
| Auth | NextAuth v5 (beta — see note below) with credentials + JWT sessions |
| Styling | Tailwind CSS with a custom token system |
| Animation | Framer Motion |
| Maps | `@vis.gl/react-google-maps` + Google Maps Static API |
| Photo storage | Cloudflare R2 |
| Rate limiting | Upstash Redis |
| Observability | Sentry |
| Testing | Vitest |
| Validation | Zod |

> **NextAuth v5 is currently in beta** (`5.0.0-beta.31` at time of writing).
> The API is stable enough for production but breaking changes can still
> land in subsequent betas. The version in `package.json` is pinned to an
> exact tag for that reason; consult the
> [v5 migration notes](https://authjs.dev/getting-started/migrating-to-v5)
> before upgrading.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <repo-url>
cd guesstheprice
npm install
```

### Run locally

```bash
npm run db:setup    # initialize Prisma schema and migrations
npm run db:seed     # populate with sample listings
npm run dev         # start dev server on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and play.

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need. Everything except the database URL is optional for local development — features degrade gracefully when keys are missing.

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection (use pooled URL in prod) | Yes |
| `DIRECT_URL` | Direct Postgres connection for migrations | Prod only |
| `RAPIDAPI_KEY` | Realtor.com API access for the ingestion pipeline | Ingestion only |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cloudflare R2 for photo mirroring | Optional |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis for rate limiting | Optional |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | Optional |

## Architecture

Guesstheprice follows an **ingest-once, serve-forever** model. No third-party API is called at game runtime — every listing, photo, and sold price is already in our database.

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Ingestion    │ ──▶ │   Postgres    │ ──▶ │  Game Runtime │
│  (batch job)  │     │   + R2 CDN    │     │  (Next.js)    │
└───────────────┘     └───────────────┘     └───────────────┘
       ▲                                            │
       │                                            ▼
  Realtor.com API                                Players
```

This decision gives us predictable per-game costs, full control over latency, the ability to curate quality, and insulation from upstream API breakage.

### Ingestion pipeline

Five independently-runnable stages, with raw responses cached to disk on a 30-day TTL to avoid burning API quota:

1. **Discover** — read target markets, build a fetch plan
2. **Fetch** — page the Realtor.com API, cache responses
3. **Normalize** — map to a clean internal schema, score quality (0–100)
4. **Mirror** — resize photos with Sharp, upload to R2
5. **Persist** — upsert into Postgres

Each run is tracked in the `IngestionRun` table for observability.

### Scoring

```
score = max(0, 100 × (1 − error_pct))
error_pct = min(1, |guess − actual| / actual)
```

| Guess vs. actual | Score |
|---|---|
| Exact | 100 |
| Within 5% | 95 |
| Within 15% (Solid) | 85 |
| Within 30% (Ballpark) | 70 |
| 50% off | 50 |
| 2× off | 0 |

Pure functions in [src/lib/scoring.ts](src/lib/scoring.ts), backed by unit tests.

## Scripts

```bash
# Dev
npm run dev              # Next.js dev server
npm run build            # production build
npm run lint             # ESLint
npm run test             # Vitest (watch)
npm run test:run         # Vitest (single run)

# Database
npm run db:setup         # initial migration
npm run db:seed          # seed sample listings
npm run db:studio        # Prisma Studio
npm run db:reset         # drop + reseed

# Ingestion
npm run ingest:plan                          # dry-run, print market distribution
npm run ingest:full                          # full 5-stage pipeline
npm run ingest:full -- --quota=1000          # custom quota
npm run ingest:full -- --markets=Austin,TX   # single market
npm run ingest:full -- --dry-run             # fetch only, no persist
npm run ingest:fetch -- --market=Austin,TX   # stage 2 only
npm run ingest:normalize                     # stage 3 only
npm run ingest:mirror                        # stage 4 only
npm run ingest:persist                       # stage 5 only
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── api/
│   ├── play/             # Game round + summary
│   ├── saved/            # Saved homes
│   └── opengraph-image.tsx
├── components/           # UI primitives (Wordmark, PriceSlider, PhotoCarousel, …)
├── lib/
│   ├── ingestion/        # 5-stage pipeline
│   ├── scoring.ts        # pure scoring functions
│   └── db.ts             # Prisma singleton
├── middleware.ts         # Upstash rate limiting
prisma/
├── schema.prisma
└── seed.ts
scripts/                  # ingestion CLI entry points
data/
└── sample-listings.json
```

## Testing

```bash
npm run test:run
npx vitest run src/lib/ingestion/__tests__/quality.test.ts   # single file
```

Scoring logic and ingestion quality gating are the priority test surfaces — both are pure functions with deterministic inputs.

## Deployment

Guesstheprice is built for Vercel + Supabase + Cloudflare R2.

1. Provision a Postgres database and set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. Run migrations: `npx prisma migrate deploy`.
3. Configure R2, Upstash, and Sentry env vars in the Vercel project.
4. Run an ingestion job once to seed real listings: `npm run ingest:full`.
5. Deploy.

## License

MIT
