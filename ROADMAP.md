# ROADMAP — open items from the overnight map build

Tracked as of 2026-05-18 overnight build (commit `feat(map): …`).

## 1. Missing design artifacts referenced in the brief

The integration brief referenced files that aren't in the repo. The build
proceeded with the integration spec (`design_handoff_pricetag/GOOGLE_MAPS_INTEGRATION.md`)
plus a generic illustrated renderer. Specific gaps:

- `src/daily/map.jsx` — referenced as the design-reference source for
  both A (`IllustratedMap`) and B (`GoogleStyleMap`). **Not present**.
  Reimplemented from the integration spec; no copy-paste was possible.
- `Daily Flow.html` sections **03b** and **03c** — referenced as the
  visual reference for the preview card + modal, plus the Charleston
  pre/post and Brooklyn pre/post illustrated states. **Not present** in
  the HTML or the design README. Visual decisions were made from the
  written spec alone.

**To unblock:** if Claude Design produced these and they're in a
different folder or branch, drop them in and I'll wire up the
city-specific presets and update visual details (the chip styling, the
exact hover treatment, mobile spacing) against the canvas.

## 2. Illustrated city presets — "needs illustrated map" list

The brief asked: "For each new city in the listings catalog that doesn't
have an illustrated map preset yet, register it in ROADMAP.md and fall
back to the Google variant for that listing."

**Status:** every city in the listings catalog is currently rendered
with the generic procedural-SVG `IllustratedMap`. There are zero
hand-drawn presets. The full list of cities present in the catalog
(from `data/target-markets.json`, deduped, ordered by tier weight):

Metro (highest weight):
- New York, NY · Los Angeles, CA · Chicago, IL · Houston, TX · Dallas, TX
- Miami, FL · Atlanta, GA · Boston, MA · Seattle, WA · Washington, DC
- Denver, CO · Phoenix, AZ · Philadelphia, PA · San Francisco, CA
- Minneapolis, MN · Portland, OR · Nashville, TN · Austin, TX
- San Diego, CA · Charlotte, NC · Brooklyn, NY

Secondary:
- Buffalo, NY · Memphis, TN · Tulsa, OK · Birmingham, AL · Des Moines, IA
- Columbus, OH · Pittsburgh, PA · Cleveland, OH · Indianapolis, IN
- Kansas City, MO · Richmond, VA · Raleigh, NC · Salt Lake City, UT
- New Orleans, LA · Detroit, MI · Albuquerque, NM · Louisville, KY
- Hartford, CT · Sacramento, CA · Tampa, FL · Orlando, FL · Las Vegas, NV
- San Antonio, TX · San Jose, CA · Baltimore, MD · Milwaukee, WI
- Oklahoma City, OK · Tucson, AZ · Omaha, NE · Boise, ID · Spokane, WA
- Baton Rouge, LA · Knoxville, TN · Greenville, SC · Chattanooga, TN
- Lexington, KY · Colorado Springs, CO · Fresno, CA

Luxury:
- Palm Beach, FL · Aspen, CO · Jackson, WY · Carmel, CA · Greenwich, CT
- Beverly Hills, CA · Malibu, CA · Scottsdale, AZ · Naples, FL
- Montecito, CA

**To unblock:** as hand-drawn presets are produced, register them in
`src/lib/map/config.ts` under `CITY_OVERRIDES` (or wherever the preset
registry ends up). Until then, the procedural illustrated renderer is
the default and Google can be enabled per-listing or globally via flag.

## 3. Google Maps API key

`NEXT_PUBLIC_GOOGLE_MAPS_KEY` is **not set** locally. The illustrated
variant is the default so this doesn't break anything, but the Google
variant won't work until:

1. A key is created in Google Cloud Console (Maps JavaScript API + Static Maps API)
2. The key is restricted by HTTP referrer (see GOOGLE_MAPS_INTEGRATION.md §1.1)
3. Billing alerts are set ($25/mo before doing anything else)
4. The key is added to `.env` and Vercel env vars
5. Optional: `NEXT_PUBLIC_GOOGLE_MAPS_ID` for the Cloud-based Map ID
   that holds the paper-palette style

The error boundary will swallow the missing-key error and fall back to
the illustrated variant gracefully if the flag is flipped without a
key — verified in `MapErrorBoundary.tsx`.

## 4. Circle primitive workaround in GoogleMapView

`@vis.gl/react-google-maps` does not export a `<Circle>` primitive
directly. The pre-submit halo is currently drawn with an
`<AdvancedMarker>` that wraps a translucent `<div>`. This works but
isn't pannable-rectified — the halo stays a fixed pixel size as the
user zooms.

Logged at `src/components/daily/map/GoogleMapView.tsx` with:
`TODO(map): switch to a proper Circle once @vis.gl/react-google-maps exposes one.`

To unblock: either upgrade the lib if a future version adds `Circle`,
or use `useMap()` to grab the raw `google.maps.Map` and call
`new google.maps.Circle()` imperatively in a `useEffect`.

## 5. Per-listing centroid precision

The pre-submit centroid is derived by snapping each listing's exact
lat/lng to a 0.01° grid (~1.1 km). For dense urban neighborhoods this
is roughly "blocks-away", which works. For sprawling listings this
might be too rough.

To unblock: at ingestion time, store a real neighborhood centroid as
its own column on the listing, and have `buildMapBlock` prefer it over
the snapped fallback. Out of scope for this overnight build.

## 6. middleware.ts → proxy.ts migration (Next 16)

Next 16 renamed the `middleware` file convention to `proxy`. The current
`src/middleware.ts` still works but emits a deprecation warning on every
`next build` and `next dev`. The runtime semantics also changed slightly
(proxy is conceptually a layer above middleware, with cleaner ordering
around rewrites).

To unblock: rename `src/middleware.ts` → `src/proxy.ts`, swap the export
signature per the codemod (`npx @next/codemod@latest middleware-to-proxy`),
re-verify the existing rate-limit matcher still fires.

Deferred because the security-pass session needs to ship without scope
creep. The deprecation warning is non-fatal in Next 16.x.

## 7. Migrate off next-auth beta when 5.x stable lands

`package.json` pins `next-auth: 5.0.0-beta.31` (exact, no caret). The beta
already bit us once — production hit `UnsupportedStrategy` because the
`session: { strategy: "jwt" }` line wasn't committed. Public users will
hit similar paper cuts.

The latest published version on npm is still `5.0.0-beta.31` as of this
writing. Stay pinned until Auth.js v5 ships stable, then upgrade in a
focused session: the migration touches the `auth()` helper signature
+ session callbacks + JWT/session strategy config and warrants its own
sign-in/sign-up smoke test.

JSON has no comment syntax, so this note lives here instead of in
`package.json`.

## 8. Locked-screen visual treatment

The brief said: "the preview card on subsequent views (e.g. the
locked-state screen) should re-render in revealed mode."

The locked screen is on a dark stage (`StageBackground`). A
paper-on-paper card looks wrong there. Shipped a dark "View map of
today's house" button under the streak summary that opens the modal in
revealed mode — same end behavior, fits the dark theme.

To unblock: if a paper preview card on dark is preferred, design a
dark variant of `MapPreviewCard` (the modal already works on any
backdrop because of its own dark overlay).
