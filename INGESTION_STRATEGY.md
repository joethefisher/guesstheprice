# Pricetag — Ingestion Strategy & Claude Code Work Order

**Audience:** Claude Code (or any engineer) who will build the ingestion pipeline.
**Repo:** the existing Pricetag prototype, which already has the schema, seed flow, and stub at `scripts/ingest.ts`.
**Goal:** Replace the seed corpus with a real, refreshable corpus of 5,000 to 25,000 sold-home listings sourced from a third-party API, ready to power the game in production.

---

## 1. Strategic Context

The prototype was built around one architectural commitment: **ingest once, serve forever**. We do not call any third-party real estate API at game runtime. All listings, photos, and answers live in our own Postgres database with photos cached to our own object storage.

This matters because:
- Per-game cost stays at ~zero (a database read)
- Latency is fully under our control
- API breakage or pricing changes don't take down the game
- We control quality through curation
- Caching photos protects us from third-party CDN expiring URLs

The ingestion pipeline is therefore a **batch, periodic job** — not a live request path. It runs nightly or weekly, fills/refreshes our DB and storage, and the game runtime never knows the API exists.

Recently-sold homes are the right data target. Sold prices are settled facts (no arguments about Zestimate accuracy), photos are usually still hosted, and the 12-to-24-month-old listings make great game content because the price is fixed and reliable.

---

## 2. Source Selection

The prototype's `scripts/ingest.ts` was written against a generic Realtor.com-shaped endpoint. For production, evaluate and pick **one** primary source from the table below. All are accessed through RapidAPI's marketplace, which handles billing and key management.

| Provider | Endpoint pattern | Strengths | Weaknesses |
|---|---|---|---|
| **Realtor Search** (ntd119) | `realtor-search.p.rapidapi.com` | Active maintenance, sold listings supported, photos included | Closed-source scraper, can break |
| **Realty in US (apidojo)** | `realtor.p.rapidapi.com/properties/v2/list-sold` | Long-running, 200/request limit, well-documented. Listing name on RapidAPI is "Realty in US"; host header retains the original `realtor.p.rapidapi.com`. URL: https://rapidapi.com/apidojo/api/realty-in-us/ | Older schema, sometimes lags on photos. Hard cap on pagination at ~offset 9500 per city query (provider confirmed) |
| **Realtor16** (s.mahmoud97) | `realtor16.p.rapidapi.com` | Often cheaper tiers | Less feature-complete |
| **Zillow API** (apimaker) | `zillow-com1.p.rapidapi.com` | Includes Zestimates, historical data | Higher rate of broken listings, more expensive |

**Recommendation: start with apidojo's "Realty in US" endpoint** (RapidAPI listing: https://rapidapi.com/apidojo/api/realty-in-us/, host header `realtor.p.rapidapi.com`). It has the most stable shape, returns up to 200 listings per call, supports `prop_status=recently_sold`, and includes photo arrays inline. The schema below assumes this provider; adapt field mappings if you choose differently.

**Cost expectation for a 10K-listing corpus:** roughly $30 to $150 one-time, depending on which RapidAPI tier you hit. Refresh every quarter is similar. Budget $50/month for the production tier on RapidAPI and you have headroom.

---

## 3. The Ingestion Pipeline — Five Stages

The pipeline is a five-stage pipeline. Each stage is independently testable and idempotent. Build them in order; each stage can be shipped before the next is started.

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ 1.       │   │ 2.       │   │ 3.       │   │ 4.       │   │ 5.       │
│ Discover │──▶│ Fetch    │──▶│ Normalize│──▶│ Mirror   │──▶│ Persist  │
│ targets  │   │ listings │   │ + score  │   │ photos   │   │ to DB    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
   (cities)      (raw JSON)      (clean obj)   (S3/R2)        (Postgres)
```

### Stage 1: Discover targets

**What:** Decide which cities/zip codes to pull listings from. We want geographic and price-band diversity for game variety.

**Implementation:** create a config file `data/target-markets.json` with ~50 markets:

```json
[
  { "city": "Austin", "state": "TX", "tier": "metro", "weight": 1.0 },
  { "city": "Buffalo", "state": "NY", "tier": "secondary", "weight": 0.6 },
  { "city": "Palm Beach", "state": "FL", "tier": "luxury", "weight": 0.3 },
  ...
]
```

Tiers exist so we can pull more from major metros and fewer from luxury micro-markets, keeping the corpus balanced. `weight` × per-run quota = listings to pull from that market this run.

The full list should include at least: 20 major metros (NY, LA, SF, Chicago, Houston, Dallas, Miami, Atlanta, Boston, Seattle, DC, Denver, Phoenix, Philadelphia, Minneapolis, Portland, Nashville, Austin, San Diego, Charlotte), 20 secondary cities for affordability variety (Buffalo, Memphis, Tulsa, Birmingham, Des Moines, Columbus, Pittsburgh, Cleveland, Indianapolis, Kansas City, etc.), and 10 luxury or distinctive markets (Palm Beach, Aspen, Jackson Hole, Carmel, Greenwich, Beverly Hills, etc.).

**Acceptance:** running `npm run ingest:plan` prints a planned listing distribution by market and price band, with a total target count.

### Stage 2: Fetch listings

**What:** Hit the API for each target market, paginate, and store raw JSON responses. Store raw responses on disk (or in S3) so re-runs of normalization don't burn API quota.

**Implementation notes:**
- Endpoint: `GET https://realtor.p.rapidapi.com/properties/v2/list-sold` with query params `city`, `state_code`, `limit=200`, `offset=N`, `sort=sold_date`
- Required headers: `x-rapidapi-key: <YOUR_KEY>` and `x-rapidapi-host: realtor.p.rapidapi.com`
- Paginate up to ~5 pages per market = 1000 listings/market max. Hard cap: do NOT paginate past offset 9500 on any city — the provider blocks it
- Persist each raw response to `.cache/raw/<city>-<state>-<offset>.json` keyed by request signature
- Re-runs check the cache first; only re-fetch if cache is older than the configured TTL (default 30 days)
- Respect rate limits: most RapidAPI tiers cap at 5-10 req/sec; add a `p-throttle` or simple `await sleep(200)` between calls
- Exponential backoff on 429/5xx with 3 retries

**Pseudocode:**

```typescript
async function fetchMarket(market: Market, perMarket: number) {
  const pages = Math.ceil(perMarket / 200);
  const all: RawListing[] = [];

  for (let page = 0; page < pages; page++) {
    const cacheKey = `${market.city}-${market.state}-${page * 200}.json`;
    const cached = await readCache(cacheKey);
    if (cached && !isStale(cached)) {
      all.push(...cached.results);
      continue;
    }

    const response = await fetchWithRetry({
      city: market.city,
      state_code: market.state,
      offset: page * 200,
      limit: 200,
      sort: "sold_date",
      prop_status: "recently_sold"
    });

    await writeCache(cacheKey, response);
    all.push(...response.results);
    await sleep(250); // rate-limit guard
  }

  return all;
}
```

**Acceptance:** running `npm run ingest:fetch -- --market=Austin,TX` writes raw JSON files to `.cache/raw/` and reports counts. Re-running with no cache TTL change does NOT hit the API again.

### Stage 3: Normalize + quality score

**What:** Transform raw provider-specific JSON into our internal `NormalizedListing` shape, and assign each a quality score (0-100) used for filtering at runtime.

**Why a separate stage:** if we change providers later, only this stage needs to be re-implemented. Stages 1, 2, 4, 5 stay identical.

**Normalized shape** (see `src/lib/ingestion/types.ts` to be created):

```typescript
interface NormalizedListing {
  externalId: string;          // provider's stable ID
  source: "realtor" | "zillow"; // provenance
  streetAddress: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  beds: number;
  baths: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  homeType?: string;
  soldPrice: number;
  soldDate?: Date;
  photos: { sourceUrl: string; width?: number; height?: number; ordering: number }[];
}
```

**Quality scoring rubric** (run during normalization, written to `Listing.qualityScore`):

| Criterion | Points |
|---|---|
| Has ≥5 photos | +20 |
| Has ≥10 photos | +10 |
| Has sqft | +10 |
| Has year built | +5 |
| Has lot size | +5 |
| Sold price in $100K-$15M range | +10 |
| Has neighborhood name | +10 |
| Has lat/long | +5 |
| Sold within last 24 months | +10 |
| Photos all from same domain (likely real listing photos) | +5 |
| **Reject (score=0) if:** | |
| Missing street address, beds, baths, OR sold price | |
| Sold price < $50K or > $50M (data error) | |
| Fewer than 3 photos | |
| Photo URLs don't return 200 on HEAD | |

Listings with score < 50 are persisted but excluded from runtime queries (see schema's `qualityScore` index).

**Acceptance:** running `npm run ingest:normalize` reads from `.cache/raw/`, writes normalized JSON to `.cache/normalized/`, and prints quality score distribution histogram.

### Stage 4: Mirror photos to our storage

**What:** For each normalized listing, download every photo URL and re-upload to our own S3-compatible bucket. Replace `sourceUrl` with our mirrored URL.

**Why:** third-party photo CDNs expire or change URLs. Mirroring once means the game doesn't break in 6 months when Realtor.com rotates their CDN keys.

**Implementation:**
- Use S3, Cloudflare R2 (cheaper, no egress fees), or Backblaze B2
- Path scheme: `listings/{externalId}/{ordering}.jpg`
- On download: check Content-Type, reject non-images and oversized files (>10MB)
- Resize and re-encode to two sizes: `1600w` (display) and `400w` (thumbnail). Use `sharp` library
- Store both, reference both in DB:
  ```typescript
  Photo {
    url: string;        // 1600w version
    thumbnailUrl: string; // 400w version
    width: int;
    height: int;
  }
  ```
- Set `Cache-Control: public, max-age=31536000, immutable` on uploads; URLs become permanent
- If a photo fails to mirror, skip it but don't fail the whole listing — drop quality score by 5 per missing photo

**Schema additions needed:** add `thumbnailUrl String?` to the Photo model, then `npx prisma migrate dev`.

**Acceptance:** running `npm run ingest:mirror` walks normalized listings, downloads + resizes + uploads photos, and writes a new `.cache/mirrored/` set with our URLs swapped in.

### Stage 5: Persist to DB

**What:** Upsert mirrored listings into Postgres. Idempotent on `externalId`.

**Implementation:** lifted directly from `prisma/seed.ts` with the upsert logic from `scripts/ingest.ts`, but reading from `.cache/mirrored/` instead of the live API. The work here is small; the heavy lifting was done in earlier stages.

Use a transaction per listing so partial failures don't leave orphan photos. Prisma:

```typescript
await prisma.$transaction(async (tx) => {
  await tx.photo.deleteMany({ where: { listing: { externalId: l.externalId } } });
  await tx.listing.upsert({
    where: { externalId: l.externalId },
    update: { /* fields */, qualityScore: l.qualityScore },
    create: { /* fields */, photos: { create: l.photos } }
  });
});
```

**Acceptance:** running `npm run ingest:persist` produces final DB state. Running it twice in a row is a no-op (idempotency).

---

## 4. Putting It Together: Orchestration

Add a top-level command that runs all five stages:

```bash
npm run ingest:full -- --markets=all --quota=10000
```

Internally calls stages 1→5. Stages can also run individually for debugging. Each stage logs to `logs/ingest-<timestamp>.log`.

Schedule with cron (or GitHub Actions):
- **Weekly:** quick refresh of top 10 markets (~500 new listings)
- **Quarterly:** full refresh of all 50 markets (~10K listings refreshed, new ones added)

---

## 5. Schema Changes Required

Beyond what already exists in `prisma/schema.prisma`, Claude Code needs to add:

```prisma
model Photo {
  id            String   @id @default(cuid())
  listing       Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  listingId     String
  url           String   // mirrored 1600w URL
  thumbnailUrl  String?  // mirrored 400w URL  ← NEW
  sourceUrl     String?  // original 3rd-party URL (for debugging) ← NEW
  width         Int?
  height        Int?
  ordering      Int      @default(0)
  caption       String?

  @@index([listingId, ordering])
}

model IngestionRun {  // ← ENTIRELY NEW
  id          String   @id @default(cuid())
  startedAt   DateTime @default(now())
  completedAt DateTime?
  status      String   // "running" | "success" | "failed"
  marketsRequested Int
  listingsFound    Int
  listingsIngested Int
  listingsSkipped  Int
  errorLog    String?  // truncated error details
}
```

`IngestionRun` is critical for observability. Without it, you have no idea whether last night's run worked.

---

## 6. Quality Controls in Production

Beyond per-listing scoring, add three runtime-facing safeguards:

1. **Listing rotation freshness.** Track when each listing was last shown in a game (`Listing.lastShownAt`). The random-listing endpoint should de-prioritize recently-shown listings so the same homes don't keep cycling.

2. **User reporting.** Add a "Report this listing" button on the result reveal modal. Pipes to a `Report` model. Trigger: bad photos, wrong price, weird artifact. Listings with ≥3 reports auto-deactivate (`isActive=false`).

3. **Price sanity bounds.** Hard floor: $75K. Hard ceiling: $25M. Anything outside is presumed data error and excluded from runtime queries even if `qualityScore` is high.

---

## 7. Legal & Terms-of-Service Posture

Be honest about what we're doing. The RapidAPI providers are running scrapers under the hood; using their API moves the risk to them, but it doesn't eliminate the question entirely.

Three things Claude Code should bake in:

1. **Strip personal data.** Listing agents, owner names, phone numbers, email addresses — drop everything except address, structural facts, photos, and price. Schema should not even have a column for them.

2. **Robots.txt deference.** If we ever add direct scraping of secondary sources (e.g. county records for verification), respect robots.txt.

3. **Attribution.** Add a small "Listings sourced from public records via Realtor.com" footer. Defensible, accurate, and reduces legal exposure if anyone notices.

For a serious commercial launch beyond MVP, the right move is to layer in a legitimate IDX feed (e.g. Bridge Interactive or Trestle from CoreLogic) alongside the scraper. That's a separate project, and not blocking for the prototype.

---

## 8. Cost Modeling

Concrete numbers for budgeting (May 2026 ranges, verify on RapidAPI before launching):

**Initial corpus build (10K listings):**
- API calls: ~50 markets × 5 pages = 250 calls. At ~$0.01-$0.05 per call on the Pro tier, that's $2.50-$12.50. Negligible.
- Photo storage: 10K listings × ~10 photos × ~200KB resized = ~20 GB. R2 at $0.015/GB/month = $0.30/month.
- Photo bandwidth (cached, so most reads hit browser cache): generous estimate $5-20/month at moderate traffic.

**Ongoing per quarter:**
- Refresh: similar to initial, ~$5-15
- Storage growth: linear

**RapidAPI subscription:** budget $30-100/month for the tier that gives you enough call volume. The exact tier depends on provider; the apidojo Realtor API has plans from $0 (free tier 50/month, useless) through $50/month (10K calls) to $500/month (unlimited, mostly overkill for our use case).

**Total monthly run-rate at 10K corpus refreshed quarterly: ~$50-120.** Almost all RapidAPI subscription. Storage and bandwidth are negligible at this scale.

Scaling to 100K corpus: same model, ~10× the API calls and storage, so ~$200-300/month. Still tractable.

---

## 9. Definition of Done

Claude Code's work is complete when:

- [ ] All five pipeline stages have passing unit tests
- [ ] `npm run ingest:full` end-to-end populates a real Postgres DB with 1000+ real listings (verified by a manual check that 10 random listings have valid photos and reasonable prices)
- [ ] Photos are mirrored to our S3/R2 bucket (verified by checking the bucket contents)
- [ ] `IngestionRun` records the run with stats
- [ ] Game runtime works end-to-end against the new corpus (no game-side code changes should be required)
- [ ] README updated with: how to set up the ingestion environment, how to run a full pipeline, how to schedule it, troubleshooting common issues
- [ ] Cost monitoring section in README: where to check RapidAPI usage, where to check storage costs
- [ ] At least 50 markets configured in `target-markets.json`

---

## 10. Stretch Goals (Don't Block on These)

Not required for v1 ingestion, but useful for v1.5:

1. **Geographic balancing.** Sample listings to ensure no single metro dominates the corpus more than 10%. Helps game variety.
2. **Price-band balancing.** Aim for distribution: 20% under $500K, 40% $500K-$1.5M, 25% $1.5M-$3M, 10% $3M-$10M, 5% over $10M. Adjust per-market quotas based on observed distributions.
3. **Photo deduplication.** Some listings reuse stock photos. Hash photos and skip listings with known stock-photo signatures.
4. **Data validation cross-check.** For luxury listings, cross-reference against county recorder data to confirm sale price. Reduces gaming risk if anyone tries to figure out our source.
5. **Ingestion dashboard.** A small admin page at `/admin/ingestion` showing recent `IngestionRun` records and basic corpus stats.

---

## 11. Files Claude Code Will Need to Create or Modify

```
prisma/
├── schema.prisma                     [MODIFY] add Photo.thumbnailUrl, Photo.sourceUrl, IngestionRun model
└── migrations/                       [CREATE] new migration for above

src/lib/ingestion/
├── types.ts                          [CREATE] NormalizedListing, RawListing, etc.
├── providers/
│   ├── realtor.ts                    [CREATE] apidojo provider impl (Stage 2 + 3 mappings)
│   └── README.md                     [CREATE] how to add new providers
├── stages/
│   ├── discover.ts                   [CREATE] Stage 1
│   ├── fetch.ts                      [CREATE] Stage 2
│   ├── normalize.ts                  [CREATE] Stage 3
│   ├── mirror.ts                     [CREATE] Stage 4 (uses sharp + AWS SDK or R2 client)
│   └── persist.ts                    [CREATE] Stage 5
├── quality.ts                        [CREATE] quality scoring rubric
├── cache.ts                          [CREATE] disk cache helpers
└── orchestrator.ts                   [CREATE] runs all stages

scripts/
├── ingest.ts                         [REPLACE] thin wrapper around orchestrator.ts
├── ingest-plan.ts                    [CREATE] Stage 1 dry-run printout
└── ingest-stage.ts                   [CREATE] run an individual stage by name

data/
└── target-markets.json               [CREATE] 50-market config

.env.example                          [MODIFY] add S3/R2 credentials, RAPIDAPI_KEY
package.json                          [MODIFY] add scripts: ingest:full, ingest:plan, ingest:fetch, etc. Add deps: sharp, @aws-sdk/client-s3 (or @cloudflare/r2-sdk), p-throttle

README.md                             [MODIFY] full ingestion section with setup, run, schedule, troubleshoot
```

Approximately 15 new files, ~3K lines of TypeScript. Realistic for one focused Claude Code session.

---

## 12. The Hand-Off

When Claude Code receives this doc, it should:

1. Read the existing prototype's `scripts/ingest.ts`, `prisma/schema.prisma`, and `data/sample-listings.json` first to understand the current shape.
2. Build stages 1, 2, 3 first and verify against the apidojo Realtor API with a single small market (e.g. Austin) before attempting to wire up photo mirroring.
3. Build Stage 4 (mirroring) next; this is the most failure-prone stage because it depends on external photo URLs and image processing.
4. Build Stage 5 (persist) last, since it's mechanical given the prior stages.
5. End-to-end test with a 100-listing pull before scaling up to 10K.
6. Verify the game still works against the new corpus by playing a full game in the dev environment.
7. Write the updated README section.
8. Open a PR with the cost projection updated based on actual API call volume observed.

If anything in this brief is ambiguous, the answer is in Section 1: ingest once, serve forever. Every design decision flows from that.
