# Guesstheprice

A real-estate price-guessing game. You see a real home — photos, beds, baths, square footage — and guess what it sold for. The closer you get, the higher you score. Five rounds per game, plus a Wordle-style daily home.

Think GeoGuessr, but for the housing market.

**Live at [guesstheprice.ai](https://guesstheprice.ai)**

## Features

- **5-round freeplay loop** with a logarithmic price slider ($50K–$20M) and manual entry
- **Daily home** — one Wordle-style house per day with streaks, shareable result, and recap modal
- **Reveal moment** with animated number ticker, accuracy tier, and reaction copy
- **User accounts** (NextAuth credentials + JWT) with a profile page and global leaderboard
- **Saved homes** with hybrid persistence — localStorage for anonymous play, Postgres-backed for signed-in users with cross-device sync
- **Shareable score cards** with Wordle-style emoji grids
- **Ingestion pipeline** that fetches, normalizes, and caches real listings from the Realtor.com API
- **Photo mirroring pipeline** ready for Cloudflare R2 (currently serves photos directly from the source CDN — see "Known limitations")
- **Rate limiting** via Upstash Redis on public API routes
- **Error tracking** via Sentry (server, edge, and browser)
- **Open Graph share images** generated on-demand with `next/og`

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) via Prisma |
| Auth | NextAuth v5 (beta — see note below) with credentials + JWT sessions |
| Styling | Tailwind CSS with a custom token system |
| Animation | Framer Motion |
| Maps | `@vis.gl/react-google-maps` + Google Maps Static API |
| Photo storage | Cloudflare R2 (pipeline ready; not wired in production yet) |
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
│   ├── api/              # /score, /listings, /daily, /saved, /auth, /leaderboard, …
│   ├── play/             # 5-round freeplay + summary
│   ├── daily/            # Wordle-style daily home
│   ├── saved/            # Saved homes (masonry browse)
│   ├── leaderboard/      # Global score leaderboard
│   ├── profile/          # Per-user stats
│   ├── auth/             # Sign-in / sign-up
│   └── opengraph-image.tsx
├── components/           # UI primitives (Wordmark, PriceSlider, PhotoCarousel, …)
├── lib/
│   ├── ingestion/        # 5-stage pipeline
│   ├── scoring.ts        # pure scoring functions
│   ├── saved-homes-client.ts # auth-aware persistence hook
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

## Known limitations

Things that are **intentionally** not done yet, documented here so contributors
and curious onlookers know we know.

- **No password recovery.** Signup doesn't collect an email address, and there's
  no password-reset flow. If you forget your password, the account is effectively
  dead. The signup page warns about this; we'll add an optional-email +
  recovery-token flow in a follow-up.
- **Streak leaderboard trusts client-submitted values.** `POST /api/user/daily`
  accepts `currentStreak`, `bestStreak`, and `played` from the browser. An
  anti-rollback check blocks *decreases* but a determined signed-in user can
  inflate their own values. This is a casual game, not an esport — recomputing
  these server-side from the user's `Round` history is tracked as a follow-up.
- **Usernames are public-by-design.** Signup returns "Username taken" with a
  409 specifically when a username collides. That allows enumeration, but the
  same set is already published via `/api/leaderboard`. The UX win is worth it.
- **CORS is not configured.** The API is intended for same-origin use; the
  Next.js default of "no `Access-Control-Allow-Origin`" applies. If someone
  needs to embed the API cross-origin, that's a separate decision.
- **No CSP.** `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-
  Options`, `Referrer-Policy`, and `Permissions-Policy` are set, but Content
  Security Policy isn't — it needs nonce wiring through the React tree.
- **R2 photo mirror isn't wired up yet.** The ingestion pipeline has a
  mirror stage (`src/lib/ingestion/stages/mirror.ts`) that resizes photos
  with Sharp and uploads to Cloudflare R2 if R2 env vars are set. They
  aren't — so the game currently serves photos straight from Realtor.com's
  `*.rdcpix.com` CDN. That works but depends on Realtor keeping those URLs
  live. Wiring R2 up is tracked in the Roadmap section below.

## Roadmap

Tracked as GitHub Issues — high-level summary:

- **Wire Cloudflare R2 for self-hosted photo serving.** The ingestion
  pipeline already supports it; the bucket and `photos.pricetag.app`
  CNAME aren't provisioned yet.
- **Migrate `middleware.ts` → `proxy.ts`.** Next 16 renamed the
  convention; current file still works but emits a deprecation warning.
- **Upgrade off `next-auth` 5.0.0-beta.31** when Auth.js v5 ships stable.
- **Server-compute daily streaks from `Round` history.** Today the
  endpoint trusts client-submitted values (documented under "Known
  limitations").
- **Add CSP with nonce wiring.** Other security headers are in place;
  CSP needs a per-page allow-list.

## License

MIT
