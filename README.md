# Pricetag

A real-estate price-guessing game. Show real homes with photos and basic facts, players guess the price, score based on accuracy.

> "It's like Zillow surfing but it tells you when you're full of shit about real estate prices."

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Ingestion      │ ───▶ │  Local Database  │ ───▶ │  Game Runtime   │
│  (one-time/     │      │  (Prisma +       │      │  (Next.js App   │
│   periodic)     │      │   SQLite/PG)     │      │   Router)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
       ▲                                                    │
       │                                                    ▼
   Real estate APIs                                   Players
   (Realtor/Zillow                                    (no live API
    via RapidAPI)                                      calls)
```

Key decision: we **ingest once, serve forever**. No third-party API calls at game runtime. This makes per-game cost ~zero, gives us full control over latency, lets us curate quality, and insulates us from API breakage.

## Tech Stack

- **Next.js 14** (App Router, Server Components)
- **TypeScript**
- **Prisma** ORM with **SQLite** (swap to Postgres for production by changing `provider` in `schema.prisma`)
- **Tailwind CSS** with custom design tokens matching the brief
- **Fraunces** (display) + **General Sans** (body) per design brief
- **Zod** for validation

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Set up the database and seed with sample listings
npm run db:setup
npm run db:seed

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:setup` | Initialize Prisma schema, run migrations |
| `npm run db:seed` | Populate DB with the sample 20-home corpus |
| `npm run db:studio` | Open Prisma Studio to inspect data |
| `npm run ingest:rapidapi` | (Stub) Ingestion pipeline for RapidAPI sources |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── listings/route.ts      # GET random listing for round
│   │   └── score/route.ts         # POST guess, return score + actual
│   ├── play/page.tsx              # Game round UI
│   ├── play/summary/page.tsx      # End-of-game results
│   ├── layout.tsx
│   ├── page.tsx                   # Landing page
│   └── globals.css
├── components/
│   ├── PhotoCarousel.tsx
│   ├── PriceSlider.tsx
│   ├── PropertyFacts.tsx
│   ├── ResultReveal.tsx
│   └── ScoreBadge.tsx
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── scoring.ts                 # Pure scoring logic (well-tested)
│   └── reactions.ts               # Copy bank for accuracy tiers
prisma/
├── schema.prisma                  # DB schema
└── seed.ts                        # Seed script
scripts/
└── ingest.ts                      # Real ingestion entry point (stub)
data/
└── sample-listings.json           # 20-home seed corpus
docs/
└── DESIGN_BRIEF.md                # Full design brief for Claude Design
```

## Data Model

The schema is intentionally simple but extensible:

- **Listing** — the home itself (address, photos, facts, sale price)
- **Photo** — owned by a listing, ordered, with caption optional
- **Round** — a single guess in a game session
- **Game** — a session of N rounds (default 10)

See `prisma/schema.prisma` for full details.

## Scoring Logic

Scoring rewards proximity, not exact matches. A guess within 5% of actual price gets a near-perfect score; the curve drops off gracefully so even bad guesses get partial credit. See `src/lib/scoring.ts` for the pure function and unit tests.

```
score = max(0, 100 * (1 - error_pct))
where error_pct = min(1, abs(guess - actual) / actual)
```

So:
- $1.0M actual, $1.0M guess → 100 points
- $1.0M actual, $1.05M guess → 95 points
- $1.0M actual, $1.5M guess → 50 points
- $1.0M actual, $2.5M guess → 0 points

## Going to Production

To swap from SQLite to Postgres:

1. Change `prisma/schema.prisma` `datasource` provider to `postgresql`
2. Set `DATABASE_URL` to your Postgres connection string
3. Run `npx prisma migrate deploy`

To populate from real APIs, fill in `scripts/ingest.ts` with your RapidAPI/Realtor.com credentials. The schema is already shaped for the typical Realtor.com response.

## Next Steps (post-MVP)

- [ ] Daily challenge (same 5 homes for everyone, 24h window)
- [ ] Saved homes / favorites
- [ ] User accounts (optional, anonymous play default)
- [ ] Leaderboards
- [ ] Share card OG image generation
- [ ] Real ingestion pipeline (fill in `scripts/ingest.ts`)
- [ ] Photo CDN integration (S3 + CloudFront or R2)

## License

MIT (placeholder)
