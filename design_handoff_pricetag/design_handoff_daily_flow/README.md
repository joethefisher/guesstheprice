# Handoff: Pricetag — Daily House Flow

## Overview

The **Daily House** is Pricetag's daily-ritual feature, inspired by Wordle. Every player worldwide gets the **same house at midnight Eastern time**, makes **one guess** (no do-overs), and sees an immediate reveal. Streaks accumulate strictly — miss a day, lose the streak. The flow includes stats tracking with a Wordle-style heatmap, a shareable result card, milestone celebrations at streak thresholds, and an "already played" state that locks until the next reset.

## ⚠️ Scope: start at screen 02, NOT 01

**Important.** The base Pricetag app has been under active development for multiple days. The home page already has a Daily button wired up. **Do not touch the home page or build screen 01.** Treat the home-page CTA as already existing — your job starts the moment the user clicks it.

The `src/daily/entry.jsx` file is included for visual reference only (so you know what the existing button is supposed to look like). **Do not import, render, or modify it.** Do not modify the home page, landing component, or any existing routing.

**Your integration point is a single mount.** Wherever the host app navigates on "Daily" click, mount a new `<DailyContainer>` component there. Everything below — intro, play, reveal, share, stats, milestone, locked — lives inside that container. The container accepts an `onExit` prop and calls it to return control to the host. Do not refactor the host's state machine, route enum, or existing localStorage keys.

If you are unsure how the host currently wires the Daily button, **ask the user before changing it.** Better to pause than to break working code.

---

This handoff covers **only the daily flow**. The base Pricetag app (landing, practice rounds, summary, saved homes) is documented separately in `../design_handoff_pricetag/`. **Read that first** — daily reuses its design tokens, components, and listing data.

This bundle contains the high-fidelity HTML/React prototype showing the full daily flow as a design canvas (all 9 artboards side by side), plus the individual screen components.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing the intended look and behavior of each screen, not production code to ship. They use plain React + Babel (in-browser transpile via `@babel/standalone`) and inline `style={}` objects so the design moved fast. The task is to **recreate these designs in the target codebase** using its established patterns (React + Tailwind + Framer Motion is the recommended stack; see the parent handoff).

The design canvas (`Daily Flow.html`) renders all screens side-by-side for reference — it is **not** the intended product flow. Real users see one screen at a time, navigated by the state machine described below.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, motion, and interaction states are all specified.

---

## Files in this bundle

```
design_handoff_daily_flow/
├── README.md              ← this file
├── Daily Flow.html         ← design canvas (all artboards)
└── src/daily/
    ├── app.jsx             ← the design canvas wrapper (NOT the runtime flow)
    ├── daily.css           ← all daily-specific CSS (stage bg, spotlights, stamps, etc)
    ├── shared.jsx          ← shared primitives: Wordmark, DailyBadge, NextDailyCountdown, Icon, PLAYER/TODAY data
    ├── entry.jsx           ← 01 · Entry point (home-page CTA)
    ├── intro.jsx           ← 02 · Intro (variants: "stage" + "letter")
    ├── play.jsx            ← 03 · Single-guess play screen
    ├── reveal.jsx          ← 04 · Reveal (variants: "show" + "quiet")
    ├── share.jsx           ← 05 · Share modal
    ├── stats.jsx           ← 06 · Stats + calendar
    ├── milestone.jsx       ← 07 · Streak milestone celebration
    └── locked.jsx          ← 08 · Already played (locked) state
```

---

## State Machine

The daily flow is a finite state machine. Here are all the states and transitions:

```
                ┌──────────────────────────────────────┐
                │   HOME (existing landing page)        │
                │   Daily CTA visible if not played     │
                │   "Played ✓" chip if already played  │
                └────────────────┬─────────────────────┘
                                 │ click Daily CTA
                                 ▼
                ┌─────────────────────────────────────┐
                │   route = 'daily'                    │
                │   on enter: fetch today's house +   │
                │   check `localStorage.lastPlayed`    │
                └────────────────┬─────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │ alreadyPlayedToday?                  │
              │                                       │
        ──── true ─┐                            ┌── false ────
                    ▼                            ▼
              ┌─────────┐                  ┌─────────┐
              │ LOCKED  │                  │  INTRO  │
              │  (08)   │                  │  (02)   │
              └──┬──────┘                  └────┬────┘
                 │                              │ click "Play today's house"
                 │ click "Practice"             ▼
                 │ → exit daily                ┌─────────┐
                 │                              │  PLAY   │
                 │ click "Stats"                │  (03)   │
                 │ → STATS                      └────┬────┘
                 │                                   │ submit guess
                 ▼                                   ▼
              ┌─────────┐                       ┌─────────┐
              │  STATS  │ ◄────────────────────┤ REVEAL  │
              │  (06)   │   click "Stats"       │  (04)   │
              └──┬──────┘                       └────┬────┘
                 │ exit                              │ click "Share"
                 ▼                                   ▼
              (back to home)                    ┌─────────┐
                                                │  SHARE  │ (modal over reveal)
                                                │  (05)   │
                                                └────┬────┘
                                                     │ close
                                                     ▼
                                                (back to reveal)

   After reveal, if streak hit a milestone (7/30/50/100/365):
   REVEAL → MILESTONE (07) → STATS (06)
```

### State variables

```ts
type DailyRoute =
  | 'intro'       // 02
  | 'play'        // 03
  | 'reveal'      // 04
  | 'milestone'   // 07 (intermediate, only when streak threshold crossed)
  | 'stats'       // 06
  | 'locked'      // 08
  // 05 (share) is a modal over reveal, not its own route

type DailyState = {
  today: {
    number: number;         // e.g. 142 — incrementing since launch
    dateISO: string;         // YYYY-MM-DD in ET
    listing: Listing;        // the house — reuse Listing type from base app
  };
  alreadyPlayedToday: boolean;
  result?: {                 // present after submit
    guess: number;
    actual: number;
    pctOff: number;          // |guess - actual| / actual
    accuracy: number;        // (1 - pctOff) * 100
    bucket: '90'|'80'|'70'|'60'|'50'; // for distribution chart
    submittedAt: number;     // ms since epoch
  };
  player: {
    currentStreak: number;
    bestStreak: number;
    played: number;
    avgAccuracy: number;
    history: (number | null)[];  // last 35 days; null = missed; number = accuracy
    distribution: { bucket: string; count: number }[]; // for histogram
  };
};
```

### Persistence

Store under a single key, e.g. `pricetag.daily.v1`:

```json
{
  "lastPlayedDateET": "2024-05-10",
  "lastResult": { "guess": 2300000, "accuracy": 92, "bucket": "90", "pctOff": 0.076 },
  "currentStreak": 12,
  "bestStreak": 28,
  "played": 47,
  "history": [null, 78, 82, ..., 92],
  "distribution": { "90": 12, "80": 18, "70": 9, "60": 5, "50": 3 }
}
```

On app load: compute `alreadyPlayedToday = (lastPlayedDateET === todayET())` where `todayET()` returns the YYYY-MM-DD in America/New_York. If true, render LOCKED; otherwise INTRO.

### Daily reset / streak strictness

- Reset boundary: **00:00 America/New_York**, regardless of user's local TZ.
- On entering daily after a date change, check `lastPlayedDateET`:
  - if `=== todayET()`: locked
  - if `=== yesterdayET()` and a result exists: streak continues if today's guess is submitted today
  - else: **`currentStreak` is set to 0 before the new game**. Display this honestly — no grace days, no surprises.

The countdown component (`<NextDailyCountdown>`) ticks to midnight ET every second.

---

## Screens

Each screen is documented with its purpose, layout, key interactions, and the animations that should fire on entry.

### 01 · Entry point — SKIP

**Already exists in the host app. Do not touch.** The `src/daily/entry.jsx` file in this bundle is visual reference only — do not import or render it. Do not modify the home page. Your work starts at screen 02.

---

### 02 · Intro — `intro.jsx`

**Purpose:** The doorway. Sets the tone before the single shot.

**Two variants** (`variant="stage" | "letter"`). **Ship `"stage"`** — it's the chosen direction. Keep `"letter"` in the code for now but don't route to it.

**Layout (stage variant):**
- Dark stage background (`.stage-bg` — radial gradient over `#15110d → #1a1a1a`).
- Three spotlight cones: center static (`.spotlight`), left + right swaying (`.spotlight-l`, `.spotlight-r` — `animation: spotSway 6s ease-in-out infinite alternate`).
- "OPEN HOUSE" plaque (`.plaque` — engraved-brass look, gold lettering on dark metal).
- Row of marquee bulbs (`.bulbs` — staggered flash animation, `1.4s` cycle).
- Headline: "Today's house" / "is open." in Fraunces italic, paper color, ~96px.
- Subhead: "One guess. No do-overs. Reset at midnight."
- Primary CTA: "Begin →" (accent orange, full-width on small screens, ~280px otherwise).
- Top-right: live "38,402 playing now" pill with pulsing dot.

**Entry animation (fires on mount):**
- Spotlight cones: fade in `opacity 0 → 0.7` over **400ms**.
- Bulbs: stagger-fade-in left-to-right, `30ms` per bulb, ease-out.
- Plaque: drop-in `translateY(-20px) → 0`, `opacity 0 → 1` over **500ms**, ease-out, delay **150ms**.
- Headline: word-by-word stagger fade-up (`translateY(20px) → 0`), each word **80ms** apart, ease-out, delay **400ms**.
- CTA: fade-in `opacity 0 → 1` over **300ms**, delay **900ms**.

**On click "Begin":** Navigate to PLAY (route = `play`).

---

### 03 · Play — `play.jsx`

**Purpose:** The one shot. Same skeleton as the existing practice game's `PlayScreen`, but framed as one-shot.

**Differences from practice mode:**
- **No "Skip" button** anywhere.
- Gold-tinted Daily badge replaces the round counter ("Daily · #142" instead of "Round 3 / 10").
- Explicit warning band above the slider: "One guess. No do-overs." (small, accent-orange text, 13px).
- Submit button label: "Lock in my guess" (not "Submit").
- Cancel/exit confirmation: clicking the X opens a confirm modal: "Forfeit today's house? Your streak will reset to zero." with destructive button styling.

**On submit:** Compute result, persist to localStorage immediately (before navigating — so a refresh during reveal still resolves correctly), then navigate to REVEAL.

---

### 04 · Reveal — `reveal.jsx`

**Purpose:** The dopamine moment.

**Two variants** (`variant="show" | "quiet"`). **Ship `"show"`** (the theatrical one).

**Layout (show variant):**
- Same `.stage-bg` + `.spotlight*` family as the intro — feels like the same room.
- Headline above: "Your guess" / "vs. the actual" in Fraunces italic.
- Two big numbers stacked: player's guess in paper white, actual in gold (`--spot`), separated by a tilted **SOLD rubber stamp** (`.sold-stamp` — accent-orange, 4px double border, rotated -8°, faintly distressed).
- Below: accuracy bar + the property card (smaller version of the practice reveal card).
- CTAs: "Share" (primary, gold), "See stats" (secondary), "Done" (tertiary, exits to home).

**Entry animation:**
- Stage fades in **300ms**.
- "Your guess" headline + number slide in from left over **500ms**, ease-out.
- Pause **400ms**.
- SOLD stamp scales in `transform: scale(0) rotate(-30deg) → scale(1) rotate(-8deg)` over **350ms** with cubic-bezier(0.34, 1.56, 0.64, 1) (overshoot/wobble).
- Pause **200ms**.
- "vs. the actual" headline slides in from right.
- Actual number **ticker-counts up** from `guess` to `actual` over **1200ms** with ease-out. Use `requestAnimationFrame`; format with `$` and commas; show the final value with a brief flash (scale 1 → 1.05 → 1).
- If `accuracy >= 90`: trigger **confetti burst** from below the number, 60 particles, accent + gold + emerald palette, gravity-based fall (reuse the existing `Confetti` component from the base app).
- If `accuracy < 60`: gentle camera-shake on the stamp (4 frames, ±4px horizontal).
- Accuracy bar fills `width: 0 → ${accuracy}%` over **600ms** with ease-out, delay **1400ms**.

**On click "Share":** Open SHARE modal (overlay, do not unmount reveal).
**On click "See stats":** Navigate to STATS.
**On click "Done":** Exit daily, return to home. If a milestone was crossed, route to MILESTONE first.

---

### 05 · Share modal — `share.jsx`

**Purpose:** Wordle-style shareable result, both visual and copy-to-clipboard.

**Layout:**
- Modal over the reveal (semi-opaque scrim, `rgba(0,0,0,0.6)`).
- Card in the center: house thumbnail + accuracy band + the emoji grid + the date label.
- Below the card: a `<textarea readonly>` with the shareable text — pre-selected when modal opens. Below that: "Copy text" button (changes to "Copied ✓" for 2s on click) and "Download image" button.
- Close button top-right.

**Shareable text format** (one row per day this week the player has played):
```
Pricetag #142 — 92%
🟧🟧🟧⬜
🟩🟩🟩⬛
pricetag.app/daily
```
Where the grid encodes the accuracy bucket using:
- 🟩 emerald = 90+
- 🟧 orange  = 80–89
- 🟨 yellow  = 70–79
- ⬛ dark    = 60–69
- ⬜ light   = <60 or missed

**Animation:** Modal scale-in `0.94 → 1` + fade-in over **200ms**, ease-out. Scrim fades in **150ms**.

**Clipboard:** `navigator.clipboard.writeText(...)`.

---

### 06 · Stats + calendar — `stats.jsx`

**Purpose:** Wordle-style stats page. Tracks streak, accuracy distribution, and a 5-week heatmap.

**Theme: dark stage.** Uses `.stage-bg-soft` (warmer, calmer than the intro's `.stage-bg`) + the same spotlight cones. Paper-on-dark throughout — see the file for exact translucent-paper surface colors.

**Layout — two columns:**

Left column:
- Eyebrow: "Your daily statistics".
- 2×2 grid of hero numbers:
  - **CURRENT STREAK** (accent orange, 84px display, "🔥" suffix).
  - **BEST STREAK** (gold/`--spot`, 84px display).
  - **PLAYED** (paper, 56px).
  - **AVG ACCURACY** (paper, 56px, with smaller `%` glyph).
- Hairline divider.
- Distribution histogram (the player's bucket is highlighted in accent).
- At bottom: countdown card with `<NextDailyCountdown>` and a copy reminder about the strict reset.

Right column:
- Eyebrow + month range header ("April 5 — May 10") with prev/next arrows.
- Day-of-week row (S M T W T F S, mono 10px).
- **5×7 heatmap grid.** Each cell:
  - Background by accuracy bucket (90+ emerald, 80 moss, 70 accent, 60 gold, else dim).
  - Day number in top-left, accuracy in center.
  - Today's cell has a 2px gold ring (`box-shadow: 0 0 0 2px var(--spot)`).
  - Missed days: dim translucent paper, "·" placeholder.
- Legend row.
- **Accuracy trend chart** (SVG line chart, gold stroke, accent-orange gradient fill below).
- 2-up footer: HARDEST DAY + BEST DAY cards.

**Entry animation:** Stagger-fade-up each section, 100ms apart, ease-out. Hero numbers count up from `0 → value` over **600ms**. Heatmap cells fade in left-to-right, top-to-bottom, **15ms** stagger.

---

### 07 · Milestone — `milestone.jsx`

**Purpose:** Celebration moment when `currentStreak` crosses a threshold. Fires **between** REVEAL and STATS, only on threshold-hit reveals.

**Thresholds:** 7, 30, 50, 100, 365 days.

**Layout:**
- `.stage-bg` + spotlights (same as intro).
- Confetti burst on mount.
- Centerpiece: gold **medal** disc with `.medal-shine` (radial gradient + inset shadows simulating polished metal), with a bulb halo (`.bulbs` arranged in a circle) glowing underneath.
- Big number: the streak count (e.g. "30") in Fraunces italic, **~220px**, gold (`--spot`).
- Below: "DAYS STRAIGHT" in mono caps.
- Headline: copy adapts to threshold:
  - 7 → "One full week."
  - 30 → "A month of perfect form."
  - 50 → "Halfway to a hundred."
  - 100 → "A century. Take a bow."
  - 365 → "A full year. Absurd."
- Stat strip: small row showing avg accuracy across this streak.
- CTAs: "Continue →" (primary), "Share milestone" (secondary).

**Animation:**
- Confetti immediately on mount.
- Medal scale-in `0.4 → 1.1 → 1` with bouncy easing over **600ms**.
- Bulbs in the halo light up one by one, clockwise, **80ms** stagger.
- Number ticker-counts `0 → streak` over **800ms** ease-out, then a single flash (1 → 1.06 → 1).
- Headline word-stagger fade-up.

**On "Continue":** Navigate to STATS.

---

### 08 · Locked — `locked.jsx`

**Purpose:** Empty state when the user returns mid-day after playing.

**Theme: dark stage.** Same `.stage-bg-soft` + spotlights as stats — they're a pair.

**Layout — two columns:**

Left column:
- "DONE FOR TODAY" pill (emerald translucent fill, checkmark glyph).
- Headline: "See you / **tomorrow.**" (Fraunces italic, gold on second line, ~88px).
- Body copy: "You played today's house. The next one drops at midnight Eastern — same time as the rest of the world."
- Countdown card: large `<NextDailyCountdown size={40} color="var(--spot)">` + "Notify me" button (secondary).
- Two-button row: "Play practice rounds" (primary, accent) + "See your stats" (secondary).

Right column:
- Eyebrow: "Today's result · #142".
- Today's house card: cover photo with dark gradient veil, "PLAYED" pill top-right, address + city overlaid bottom-left.
- 3-up stat tiles below: YOUR GUESS / ACTUAL (gold) / ACCURACY.

**Animation:** Stagger-fade-up sections **100ms** apart on mount. Countdown ticks every second (already handled by `<NextDailyCountdown>`).

---

## Design Tokens

All tokens listed in `../design_handoff_pricetag/README.md` apply. The daily flow adds these:

```css
--gold:    #C8A348;   /* primary accent for premium / milestone moments */
--spot:    #FFD66B;   /* warm stage-light yellow — used on dark theme   */
--emerald: #2E6F4A;   /* "done"/high-accuracy positive                  */
--velvet:  #8B2A2A;   /* deep red, used sparingly                       */
```

All daily-specific styles live in `src/daily/daily.css`. Notable classes:

- `.stage-bg` — primary stage backdrop (intro, reveal, milestone)
- `.stage-bg-soft` — calmer variant (stats, locked)
- `.stage-bg-deep` — defined but unused, available for future screens
- `.spotlight`, `.spotlight-l`, `.spotlight-r` — light cones (the swaying ones use `@keyframes spotSway`)
- `.bulbs` — marquee bulb row (use `@keyframes bulbFlash`)
- `.plaque` — engraved brass plaque
- `.sold-stamp` — tilted rubber-stamp graphic
- `.medal-shine` — gold medal disc surface
- `.heatcell` — stats heatmap cell
- `.dist-row`, `.dist-bar` — distribution chart row
- `.pulse-dot` — live-now indicator
- `.countdown` — countdown timer typography

---

## Shared primitives (`shared.jsx`)

Components that get reused across multiple screens. Reimplement each as a small React component in the target codebase:

- **`<Wordmark size>`** — the Pricetag wordmark in display italic. Filter-inverted for dark themes (see usage in stats/locked).
- **`<DailyBadge>`** — gold-tinted "Daily · #142" badge.
- **`<NextDailyCountdown size color>`** — ticks every second to midnight ET. Format: `HH : MM : SS` in mono.
- **`<Icon.X size>`**, **`<Icon.Arrow dir size>`** — line icons used in chrome.

Mock data sources (replace with real API):
- `window.TODAY` — `{ number, listing }`
- `window.PLAYER` — `{ history, distribution, streaks, ... }`

---

## Animation library recommendation

Hand-rolled animations in the prototype use CSS keyframes + `requestAnimationFrame` for the number tickers. In production, use **Framer Motion**:

- Replace per-element CSS staggers with `<motion.div initial animate transition>` + parent `staggerChildren`.
- Use `useAnimate` + `animate()` for the ticker count-ups so they hook into Motion's scheduler.
- The SOLD stamp wobble = a Motion spring (`type: "spring", stiffness: 500, damping: 12`).
- The medal scale-in bounce = `transition={{ type: "spring", stiffness: 200, damping: 14 }}`.

For confetti, reuse the practice-mode confetti component (documented in the parent handoff).

---

## Wiring into the existing app — minimal touch

The host app has been under active development for days and has its own evolved routing. **Do not refactor it.** Add exactly one new mount point:

```tsx
// somewhere in the host app's existing route handling
{route === 'daily' && (
  <DailyContainer onExit={() => /* host-specific: return to landing */} />
)}
```

`<DailyContainer>` owns the internal state machine (intro → play → reveal → share/milestone → stats → locked) and renders the right screen. It reads/writes `localStorage` under its own namespaced key (`pricetag.daily.v1`) so it cannot collide with host persistence.

**Do not change:**
- The host's landing page or its existing Daily button.
- The host's route enum or top-level state machine (only add the `daily` case).
- Any existing localStorage keys.
- The base practice-mode flow (landing, play, summary, saved).

If unsure how the host wires the Daily button today, **ask the user before changing anything.** Better to pause than to break working code.

The reveal → milestone → stats sequence is implemented internally by `<DailyContainer>` reading the streak before vs. after submit and inserting MILESTONE only when a threshold is crossed.

---

## Open questions for the dev

1. **Server vs. client daily.** The prototype uses a local mock house. In production, the "house of the day" should be served from a backend keyed by ET date so all clients see the same listing and cheating via timezone tricks is impossible.
2. **Result persistence.** localStorage is fine for v1, but for cross-device streaks you'll want auth + a `daily_results` table keyed by `(user_id, date_et)`.
3. **Confetti library.** The base app likely has one already — check `../design_handoff_pricetag/` before adding a new dep.
4. **Notification opt-in.** The "Notify me" button on the locked screen is currently visual-only. Hook it to web push or skip for v1.
