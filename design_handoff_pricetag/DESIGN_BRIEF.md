# Pricetag — Design Brief

**Working title:** Pricetag (placeholder, swap freely)
**Tagline candidates:** "Guess the home." / "Real homes. Real prices. How close can you get?" / "It's a vibe check, but for real estate."
**Audience:** Casual gamers, real estate enthusiasts, design-curious millennials and Gen Z. The TikTok "house tour" demographic.
**Reference DNA:** GeoGuessr (round-based guessing), Wordle (daily ritual, shareable result), Zillow surfing (hedonic browsing), TikTok (swipe-through pacing), Letterboxd (community + light social).

---

## 1. Vibe & Voice

**Primary vibe:** Playful & social. Think Wordle's restraint mixed with TikTok's energy. The product takes its content seriously (real homes, real data) but doesn't take itself seriously.

**Voice principles:**
- Conversational, never corporate. "You crushed it" not "Excellent performance."
- Light snark welcomed. "$3.2M for a studio in the Marina? Make it make sense."
- Reactions match the result. Big miss gets a wince emoji equivalent in copy. Close hit gets genuine hype.
- Never condescending about money. We don't moralize about expensive houses or pity cheap ones.
- Geographic flavor. Phoenix gets desert energy, Brooklyn gets brownstone reverence, the Bay gets tech-money jokes.

**What we're NOT:**
- Not a finance app. No serif fonts, no gold accents, no charts as decoration.
- Not a real estate tool. Agents are not the audience.
- Not a kids game. The visual sophistication should signal "for adults who like nice things."

---

## 2. Visual Identity

### Color System

A confident, slightly off-kilter palette that feels current. Avoid the default purple-gradient SaaS look entirely.

**Primary:**
- `--ink`: #1A1A1A (near-black, used for type and primary surfaces)
- `--paper`: #F7F4EE (warm off-white, primary background — NOT pure white)
- `--accent`: #FF5C39 (sunset coral, used sparingly for CTAs and key moments)

**Secondary:**
- `--moss`: #4A6741 (deep green, "you nailed it" feedback)
- `--flag`: #C8472D (red-orange, "way off" feedback, distinct from accent)
- `--sky`: #A8C5DA (dusty blue, neutral info states)
- `--cream`: #EDE6D6 (subtle surface elevation against paper)

**Usage rules:**
- `--paper` dominates. ~70% of any screen.
- `--ink` for type and structural elements. ~20%.
- `--accent` for one thing per screen. CTA, score number, the "REVEAL" moment.
- Feedback colors only appear post-guess.
- No gradients except optional grain/noise overlay for texture.

### Typography

**Display:** A characterful serif or display-sans that feels editorial. Recommendations in priority order:
1. **Fraunces** (variable serif, playful, free) — primary recommendation
2. **Tiempos Headline** (paid)
3. **Recoleta** (paid, friendlier)

**Body:** A clean, slightly geometric sans with personality.
1. **General Sans** (free, distinctive) — primary recommendation
2. **GT America** (paid)
3. **Söhne** (paid)

**NEVER use:** Inter, Roboto, Arial, system-ui as primary, Space Grotesk (overused).

**Type scale:**
- Display XL: 72px / 0.95 line-height (round screens, big numbers)
- Display L: 48px / 1.0 (modal moments, reveals)
- H1: 32px / 1.1
- H2: 24px / 1.2
- Body: 16px / 1.5
- Small: 14px / 1.4
- Caption/UI: 12px uppercase tracked +0.08em

**Numerals:** Tabular numbers required for prices, scores, percentages.

### Iconography & Imagery

- Custom illustrative icons preferred over generic icon packs. Hand-drawn-feel line icons for game UI (heart for save, X for skip, arrow for next).
- Property photos are the hero. They get full-bleed treatment, never cropped to weird ratios.
- Optional grain texture overlay on background surfaces (3% opacity noise) for warmth.

### Motion Principles

- **Anticipation > resolution.** The reveal of the actual price should feel earned. Number rolls up dramatically. Photo zoom on hover.
- **Snappy, not bouncy.** Cubic-bezier(0.32, 0.72, 0, 1) for most transitions. 200-400ms range.
- **Confetti for nailed it (within 5%).** Use sparingly. It's the dopamine moment.
- **Card swipe physics** on photo carousel. Real momentum, not robotic.
- **Number ticker** for score reveal. Counts up over ~800ms.

---

## 3. Screen Inventory

### 3.1 Landing / Home (`/`)

**Purpose:** Convert visitor to player in under 5 seconds.

**Layout:**
- Full-bleed hero with a single gorgeous home photo, slightly desaturated
- Logo top-left
- Massive typographic headline overlapping the photo: "Guess the price."
- Sub-headline: "1,247 homes. One question. How close can you get?"
- Primary CTA: "Play" (accent color, large)
- Secondary CTA: "Daily challenge" (ghost button)
- Bottom strip: "Today's average score: 73%" with sparkline

**States:**
- Default
- Loading (skeleton with grain texture)
- Returning user (CTA changes to "Continue streak — Day 4")

### 3.2 Game Round (`/play`)

**Purpose:** Core game loop. Photo browsing → guess → reveal → next.

**Layout (mobile-first, scales up):**
- Top bar: round counter (3 / 10), streak indicator, exit (X)
- Hero photo carousel (60% of viewport height on mobile, full-bleed)
  - Swipeable on touch, arrow keys on desktop
  - Pagination dots at bottom of carousel
  - Photo count badge: "1 / 14"
- Property facts strip (below carousel):
  - Beds · Baths · Sqft · Year built
  - Neighborhood, City, State (NOT full address)
  - Lot size optional
- Guess input:
  - Slider primary input (logarithmic scale, $50K to $20M)
  - Manual entry as alternate ("Type a number")
  - Current guess displayed huge: "$1,250,000"
- Submit button: "Lock it in"

**Interactions:**
- Slider has haptic feedback on mobile, satisfying click on desktop
- Photo carousel auto-advances first photo only, then waits for user
- Floor plan (if available) toggles in/out via tab
- Map preview is BLURRED until reveal (shows neighborhood shape only)

**States:**
- Browsing (no guess yet, button disabled)
- Guessing (slider active, button accent)
- Submitting (button shows spinner, slider locks)
- Revealed (transitions to 3.3)

### 3.3 Result Reveal (`/play` — overlay state)

**Purpose:** The dopamine moment. Make this feel like a game show.

**Layout:**
- Photo dims to 40% opacity
- Center stage:
  - Headline reaction copy ("So close!" / "Way off." / "You nailed it.")
  - Your guess: "$1,250,000" (smaller, ink color)
  - Actual price: "$1,425,000" (display XL, accent color, ticker animation)
  - Delta: "−$175,000 · 87% accurate"
  - Score this round: "+87 points"
- Map unblurs with smooth animation
- Full address now visible
- Photo gallery stays accessible
- CTAs: "Next round" (primary) / "Save this home" (heart icon)

**Reactions tier:**
- Within 2%: "Are you a real estate agent?" + confetti
- Within 5%: "You nailed it." + subtle sparkle
- Within 15%: "Solid guess."
- Within 30%: "In the ballpark."
- Within 50%: "Not quite."
- Beyond 50%: "Yikes." / "What were you thinking?"

### 3.4 Round Summary (`/play/summary`)

**Purpose:** End-of-game ritual. Shareable.

**Layout:**
- Total score, big and centered
- Per-round mini-recap: 10 small cards, each showing thumbnail + your guess vs actual + score
- Best round highlighted
- Worst round highlighted (with humor)
- Share card preview (Wordle-style emoji grid for accuracy):
  - 🟩 = within 5%
  - 🟨 = within 15%
  - 🟧 = within 30%
  - 🟥 = beyond 30%
- Buttons: "Share result" / "Play again" / "Daily challenge"

### 3.5 Daily Challenge (`/daily`)

**Purpose:** Recurring engagement loop. Same 5 homes for everyone, every 24 hours.

Same as game round but:
- Header changes to "Daily — May 9"
- Cannot replay once completed
- Shareable result tile shows "#142 today"
- Global leaderboard glimpse at end

### 3.6 Saved Homes (`/saved`)

**Purpose:** Hedonic browsing layer. The "I'd actually live there" Pinterest feel.

**Layout:**
- Pinterest-style masonry grid of saved homes
- Each card: hero photo, price, neighborhood, your guess accuracy
- Filter chips: All · Under $500K · $500K-$1M · $1M-$3M · Over $3M
- Sort: Recent · Closest guess · Worst guess (this is the funny one)
- Empty state: warm illustration of an empty room

### 3.7 Profile / Stats (`/me`)

**Purpose:** Light identity, progress, social proof.

**Layout:**
- Display name (no real names required)
- Streak counter, total games, average accuracy
- Accuracy distribution histogram
- Best market (where you guess most accurately): "You're a Brooklyn expert"
- Worst market: "Las Vegas remains a mystery to you."
- Recent activity feed

### 3.8 Onboarding (first session)

**Purpose:** Get user playing within 30 seconds. NO account required to start.

- Step 1: "Quick test round, no pressure" → loads a forgiving listing
- Step 2: After their first guess, show how scoring works inline
- Step 3: Offer save-progress (email or social, optional)

---

## 4. Component Library

### Buttons
- **Primary:** Accent fill, ink text, no border-radius below 12px (we want soft but not pillow-soft), subtle press-down animation
- **Secondary:** Ink outline, transparent fill, ink text
- **Ghost:** No border, ink text, underline on hover
- **Icon:** 44x44 minimum touch target

### Cards
- **Listing card:** Photo top, content padded 20px, subtle shadow, hover lift
- **Stat card:** Number prominent, label below in caption style
- **Result card:** Photo + guess vs actual + accuracy badge

### Input: Price Slider
- Custom-built. Logarithmic scale. Major tick marks at $100K, $250K, $500K, $1M, $2M, $5M, $10M.
- Thumb shows current value as a pill above
- Track has subtle gradient hint at the extremes
- Manual entry tab swaps slider for keyboard input

### Input: Photo Carousel
- Swipe gesture priority on touch
- Keyboard arrows on desktop
- Pagination dots clickable
- Photos preload next 2 ahead
- Lazy load beyond
- Photo counter "3 of 14" in corner

### Badges
- **Accuracy badge:** Pill shape, color-coded by tier
- **Round counter:** Pill with current/total
- **Streak flame:** 🔥 icon + number, hand-drawn feel

### Toasts & Feedback
- Top-center on desktop, bottom on mobile
- Auto-dismiss 3s
- Stack max 3
- Animate in from edge with slight overshoot

### Modals
- Backdrop blur 12px + 60% opacity ink
- Modal max-width 480px, centered
- Close on escape, click-outside, X button
- Slide up from bottom on mobile

---

## 5. States & Edge Cases

**Loading:** Always use skeleton screens, never spinners as primary loading state. Grain texture on skeletons.

**Empty:** Always include a warm illustration + helpful copy + clear next action. Never just say "No results."

**Error:** Plain language, never error codes user-facing. "Couldn't load that home — let's try a different one." Always recoverable.

**Offline:** Last-loaded round playable, score syncs when back online.

**Slow network:** Show photo placeholders with dominant color extracted from photo. Progressive image loading.

**No photos for a listing:** Skip that listing in rotation, log to ingestion pipeline as quality issue.

---

## 6. Accessibility

- WCAG AA minimum, AAA where feasible.
- All game actions keyboard-navigable.
- Slider has number input alternate (mandatory).
- Screen reader announces price reveals via aria-live.
- Color is never sole indicator of feedback (icon + text + color).
- Reduced motion respected via prefers-reduced-motion.
- Focus states bold and obvious (3px ink outline, 2px offset).

---

## 7. Sharing & Social

**Share card format (Wordle DNA):**
```
Pricetag #142
🟩🟨🟩🟧🟥
85% accurate · 4-day streak
play.pricetag.app
```

Optional rich preview (OG image): hero photo of one of the day's homes, blurred slightly, with score overlay.

---

## 8. What Will Make This Memorable

The ONE thing someone tells a friend about:

> "It's like Zillow surfing but it tells you when you're full of shit about real estate prices."

Design implications:
- The reveal moment must hit. Sound (optional, off by default), motion, color, copy all peak here.
- The personality in copy is non-negotiable. Generic "Score: 85%" kills the product.
- The photo treatment must respect the homes. They're the actual content.

---

## 9. Out of Scope (V1)

- User-uploaded listings
- Multiplayer real-time
- Native mobile apps
- Voice/audio walkthroughs
- AR/VR
- Real estate agent features (this is a game, not a tool)

---

## 10. Asset Deliverables Requested from Claude Design

1. Logo + wordmark (3 variants: full, mark only, monochrome)
2. Color tokens exported as CSS variables and Figma styles
3. Typography specimen sheet
4. Component library: buttons, cards, slider, carousel, badges, modals (all states)
5. Key screens at desktop (1440), tablet (768), mobile (375):
   - Landing
   - Game round (browsing + revealed states)
   - Round summary
   - Saved homes
6. Empty state illustrations (3-4)
7. Reaction copy bank (50 lines across accuracy tiers)
8. Share card template (PNG export logic)
9. Iconography set (24-32 icons, line + filled variants)
10. Motion specs document (timing, easing, key animations)

---

## Appendix: Inspiration Boards

- GeoGuessr's round structure and reveal animation
- Wordle's share card simplicity
- Letterboxd's typography and warm cream palette
- Zillow's photo treatment (but warmer, more curated)
- Apple Maps' dimensional cartography
- Are.na's editorial restraint
- Cabin Porn / Dwell magazine's home photography aesthetic
