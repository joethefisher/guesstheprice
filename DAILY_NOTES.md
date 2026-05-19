# Daily map — operational notes

Quick reference for the neighborhood map feature added to the daily
play screen.

## Provider flag

Two providers exist:
- **`illustrated`** (default) — paper-styled SVG, no API cost.
- **`google`** — real Google Maps via `@vis.gl/react-google-maps`.

Flip globally:
```bash
# .env / .env.local / Vercel env
NEXT_PUBLIC_DAILY_MAP_PROVIDER=google
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...
NEXT_PUBLIC_GOOGLE_MAPS_ID=...     # optional, for the paper-palette style
```

Flip per-city: edit `CITY_OVERRIDES` in `src/lib/map/config.ts`.
Cities present in the override map win over the global flag. Use this
for cities that have hand-drawn illustrated presets (keep them on
`illustrated`) or that look bad with the generic procedural renderer
(force them to `google`).

If the Google variant errors at runtime — missing key, referrer
blocked, quota exhausted, "for development purposes only" watermark —
`MapErrorBoundary` swallows the error and the illustrated variant
renders instead. Failures are logged to Sentry if Sentry is wired.

## Adding a new illustrated city preset

The current illustrated renderer is procedural — seeded by listing ID.
That gives every city in the catalog a usable map without per-city
work. Hand-drawn presets aren't shipped yet (see BLOCKERS.md #2).

When the design team produces a hand-drawn preset for a city:

1. Add the SVG art as its own component, e.g.
   `src/components/daily/map/presets/CharlestonMap.tsx`.
2. Register it in a preset registry keyed by `${city}|${state}`
   (lower-case). The dispatch in `IllustratedMap` should check the
   registry before falling through to the procedural generator.
3. The preset gets the same props as `IllustratedMap` (`revealed`,
   `centroid`, `exact`, `mode`) so the pre-submit halo / post-reveal
   pin overlay logic stays uniform.

## Network payload contract (most-critical part of the feature)

**Pre-submit (sent to the client when the daily listing loads):**
```ts
{
  id, neighborhood, city, state, beds, baths, sqft, …,
  map: {
    centroid: { lat, lng },   // snapped to a 0.01° grid, ~1.1 km accurate
    zoom: 14
  }
  // NO `latitude`, NO `longitude`, NO `streetAddress` — those are
  // server-only until the user submits a guess.
}
```

**Post-submit (returned by /api/score):**
```ts
{
  actualPrice, score, errorPct, tier, reaction, subReaction,
  streetAddress,
  exact: { lat, lng } | null
}
```

The exact lat/lng is **never** included in the initial payload. A
cheater inspecting network responses on the play screen sees only the
snapped centroid; they would have to submit a guess to learn the exact
coords. The score endpoint reveals everything in one round-trip.

Verified routes that strip exact coords from pre-submit:
- `src/app/api/daily/route.ts`
- `src/app/api/listings/route.ts`
- `src/app/api/listings/batch/route.ts`

The exact coords are returned from `src/app/api/score/route.ts`.

## Manual test plan

### Pre-guess (play screen)
1. Open `/daily` while signed in (or fresh localStorage).
2. Pass the intro → land on the play screen.
3. Confirm the **map preview card** sits between the warning band and
   the lock-in CTA. Eyebrow reads `APPROX. AREA`. Hover lifts the
   border to `var(--ink)` and adds a shadow.
4. Click → modal scales in (~320ms). Header eyebrow is muted
   (`APPROX. AREA`). Body shows the area circle, no pin. Pre-submit
   pill reads "Exact location reveals after you lock in." Legend chips
   for Park / Water / Arterial / Area. Close X is accent orange with
   white glyph; hover deepens to `var(--accent-deep)`. Esc closes.
5. With dev tools open: confirm `/api/daily` response body has
   `map.centroid` but no `latitude` / `longitude` / `streetAddress`.

### Post-reveal (locked screen)
1. Submit a guess. Daily flow moves to reveal → milestone/stats.
2. Re-open `/daily` after submission. You land on the **locked** state.
3. Scroll right-column to the streak summary. The "View map of today's
   house" button appears under it (dark style, location-pin icon).
4. Click → modal opens in **revealed** mode. Header eyebrow is accent
   orange (`EXACT LOCATION`). Body shows the pin at the exact coords
   (from `result.exact`). The bottom-left address card shows the
   listing's street address.

### Mobile (<480px)
1. Resize the viewport to 375w or use device emulation.
2. Preview card collapses to `88px·1fr·32px`; the chip shows only the
   icon, no "View map" label.
3. Open the modal. It fills the viewport (no border-radius, no max
   bounds). Try a two-finger pinch on the map body. Verify the page
   underneath does NOT pinch-zoom.

### Provider flip (Google variant)
1. Add a key to `.env`:
   ```
   NEXT_PUBLIC_DAILY_MAP_PROVIDER=google
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...
   ```
2. Restart dev server.
3. Preview thumbnail now hits the Static Maps API (look for the
   `maps.googleapis.com/maps/api/staticmap` request in network tab).
4. Open the modal — interactive JS map loads. Street View pegman,
   map-type switcher, fullscreen control are all absent (those leak
   the answer). Clicking a POI label does NOT open a place card.
5. Pre-submit: no marker. Post-reveal: orange price-tag pin.
6. Unset the key while leaving the flag on `google` → preview falls
   back to the illustrated variant via the error boundary. No broken
   map ever renders.

## Files that matter

- `src/lib/map.ts` — `MapBlock` type, centroid snapping
- `src/lib/map/config.ts` — flag resolution + per-city overrides
- `src/lib/map/style.ts` — paper-palette Google style (JS + Static)
- `src/components/daily/map/`
  - `MapPreviewCard.tsx` — inline card under the warning band
  - `MapExpandedModal.tsx` — centered modal w/ header/body/legend
  - `MapRenderer.tsx` — dispatches A vs B
  - `MapErrorBoundary.tsx` — Google → illustrated fallback
  - `IllustratedMap.tsx` — variant A, deterministic SVG
  - `GoogleMapView.tsx` — variant B
  - `DailyMapsProvider.tsx` — wraps `/daily` with `APIProvider`
  - `map.css` — responsive overrides + focus rings
