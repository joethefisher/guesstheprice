# Handoff: Pricetag — Home Pricing Guessing Game

## Overview

Pricetag is a casual web game in the spirit of GeoGuessr × Wordle: players are shown a real home (photos + facts), guess its price on a logarithmic slider, and see how close they got. The session is 10 rounds; results are sharable as a Wordle-style emoji grid.

This bundle contains a high-fidelity, fully interactive HTML/React prototype covering the full core loop:

- **Landing** (hero + sparkline strip)
- **Game Round** (photo carousel, property facts, price slider, manual entry, floor-plan tab)
- **Reveal overlay** (the dopamine moment — number ticker, confetti for nailed-it, accuracy + score + map)
- **Round Summary** (per-round mini cards, best/worst zinger, share card with copy-to-clipboard)
- **Saved homes** (Pinterest-style masonry, price filters, sort by closest/worst guess)

A Tweaks panel (toggle from the toolbar) exposes accent color, display font, grain on/off, hard mode, and a screen-jump radio.

## About the Design Files

**The files in this bundle are design references created in HTML — prototypes showing intended look and behavior, not production code to copy directly.** They use plain React + Babel (transpiled in-browser via `@babel/standalone`) and inline `style={}` objects so the design exploration could move fast. The task is to **recreate these designs in the target codebase's existing environment** (React + Tailwind, Next.js, Vue, SwiftUI, etc.) using its established component patterns, design tokens, and routing.

If no codebase exists yet, my recommendation is **Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion**. Tailwind covers the token system cleanly; Framer Motion replaces the hand-rolled ticker/confetti animations with something far more maintainable.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, motion, and interaction states are all specified. Recreate pixel-perfectly using the target codebase's libraries and patterns.

---

## Files in this bundle

```
design_handoff_pricetag/
├── README.md               ← you are here
├── DESIGN_BRIEF.md         ← original product/visual brief — the source of truth
├── Pricetag.html           ← entry HTML; loads scripts in correct order
├── styles.css              ← design tokens (CSS vars), global type, button classes, animations
├── tweaks-panel.jsx        ← tweaks UI shell (can be omitted in production)
└── src/
    ├── data.js             ← mock listings + reaction copy bank + helpers
    ├── components.jsx      ← Wordmark, Icon set, NumberTicker, Confetti,
    │                         PhotoCarousel, PriceSlider, Stat, StreakFlame, RoundPill
    ├── landing.jsx         ← Landing screen
    ├── play.jsx            ← Game round + Reveal overlay + FloorPlanPlaceholder + MapMini
    ├── summary.jsx         ← End-of-game summary + ShareCard + RoundCard
    ├── saved.jsx           ← Saved-homes masonry + EmptyState
    └── app.jsx             ← Root: route state machine + tweaks panel mount
```

To preview the prototype locally: open `Pricetag.html` directly in a browser, or `python -m http.server` from the bundle root.

---

## Design Tokens

All tokens live as CSS custom properties at the top of `styles.css`. Port these directly to your token file (Tailwind theme, CSS vars, design-system constants).

### Color

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#1A1A1A` | Type, structural elements (~20% of any screen) |
| `--ink-soft` | `#2C2C2A` | Secondary type |
| `--ink-mute` | `rgba(26,26,26,0.6)` | Muted body, captions |
| `--ink-quiet` | `rgba(26,26,26,0.4)` | Disabled, very subtle UI |
| `--rule` | `rgba(26,26,26,0.12)` | Hairline dividers |
| `--paper` | `#F7F4EE` | Primary background — warm off-white, NOT pure white. ~70% of any screen |
| `--cream` | `#EDE6D6` | Subtle elevated surface against paper |
| `--accent` | `#FF5C39` | Sunset coral. **One thing per screen** — CTA, score number, the reveal moment |
| `--accent-deep` | `#E84A28` | Accent hover state |
| `--moss` | `#4A6741` | Positive feedback ("you nailed it") |
| `--flag` | `#C8472D` | Negative feedback ("way off") — distinct from accent |
| `--sky` | `#A8C5DA` | Neutral info states |
| `--gold` | `#C8A348` | Mid-tier accuracy badge |

**Usage rule:** Paper dominates ~70% of any view. Ink ~20% for type and structure. Accent ~one moment per screen — never as decoration.

### Typography

| Family | Source | Use |
|---|---|---|
| **Fraunces** (variable serif, italic 9–144 opsz) | Google Fonts | All display type — headlines, big numbers, reveal copy. Always italic. |
| **General Sans** (400/500/600/700) | Fontshare | Body, UI labels, buttons |
| **JetBrains Mono** (400/500) | Google Fonts | Share card, floor-plan dimensions, anything mono |

Loaded in `Pricetag.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet"/>
```

**Type scale** (matches brief):

| Role | Size | Line-height | Notes |
|---|---|---|---|
| Display XL | `clamp(64px, 9vw, 140px)` | 0.95 | Landing headline, summary score |
| Display L | 56–78px | 1.0 | Reveal "actual price", current guess on play |
| H1 | 32px | 1.1 | Section heads |
| H2 | 22–24px | 1.2 | Sub-heads |
| Body | 14–16px | 1.5 | Paragraphs |
| Small | 12–13px | 1.4 | Meta, secondary |
| Caption | 10–12px, uppercase, +0.08–0.16em | 1.4 | Eyebrows (`.eyebrow` / `.caption`) |

**Tabular numerals required** for any price, score, percentage, accuracy, year, sqft, lot, address number. Apply via `.tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }` or Tailwind's `tabular-nums`.

### Motion

```
--ease:     cubic-bezier(0.32, 0.72, 0, 1)   /* default, snappy not bouncy */
--ease-out: cubic-bezier(0.22, 1, 0.36, 1)   /* exits */
```

Durations: 200–400ms range for almost everything. Number ticker on reveal: ~1100ms (ease-out cubic). Modal scale-in: 360ms.

### Spacing & shape

- Border-radius scale: `12 / 14 / 16 / 18 / 22 / 24 / 999`. Buttons land at 12–16, cards at 14–22, pills at 999. **No radius below 12** on primary surfaces — soft but not pillow-soft.
- Standard page padding: 28–56px depending on width.
- Grid gap: 14–28px depending on density.

### Shadows

```
soft-card:   0 1px 0 var(--rule), 0 8px 24px -16px rgba(0,0,0,0.18)
photo:       0 10px 36px -16px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.05)
button-cta:  0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 28px -10px <accent>aa
modal:       0 30px 80px -20px rgba(0,0,0,0.5)
```

### Grain texture

3–6% opacity SVG fractal-noise overlay on `var(--paper)` surfaces and the reveal modal. Implementation in `styles.css` under `.grain::before`. Apply only to large surfaces — never on type, controls, or photos.

---

## Screens / Views

### 1. Landing

**Purpose:** Convert visitor to player in <5s. Establish the visual world.

**Layout:**
- Full-bleed hero photo (Carbon Beach / Malibu) with `filter: saturate(0.78) brightness(0.92)` and a top-to-bottom paper→ink gradient overlay for legibility
- Top nav (absolute, z=4): Wordmark left; "Daily / Saved / Stats / Sign in" right (`btn-ghost` + `btn-secondary`)
- Composition grid (`1.5fr 1fr`, ends at `bottom: 96px` to clear the strip):
  - Left: eyebrow "REAL HOMES · REAL PRICES" → display headline "Guess the **price.**" (price in accent)
  - Right: subtitle "1,247 homes. One question. How close can you get?" → `Play — 10 rounds` (accent CTA) + `Daily · May 9` (frosted-glass secondary)
- Bottom strip (frosted, full-width, fixed): five-column grid → "Today, around the world / 73% / sparkline" · divider · "Top scorer · @margaux_b · 947/1000" · divider · "Now showing: Carbon Beach · Malibu, CA · $18.75M"

**Source:** `src/landing.jsx`

### 2. Game Round (`/play`, browsing state)

**Purpose:** Core game loop. Photo browsing → guess → submit.

**Layout:**
- Top bar: Wordmark · `RoundPill` (R 03/10) · `StreakFlame` (4) · optional `HARD MODE` chip · save (heart) icon · exit (X) icon
- Two-column grid `1.55fr 1fr`, padding 28px:
  - **Photo column:** rounded 18px, photo carousel with arrow buttons + dot pagination + counter pill (`1/14`); overlay tab group top-left (Photos / Floor plan / Map[locked]); active tab is ink-filled
  - **Guess panel** (right):
    - Eyebrow "LISTED IN [city]"
    - Display H2: "Neighborhood, City, State"
    - Body blurb (1 line, italicized voice)
    - Stat strip: `Bed · Bath · Sqft · Year · Lot` with custom line icons
    - Hairline
    - Eyebrow "YOUR GUESS" → 78px display italic price (greyed until user interacts)
    - Mode tabs: `Slider | Type a number`
    - **PriceSlider** — logarithmic, $50K → $20M, ticks at $100K/$250K/$500K/$1M/$2M/$5M/$10M, ink fill, 28px paper thumb with accent inner dot
    - CTA row at bottom: `Lock it in →` (accent, full-width) + `Skip` (secondary)

**Floor plan tab** swaps the photo for a paper-on-cream SVG floorplan (placeholder — replace with real per-listing assets in production).

**Source:** `src/play.jsx` → `PlayScreen`, `PriceSlider` in `src/components.jsx`

### 3. Reveal overlay

**Purpose:** Game-show dopamine peak.

**Layout:**
- Backdrop: `rgba(26,26,26,0.55)` + `backdrop-filter: blur(14px) saturate(140%)` over the play screen
- Modal card: paper, 24px radius, max-width 760, grain overlay, scale-in animation (360ms)
  - Tag bar: tier chip (e.g. "NAILED IT" in moss, "YIKES" in flag) on left, "REVEAL" eyebrow on right
  - Display H1: reaction copy (random pick from tier-specific bank — see `src/data.js` `REACTIONS`)
  - Two-column number stack:
    - "Your guess" — 38px display italic, ink-mute
    - "Actual price" — 64px display italic, **accent**, animated via `NumberTicker` (counts 0→price over 1100ms, ease-out cubic)
  - Hairline
  - Three metrics: Off by (signed), Accuracy (%), Score this round (+points)
  - Cream sub-card: address + neighborhood + 90px-tall mini map SVG (fades in 600ms after ticker)
  - CTA row: `Next round →` (accent) + `Save this home` (heart, secondary)
- **Confetti**: only fires when `pctOff <= 0.05` (within 5%) AND only after ticker completes — 80 colored pieces falling 1.6–2.8s, mixed shapes (square/strip/circle), palette pulled from token set

**Reaction tiers** (computed from `pctOff = |guess − actual| / actual`):

| Tier | Range | Badge color | Example copy |
|---|---|---|---|
| Bullseye | ≤ 2% | moss | "Are you a real estate agent?" |
| Nailed it | ≤ 5% | moss | "Locked in." (+ confetti) |
| Solid | ≤ 15% | moss | "Reading the room." |
| Ballpark | ≤ 30% | gold | "In the ballpark." |
| Off | ≤ 50% | flag | "Not quite." |
| Yikes | > 50% | flag | "What were you thinking?" |

Full copy bank: `REACTIONS` in `src/data.js`. ~5 lines per tier; pick at random per reveal.

**Source:** `src/play.jsx` → `RevealOverlay`, `Confetti` and `NumberTicker` in `src/components.jsx`

### 4. Round Summary (`/play/summary`)

**Purpose:** End-of-game ritual. Sharable.

**Layout:**
- Header: Wordmark + date + close
- Hero stat: "You scored **<total>** / 1000" — total in accent, 132px display, with eyebrow "Round complete · 10 of 10"
- Right: two stat cards (cream): "Average accuracy <%>" + dynamic note · "Best market <city>" + flavor
- Hairline
- 5-column grid of `RoundCard`: thumb + R# + accuracy% + neighborhood + guess→actual; best/worst tagged with corner pills (moss / flag)
- Two-column footer:
  - **ShareCard** (paper, 22px radius) — emoji grid in JetBrains Mono, accuracy line, copy-to-clipboard button
  - **Next-up panel** (ink, paper text) — daily challenge + play-another CTAs
- Bottom: "WORST GUESS" zinger card (cream) — thumb + display italic line + delta math

**Source:** `src/summary.jsx`

### 5. Saved homes (`/saved`)

**Purpose:** Hedonic browsing layer. The "I'd actually live there" Pinterest feel.

**Layout:**
- Header + display headline "Homes you'd actually live in."
- Sticky filter rail (top + bottom hairlines): price-range chips (All / <$500K / $500K–$1M / $1M–$3M / >$3M) on left; sort chips (Recent / Closest guess / Worst guess) on right
- 3-column CSS-`columnCount` masonry, varied card heights (340/280/380/300/340/360/280/320/380/300 cycle)
- Card: photo (with accuracy/tier corner badge + filled-heart icon corner) + price (display italic 24px) + neighborhood + city/beds/sqft meta + bottom hairline + "You guessed $X"
- Empty state: hand-drawn-feel SVG house illustration + display copy + accent CTA

**Source:** `src/saved.jsx`

---

## Components (reusable)

All components live in `src/components.jsx` and are exported to `window` for cross-script access. In your codebase, port them as proper modules.

### `<Wordmark size>`
Logo + italic "pricetag" wordmark in Fraunces. SVG mark is a tilted parallelogram with a small dot — feels stamp-like, hand-cut.

### `<Icon.*>`
Hand-drawn-feel line icons at 1.6–1.8 stroke width: `Heart` (filled variant), `X`, `Arrow` (with `dir="left"` mirror), `Flame` (filled), `Bed`, `Bath`, `Sqft`, `Year`, `Map`, `Share`, `Sparkle`. **Replace with your icon system** but match the line weight and casual feel — DO NOT use generic icon packs (Material, FontAwesome) per the brief.

### `<NumberTicker value duration prefix onDone>`
Animates 0 → value over `duration` ms with ease-out cubic. Calls `onDone` on completion. Used for the reveal price.

### `<Confetti fire count>`
Renders 80 colored pieces (mixed shapes) falling with `confetti-fall` keyframe. Only render when `fire === true`.

### `<PhotoCarousel photos bandColor overlayCount onIndexChange>`
Crossfade carousel with arrow buttons (44×44 round, paper bg with shadow), dot pagination (active dot widens to 22px with smooth transition), top-right counter pill, bottom legibility gradient. Keyboard arrow nav globally. **Production:** add real touch-swipe physics with momentum (Framer Motion `drag` works well).

### `<PriceSlider value onChange locked>`
Custom logarithmic slider, $50K–$20M.
- `valueToPos(v) = (ln(v) − ln(min)) / (ln(max) − ln(min))`
- `posToValue(p) = exp(ln(min) + p × (ln(max) − ln(min)))`
- Snap function: round to nearest $5K below $1M, $25K below $5M, $100K above
- Track 14px tall, cream bg with subtle gradient hints at extremes (sky on left, accent on right)
- Tick marks at $100K / $250K / $500K / $1M / $2M / $5M / $10M with tabular-num labels above
- Thumb 28px paper circle with accent inner dot, ink ring; press-down slight-shadow
- Drag handlers cover mouse + touch

### `<Stat icon label value>`
Inline `icon → value (tnum bold) → label`. For property facts row.

### `<StreakFlame count>`
Cream pill with flickering flame icon (`flameFlicker` keyframe) + count.

### `<RoundPill current total>`
Small uppercase "ROUND 03 / 10" pill with tabular nums.

### Buttons (in `styles.css`)
- `.btn` — base: 16px/24px padding, 14px radius, 600 weight, 200ms ease transition, press-down at `:active`
- `.btn-primary` — accent fill, white text, accent-glow shadow, deep-accent on hover
- `.btn-ink` — ink fill, paper text
- `.btn-secondary` — transparent, 1.5px ink ring, inverts on hover
- `.btn-ghost` — transparent, underline-on-hover
- `.btn-icon` — 44×44 round, paper bg, ink hairline ring (44px = WCAG AA min touch target)

Disabled state: `rgba(26,26,26,0.08)` bg, `--ink-quiet` text, no shadow, `not-allowed` cursor.

### Focus
3px ink outline, 2px offset, 4px radius. Defined globally on `:focus-visible`.

---

## Interactions & Behavior

### Routing / state machine
Single root component `<App>` (in `src/app.jsx`) owns:
```
route:        "landing" | "play" | "summary" | "saved"
deck:         Listing[]   // 10 listings sliced from LISTINGS
roundIdx:     0..9
history:      RoundResult[]
streak:       integer
savedHomes:   { listingId, guess, accuracy, pctOff }[]
```

Transitions:
- Landing `Play` → `startNewGame()` → resets deck/roundIdx/history → `route = "play"`
- Play `Lock it in` → reveal opens (local state)
- Reveal `Next round` → push to history → if last round, `route = "summary"` and increment streak; else `roundIdx++`
- Summary `Play another 10` / `Daily challenge` → `startNewGame()`
- Saved is reachable from the floating nav; landing has its own top nav

In production: replace local route state with your router (Next.js App Router segments, React Router, etc.). Persist `savedHomes`, `streak`, daily completion in localStorage / your backend.

### Round-result computation
```js
pctOff   = Math.abs(guess - listing.price) / listing.price
accuracy = Math.max(0, (1 - pctOff) * 100)
points   = Math.round(accuracy)  // 0–100 per round
```

### Animations / transitions

| Event | Animation | Timing |
|---|---|---|
| Modal open | `scaleIn` (0.96 → 1) + fade | 360ms `--ease` |
| Photo carousel transition | opacity crossfade | 360ms `--ease` |
| Slider thumb when not dragging | `left` transition | 120ms `--ease` |
| Number ticker | requestAnimationFrame, ease-out cubic | 1100ms |
| Confetti pieces | `confetti-fall` keyframe (translateY + rotate) | 1.6–2.8s, staggered delay 0–0.4s |
| Map mini fade-in | `fadeIn` | 600ms after 400ms delay |
| Saved card hover | `transform: translateY(-3px)` | 280ms `--ease` |
| Streak flame | `flameFlicker` keyframe (scale + rotate) | 1.2s infinite ease-in-out |
| Tab background changes | `all` | 200ms `--ease` |

### Reduced motion
Global `@media (prefers-reduced-motion: reduce)` clamps all durations to 0.01ms. Honor this — confetti and ticker should both essentially disappear / snap-to-end.

### Accessibility
- All buttons have `aria-label` where icon-only
- Slider has manual-entry alternate (mandatory per brief)
- Reveal price should have `aria-live="polite"` so screen readers announce it (TODO in production — not yet implemented)
- Color is never sole indicator — feedback always uses tier color + label text + icon
- Keyboard: arrow keys advance carousel; enter/space submit the active button
- Focus states 3px ink outline, 2px offset

---

## Data model

```ts
type Listing = {
  id: string;
  nickname: string;          // editorial label, internal
  neighborhood: string;
  city: string;
  state: string;             // 2-letter
  address: string;           // shown only after reveal
  beds: number;              // 0 = studio
  baths: number;
  sqft: number;
  year: number;
  lot: number | null;        // sqft
  price: number;             // ground truth
  bandColor: string;         // dominant photo color, used as bg while loading
  blurb: string;             // 1-line voicey description
  photos: string[];          // hero photo URLs
  photoCount: number;        // total available (overlay shows "1 / 14")
};

type RoundResult = {
  listing: Listing;
  guess: number;
  accuracy: number;          // 0–100
  pctOff: number;            // 0–1+
  points: number;            // 0–100
};

type SavedHome = {
  listingId: string;
  guess: number;
  accuracy: number;
  pctOff: number;
};
```

The 10 sample listings span price tiers ($385K Detroit fixer → $27.5M Aspen chalet) and geographies (Brooklyn, Phoenix, SF, Austin, Detroit, Malibu, Atlanta, NOLA, Aspen, Portland). In production, load these from your backend; rotate the daily set on a 24-hour cron.

Reaction copy bank: `REACTIONS` object in `src/data.js`. Six tiers, ~5 lines each. Voice principles in the brief — light snark, geographic flavor, never condescending about money.

---

## Assets

- **Photos:** all from Unsplash (CDN URLs in `src/data.js`) for prototype only. Production must license real listing photography from your data provider (Zillow API, MLS, etc.) or commission.
- **Icons:** custom SVG, embedded in `src/components.jsx` `Icon` object. Match line weight (1.6–1.8) when expanding.
- **Logo mark:** inline SVG in `<Wordmark>` — tilted parallelogram with offset dot. Replace with finalized logo when brand work lands.
- **Floor plan:** SVG placeholder in `<FloorPlanPlaceholder>`. Production: real per-listing floor-plan assets from data provider, or skip the tab entirely if unavailable.
- **Mini map:** stylized SVG with grid + roads + pin in `<MapMini>`. Production: replace with real map (Mapbox, Apple MapKit JS) reveal animation — start blurred, smoothly unblur on reveal.

---

## Recommended implementation path

1. **Set up tokens** — port the CSS vars to your design-token layer (Tailwind theme, CSS modules, etc.)
2. **Set up fonts** — Fraunces / General Sans / JetBrains Mono via your font loader
3. **Build component primitives** in this order: Buttons → Wordmark → Icon set → Stat / RoundPill / StreakFlame → NumberTicker → PhotoCarousel → PriceSlider
4. **Build screens** in this order: Landing → Play (browsing) → RevealOverlay → Summary → Saved
5. **Wire state** — start with localStorage, then layer in your backend
6. **Replace placeholder media** — real listing photos, floor plans, maps
7. **Add the daily-challenge cron** and shareable OG-image generation (Vercel `@vercel/og` or equivalent) for the share card
8. **Pass accessibility audit** — `aria-live` on reveal, full keyboard parity, focus order, screen-reader labels on every icon button

---

## Out of scope (V1, per brief)

User uploads, multiplayer, native apps, voice walkthroughs, AR/VR, agent features. Don't build them.
