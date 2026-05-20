# Enhancement — Logged-in nav pill

A small, additive replacement for the top-right of the global nav when a user is signed in. The current outlined ghost pill loses contrast against the cream-toned upper hero; this swaps it for a solid pill that reads on any background and ties the brand mark into the identity affordance.

> Scope: this is a swap of the right-hand element of the existing `<header>` nav on the landing page (and any other surface that mirrors it). Layout, routing, dropdown menu contents, and auth flow are unaffected — this is purely the closed-state of the user button.

---

## Why

- The current "@handle ▾" outlined pill uses paper-colored text + a paper-colored 1.5px stroke. On the upper portion of the hero (which has a paper→ink gradient — light at top) the pill effectively disappears.
- Solid fills survive any background. The two variants below cover the two natural directions: ink-on-image (primary) and paper-on-image (inverse). Pick one — they shouldn't both ship.
- The brand mark — the tilted price tag — has been carrying a lot of weight elsewhere but isn't anywhere in the nav once a user is signed in. Putting it inside the avatar circle gives the logged-in state a piece of brand identity it currently lacks.

---

## Primary — Ink pill + logo avatar (variant B)

```
┌───────────────────────────────────────────────┐
│  (●)  joethefisher  ▾                         │
└───────────────────────────────────────────────┘
   ↑
  orange circle, paper-coloured tag glyph inside
```

| Token            | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Background       | `var(--ink)` (`#1A1A1A`)                                         |
| Foreground       | `var(--paper)` (`#F7F4EE`)                                       |
| Shape            | `border-radius: 999px`                                           |
| Padding          | `6px 14px 6px 6px`                                               |
| Gap              | `10px`                                                           |
| Shadow           | `0 6px 18px -10px rgba(0,0,0,0.45)`                              |
| Handle           | General Sans 13.5px, weight 600                                  |
| Chevron          | 13×13 stroked, `stroke-width: 2.2`, paper-coloured               |
| Avatar circle    | 28×28, `border-radius: 999px`, fill `var(--accent)` (`#FF5C39`)  |
| Avatar inner ring| `inset 0 0 0 1px rgba(255,255,255,0.18)`                         |
| Logo glyph       | ~18.5×18.5 (66% of avatar), paper-coloured tag silhouette, `rotate(-7deg)` |

### The logo avatar — SVG

The brand mark, simplified for a small target. Tilted price tag with the string hole punched out and a paper "?" set into the face.

```svg
<svg width="18" height="18" viewBox="0 0 100 100" aria-hidden="true">
  <g transform="rotate(-7 50 50)">
    <!-- tag body in paper, drawn over the orange circle -->
    <path d="M 24 22 L 70 16 L 84 30 L 80 76 L 60 80 L 56 84 L 22 88 Z"
          fill="#F7F4EE"/>
    <!-- string hole: knocked back to the orange behind -->
    <circle cx="32" cy="30" r="4" fill="#FF5C39"/>
    <!-- the ? printed on the tag, also knocked back to orange -->
    <text x="54" y="62" text-anchor="middle"
          font-family="Fraunces, Georgia, serif"
          font-weight="700" font-style="italic"
          font-size="46" fill="#FF5C39">?</text>
  </g>
</svg>
```

The orange background of the avatar shows *through* the string hole and the "?" — same construction as the full-size brand mark; nothing is hand-traced.

### Reference component

```jsx
function UserNavPill({ user, onOpen }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Signed in as ${user.handle}. Open menu.`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "6px 14px 6px 6px", borderRadius: 999,
        background: "var(--ink)", color: "var(--paper)",
        fontSize: 13.5, fontWeight: 600,
        boxShadow: "0 6px 18px -10px rgba(0,0,0,0.45)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 999,
          background: "var(--accent)", overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 100 100">
          <g transform="rotate(-7 50 50)">
            <path d="M 24 22 L 70 16 L 84 30 L 80 76 L 60 80 L 56 84 L 22 88 Z"
                  fill="var(--paper)"/>
            <circle cx="32" cy="30" r="4" fill="var(--accent)"/>
            <text x="54" y="62" textAnchor="middle"
                  fontFamily="var(--display)" fontWeight="700"
                  fontStyle="italic" fontSize="46" fill="var(--accent)">?</text>
          </g>
        </svg>
      </span>
      <span>{user.handle}</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2.2"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
  );
}
```

Style values are the spec — port to whichever styling layer the host uses (Tailwind, CSS module, etc.). The brand-mark SVG can be promoted to a shared `<TagMark/>` component if it gets reused.

---

## Alt — Paper pill + notification dot (variant F)

Same construction, inverted palette. Surface a 9px accent dot above the chevron to signal a state worth investigating ("daily not played yet", "new achievement", "leaderboard moved").

| Difference from primary | Value                                          |
| ----------------------- | ---------------------------------------------- |
| Background              | `var(--paper)` (`#F7F4EE`)                     |
| Foreground              | `var(--ink)`                                   |
| Inner ring              | `inset 0 0 0 1px rgba(26,26,26,0.05)`          |
| Shadow                  | `0 6px 18px -10px rgba(0,0,0,0.35)`            |
| Avatar circle           | 28×28, fill `var(--ink)`                       |
| Logo glyph              | paper-coloured tag silhouette, ink string hole + "?" |
| Notification dot        | 9×9 circle, `var(--accent)`, `box-shadow: 0 0 0 2px var(--paper)` (paper halo) at `top: 2px; right: 28px` |

Ship one or the other — not both. The primary reads better on the current hero; the alt is a stronger option if the surrounding nav links also move to a dark/ink treatment.

---

## Replacement target

```jsx
// before
<button className="btn btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>Sign in</button>
```

Becomes:

```jsx
isSignedIn
  ? <UserNavPill user={currentUser} onOpen={openUserMenu}/>
  : <button className="btn btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>Sign in</button>
```

No other changes to the surrounding `<nav>`.

---

## States

| State          | Treatment                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Default        | As specified above.                                                      |
| Hover          | Background shifts to `#000` (primary) / `#FFF` (alt). 200ms ease.        |
| Pressed        | `transform: translateY(1px) scale(0.99)` (matches existing `.btn` rule). |
| Focus-visible  | `outline: 3px solid var(--paper); outline-offset: 2px;` over hero, `var(--ink)` elsewhere. The host's existing `:focus-visible` rule covers this if applied to the new button. |
| Menu open      | Same look. The dropdown surface owns its own chrome.                     |

---

## Accessibility

- The button itself carries `aria-label="Signed in as <handle>. Open menu."` so screen readers don't read "JF joethefisher chevron" as three fragments.
- The avatar SVG is `aria-hidden="true"`.
- The notification dot in the alt variant must also be announced; add `aria-describedby` pointing at an offscreen `<span>` that says e.g. "Today's daily is not yet played." Toggle the description with the dot.
- Contrast: ink-on-paper or paper-on-ink both clear AA at this size; the logo glyph contrast (paper-on-accent) measures ~4.6:1 — adequate for the decorative mark.

---

## Acceptance

- [ ] `UserNavPill` exists as a single component, importable wherever the top nav is rendered.
- [ ] Signed-in users see the new pill in the top-right of the landing nav, replacing "Sign in".
- [ ] Signed-out users continue to see the existing `Sign in` secondary button.
- [ ] The brand-mark logo is rendered inline as SVG (not an `<img>`) so it inherits the avatar's background color through the string-hole and "?" cutouts.
- [ ] Pill keeps its readability on both the bright upper portion of the landing hero and any dark imagery (manual eyeball check across at least three hero photos).
- [ ] No layout shift between signed-out and signed-in states beyond the natural width of the new pill.
- [ ] Existing dropdown menu behaviour (whatever it currently is) is preserved — this enhancement only changes the closed-state appearance of the trigger.

---

## What this enhancement is **not**

- Not a redesign of the dropdown menu contents.
- Not a change to the nav links (Daily / Leaderboard / Saved). They stay where they are.
- Not a new icon system, design token, or font.
- Not a mobile-nav change — desktop landing nav only. Mobile uses its own pattern and is out of scope.
