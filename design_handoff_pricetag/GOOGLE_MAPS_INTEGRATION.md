# Google Maps Integration — Neighborhood Map (Variant B)

## Context

The daily play screen has a neighborhood map preview. Two visual variants exist in the design canvas:

- **A · Illustrated** — Pricetag-native SVG illustration. **No API, no key, no quota.** Ship this first.
- **B · Google Maps** — Real Google Maps embedded. This document covers wiring up B.

The strong recommendation is to **ship A in v1** and only move to B if/when:
1. The illustrated maps stop scaling (you can't hand-author SVGs for every city in the listings catalog)
2. Users explicitly ask for real, zoomable, scrollable maps
3. You want the legitimacy halo of a recognized maps provider

A handles the first 50 cities easily and looks better. B adds operational overhead (billing, keys, quota alerts, legal compliance with Google Maps Terms of Service) for marginal user value.

If you've decided B is worth the cost, here is the full integration.

---

## 1. API setup

### 1.1 Create the API key
1. Console → **APIs & Services → Credentials → + Create Credentials → API key**
2. Restrict the key:
   - **Application restrictions**: HTTP referrers → `https://guesstheprice.ai/*`, `https://*.guesstheprice.ai/*`, `http://localhost:*/*`
   - **API restrictions**: only enable **Maps JavaScript API** (and **Geocoding API** if you don't already have lat/lng for each listing)

### 1.2 Enable the right APIs
At minimum:
- Maps JavaScript API
- Geocoding API (one-time conversion of addresses → lat/lng; do this at listing-ingestion time, not runtime, to keep costs near zero)

Do **not** enable Street View or Places API unless a feature explicitly needs them — every enabled API expands the attack surface of a leaked key.

### 1.3 Cost guardrails
- Set a billing alert at **$25/mo** before doing anything else.
- The MapsJS dynamic API is ~$7 / 1000 map loads after the free tier. With a daily mode (one map per user per day), 100K daily users = ~$700/mo. **Static Maps API is $2 / 1000 and renders as a PNG** — use this for the preview card; reserve dynamic JS Maps for the expanded modal where pan/zoom matters.

### 1.4 Where the key lives
- Frontend env var: `VITE_GOOGLE_MAPS_KEY` (or `NEXT_PUBLIC_GOOGLE_MAPS_KEY` if Next.js)
- **The referrer restriction is your security model.** A "public" frontend key with strong referrer restrictions is the documented Google pattern — do not try to hide it behind a backend proxy unless you also want to pay for the proxy bandwidth.

---

## 2. Data shape

Listings need lat/lng at the **neighborhood centroid** (for the pre-guess "approximate" view) AND at the **exact property address** (for the post-reveal view). Both must be present on the server, but **only the centroid is sent to the client until after the guess is submitted**. The exact lat/lng is returned in the submit response, never embedded in the initial page payload.

```ts
// Pre-guess payload
type DailyListingPublic = {
  id: string;
  neighborhood: string;
  city: string;
  state: string;
  centroid: { lat: number; lng: number };  // neighborhood-level
  zoom: number;                              // suggested zoom, usually 14–15
  // NOTE: no `address`, no `exactLat`, no `exactLng`
};

// Post-guess (returned by /api/daily/submit)
type DailyListingRevealed = DailyListingPublic & {
  address: string;
  exact: { lat: number; lng: number };
};
```

This is the most important point in the document. Cheaters will read the initial network response. If you send `exactLat` before submit, the daily is broken.

---

## 3. Loading the maps SDK

Use `@vis.gl/react-google-maps` — Google's officially-recommended modern React wrapper. Do not use the deprecated `@react-google-maps/api` or roll your own loader.

```bash
npm i @vis.gl/react-google-maps
```

Wrap the daily container once, at the route level, not at the component level (so the SDK loads once even if the modal opens/closes):

```tsx
import { APIProvider } from '@vis.gl/react-google-maps';

<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
  <DailyContainer />
</APIProvider>
```

---

## 4. The preview card (compact, in the play screen)

Use the **Static Maps API**, not the JS Map. The preview card is a tiny non-interactive thumbnail; serving an HTML img is 10× cheaper and faster.

```tsx
function NeighborhoodPreview({ centroid, zoom }: { centroid: { lat: number; lng: number }; zoom: number }) {
  const params = new URLSearchParams({
    center: `${centroid.lat},${centroid.lng}`,
    zoom: String(zoom),
    size: '240x168',          // 2× the 120×84 displayed size for retina
    scale: '2',
    maptype: 'roadmap',
    key: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    // Custom styles — see §6 for the full JSON
    style: STATIC_STYLES.join('&style='),
  });

  // Highlight the neighborhood as a translucent circle (Static Maps "path" param)
  params.append('path', `fillcolor:0xFF5C3933|color:0xFF5C39|weight:2|enc:${encodePolyline(circlePoints(centroid, 600))}`);

  return <img src={`https://maps.googleapis.com/maps/api/staticmap?${params}`} alt={`Map of ${neighborhood}`} loading="lazy" />;
}
```

**Important — no marker on the preview.** Google's `markers=` param drops a red pin which gives away the exact location. Use the `path=` param to render a translucent circle around the neighborhood centroid (~400–800m radius depending on neighborhood density). The user sees a vibe, not a pinpoint.

---

## 5. The expanded modal (full-bleed, interactive)

Use the JS Map component for the modal so users can pan and zoom.

```tsx
import { Map, Circle, AdvancedMarker } from '@vis.gl/react-google-maps';

function NeighborhoodMap({ listing, revealed }: { listing: DailyListing; revealed: boolean }) {
  return (
    <Map
      mapId={MAP_ID}                       // see §6
      defaultCenter={listing.centroid}
      defaultZoom={listing.zoom}
      gestureHandling="greedy"
      disableDefaultUI={false}
      streetViewControl={false}            // disable — gives away the answer
      mapTypeControl={false}
      fullscreenControl={false}
    >
      {/* Pre-guess: translucent area only, no marker */}
      {!revealed && (
        <Circle
          center={listing.centroid}
          radius={600}                     // metres — tune per neighborhood
          fillColor="#FF5C39"
          fillOpacity={0.18}
          strokeColor="#FF5C39"
          strokeOpacity={0.7}
          strokeWeight={2}
        />
      )}

      {/* Post-reveal: exact pin appears */}
      {revealed && listing.exact && (
        <AdvancedMarker position={listing.exact}>
          <PriceTagPin />
        </AdvancedMarker>
      )}
    </Map>
  );
}
```

**Disable these UI controls** (every one of them can leak the answer):
- `streetViewControl: false` — Pegman + Street View lets users walk the exact street and read house numbers
- `mapTypeControl: false` — switching to satellite makes the house photo-identifiable
- `clickableIcons: false` — Google's built-in POI labels are clickable, opening Place cards with the exact address of nearby businesses

Optionally also disable scroll-wheel zoom on the preview card if you embed it interactively (`scrollwheel: false`).

---

## 6. Custom map style

Google Maps default styling clashes with the Pricetag palette. Define a custom **Map ID** styled with Pricetag colors so the map feels native, not like a Google product dropped in.

Two options:

### Option A — Cloud-based Map ID (recommended)
1. Console → **Maps Management → Map Styles → Create New Style**
2. Use the JSON from §6.1 as a starting point
3. Associate it with a **Map ID** and pass that ID via the `mapId` prop

### Option B — Inline JSON style
Pass `styles={STYLE_JSON}` directly on the `<Map>` component. Works but reloads on every mount and can't be edited without a deploy.

### 6.1 Style JSON — Pricetag paper palette

```json
[
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#4a4540" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#f7f4ee" }, { "weight": 2 }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f0e9d8" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#cfe1ec" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#e8e0cd" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c8d8b8" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }, { "weight": 1.5 }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f5e1a0" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#e0d8c5" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#d8d0bd" }] },
  { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] }
]
```

This gives you the paper-and-cream feel of the illustrated variant while keeping real Google geometry. The translucent orange circle (§5) sits on top and stays the same.

For the **dark stage variant** (intro/reveal screens — out of scope for the play screen map, but useful elsewhere), invert all the colors: `landscape → #1f1d1a`, `water → #2a3a48`, etc. Document this as a second Map ID and switch via prop.

---

## 7. The post-reveal marker

The `<PriceTagPin>` referenced in §5 is the Pricetag pin glyph. Build it as a small SVG so it matches the brand:

```tsx
function PriceTagPin() {
  return (
    <div style={{ transform: 'translate(-50%, -100%)' }}>
      <svg width={32} height={42} viewBox="0 0 32 42">
        <path d="M16 0 C 25 0 32 7 32 16 C 32 27 16 42 16 42 C 16 42 0 27 0 16 C 0 7 7 0 16 0 Z"
              fill="#FF5C39" stroke="#fff" strokeWidth="2"/>
        <circle cx="16" cy="16" r="5" fill="#fff"/>
      </svg>
    </div>
  );
}
```

Wrap with `<AdvancedMarker>` (not the deprecated `<Marker>`).

---

## 8. Mobile / touch

The expanded modal must be **scroll-locked when the map is gesturing**, otherwise pinch-zoom on the map pinch-zooms the whole page. The library handles this via `gestureHandling="greedy"` (above), but you also need to:

```css
.daily-map-modal-body {
  touch-action: none;          /* prevents body scroll on touch-drag inside the map */
  overscroll-behavior: contain;
}
```

---

## 9. Failure modes

The map will fail. Plan for it:

| Failure | Cause | Fallback |
|---|---|---|
| Map shows "For development purposes only" watermark | Billing not enabled | Show illustrated A-variant instead, log to Sentry |
| Map shows nothing, console says `RefererNotAllowedMapError` | Key restrictions don't include current host | Show A-variant, alert ops |
| `OVER_QUERY_LIMIT` 429 | Quota exhausted | Show A-variant, increase quota |
| User offline | Network | Show A-variant cached SVG |

**The illustrated variant is the universal fallback.** Keep it shipped, behind a feature flag, even after Google is wired up. When in doubt, render A.

---

## 10. Compliance — read this once

Google Maps Terms of Service have non-negotiable requirements:

- **Attribution must be visible**: the Google logo and "Map data ©" string. Both are auto-rendered by the JS Maps SDK on a default map; **do not hide them with CSS**. If you hide them you are in violation.
- **Cannot use map data for analysis or in violation of geographic restrictions** — irrelevant for our use case but worth knowing
- **Cannot scrape or cache map tiles** — fine, we never do
- **Static Maps responses can be cached client-side for up to 30 days**. Use this to your advantage; cache previews in localStorage keyed by `${listingId}` so repeat views don't bill again

---

## 11. Migration path: A → B → A+B

The cleanest evolution:

1. **Today:** ship A (illustrated SVG). Zero ops cost. Beautiful.
2. **Phase 2:** when you hit the limit of hand-drawn maps, ship B (Google Maps) behind a feature flag `daily.map.provider = 'illustrated' | 'google'`. Default to `illustrated`. Flip per-listing for cities you don't have illustrations for.
3. **Phase 3:** make the provider per-listing, decided at ingest time. If a listing has a custom SVG, use A; else B. Best of both.

The shared `<MapPreviewCard>` and `<MapExpandedModal>` interfaces in `src/daily/map.jsx` are designed for this — both variants are drop-in compatible because they accept the same props.

---

## Files in this bundle

- `src/daily/map.jsx` — design references for both A (`IllustratedMap`) and B (`GoogleStyleMap`). The B version is a visual mimic for design review only; **do not ship the mimic**. Replace it with the real `@vis.gl/react-google-maps` `<Map>` component per this document.
