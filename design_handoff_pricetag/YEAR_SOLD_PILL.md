# Enhancement — "Year Sold" pill on the Play screen

A single new UI affordance on the daily and practice **Play** screens: a small orange pill that surfaces the **year the house was sold**, sitting next to the listing's general info.

> Scope: this is an *additive* enhancement. No changes to layout, state, routing, data shape, or any other component. One new sub-component, one mount point per Play screen.

---

## Why

Players asked for the sale year. The "1854 built" stat in the info row is the **construction** year — different signal. The sale year is a strong price-anchor (a 2008 sale tells a very different story than a 2023 sale) so it belongs next to the other property facts, but as a *distinct* visual element.

We chose a pill rather than a sixth `<Stat>` chip because:
- It's metadata about the *transaction*, not the *property* — visually it should sit one rank apart from bd / ba / sqft / built.
- The pricetag silhouette is already the brand mark; a tag-shaped, brand-orange pill reinforces that vocabulary without re-using the literal logo.
- Brand-orange draws the eye to the most price-relevant piece of context on the screen.

---

## Placement

Both Play screens share the same right-column structure: an eyebrow ("LISTED IN CHARLESTON"), the title, blurb, then the stat row.

Place the pill **inline with the eyebrow**, right-aligned on the same horizontal baseline.

```
┌─ right column ─────────────────────────────────────────┐
│  LISTED IN CHARLESTON                  [🏷 SOLD 2024]  │  ← new
│                                                          │
│  South of Broad,                                         │
│  Charleston, SC                                          │
│  Antebellum single house, three-story piazza…           │
│                                                          │
│  🛏 4 bd   🛁 3.5 ba   📐 3,240 sqft   🕐 1854 built     │
└──────────────────────────────────────────────────────────┘
```

DOM-level, that means turning the existing eyebrow div into a flex row:

```jsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
  <div className="eyebrow">Listed in {listing.city}</div>
  <YearSoldPill year={listing.yearSold}/>
</div>
```

If `listing.yearSold` is missing/null, **don't render the pill** — the existing layout is unaffected.

---

## The pill — visual spec

```
┌──────────────────────┐
│ 🏷  SOLD   2024      │   <- inline-flex
└──────────────────────┘
```

| Token              | Value                                                       |
| ------------------ | ----------------------------------------------------------- |
| Background         | `var(--accent)` (`#FF5C39`)                                 |
| Foreground         | `var(--paper)` (`#F7F4EE`)                                  |
| Shape              | `border-radius: 999px` (full pill)                          |
| Padding            | `6px 12px 6px 8px` (left tighter to balance the leading icon) |
| Gap                | `8px` between children                                       |
| Shadow             | `0 6px 14px -6px rgba(255,92,57,0.45)` (soft orange glow)   |
| "SOLD" label       | JetBrains Mono, **10px**, weight 400–500, letter-spacing `0.12em`, opacity `0.78` |
| Year               | Fraunces italic, **16px**, weight 600, `font-variant-numeric: tabular-nums`, `line-height: 1` |
| Leading icon       | 12×12 stroked SVG tag glyph (see below), `stroke-width: 2`  |

All three tokens (`--accent`, `--paper`, the Fraunces/JetBrains Mono families) already exist in the design system — no new tokens.

### The 12×12 tag glyph

```svg
<svg width="12" height="12" viewBox="0 0 24 24"
     fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 12 L12 3 L21 3 L21 12 L12 21 Z"/>
  <circle cx="16.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>
</svg>
```

A diamond-tipped tag silhouette with the string hole filled. Matches the stroke weight and roundness of the existing `Icon.*` set in `src/components.jsx`.

---

## Reference component

Drop this into the existing component file (e.g. `src/components.jsx`, near `Stat`) and export it the same way:

```jsx
function YearSoldPill({ year }) {
  if (year == null) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "6px 12px 6px 8px", borderRadius: 999,
      background: "var(--accent)", color: "var(--paper)",
      fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
      boxShadow: "0 6px 14px -6px rgba(255, 92, 57, 0.45)",
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 L12 3 L21 3 L21 12 L12 21 Z"/>
        <circle cx="16.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
      <span style={{
        fontFamily: "var(--mono)", letterSpacing: "0.12em",
        opacity: 0.78, fontSize: 10,
      }}>SOLD</span>
      <span className="tnum" style={{
        fontFamily: "var(--display)", fontStyle: "italic",
        fontWeight: 600, fontSize: 16, lineHeight: 1,
      }}>{year}</span>
    </span>
  );
}
```

In the production codebase, convert inline styles to whichever pattern the host uses (Tailwind classes, CSS module, styled-component, etc.). The values are the spec; the styling layer is up to you.

---

## Where to mount it

Two files, same edit in each — wrap the existing eyebrow line so the pill can sit beside it.

### 1. Daily Play — `src/daily/play.jsx`

Find the right-column header block:

```jsx
<div className="eyebrow" style={{ marginBottom: 10 }}>Listed in {listing.city}</div>
```

Replace with:

```jsx
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
  <div className="eyebrow">Listed in {listing.city}</div>
  <YearSoldPill year={listing.yearSold}/>
</div>
```

### 2. Practice Play — `src/play.jsx`

Same change in the same block of the right column. (If the right column doesn't currently expose a "listed in" eyebrow, place the pill at the top-right of whatever sits above the title.)

No state, no props from the parent — the pill reads `listing.yearSold` directly.

---

## Data

Add `yearSold: number` to the listing record. Numeric, four-digit (e.g. `2024`). Optional — if absent, the pill doesn't render.

If listing data is currently statically generated, just add the field to whichever source-of-truth (CSV, JSON, seed file) feeds it. No schema migration is implied by this enhancement.

---

## Accessibility

- The pill is decorative + informational; render the SVG with `aria-hidden="true"`.
- Wrap the whole pill in an element with `aria-label={`Sold in ${year}`}` so screen readers get the full phrase rather than reading "SOLD" and "2024" as disconnected fragments.
- Color contrast: paper-on-accent measures ~4.6:1 — passes AA for 12px+ bold text, which the year and label both qualify as.

---

## What this enhancement is **not**

- Not a new stat chip in the bd/ba/sqft row. Sale year stays visually distinct.
- Not a year picker / filter / interactive control. Display-only.
- Not on the Reveal screen — sale year is already part of the price storytelling there and has its own treatment.
- Not on the home page or summary cards.

---

## Acceptance

- [ ] `YearSoldPill` component exists and renders the spec above.
- [ ] Daily Play right column shows the pill, right-aligned on the eyebrow's baseline.
- [ ] Practice Play right column shows the pill in the equivalent position.
- [ ] Listings without `yearSold` render exactly as before (no empty space, no fallback text).
- [ ] On viewports ≥ 1024px, the pill never wraps to a second line and never collides with the title.
- [ ] Screen-reader announces "Sold in 2024" (or equivalent) when focused.
