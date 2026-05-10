# Pricetag — Gamification: Juice Spec

**Goal:** Transform the existing polished-but-quiet feel into something that *snaps*. Every guess should produce a satisfying physical reaction. Every close call should feel like a small win. Every bullseye should feel like a slot-machine jackpot.

**Principle:** Juice is layered on top of the existing aesthetic — it does not replace the editorial restraint. The serif headlines, paper background, and accent restraint stay. We are adding *reaction* and *anticipation*, not visual chaos.

**Reduced motion:** Every effect in this doc must respect `prefers-reduced-motion: reduce` — fall back to instant or near-instant transitions, no shake, no confetti, no flash. Sound is off by default and toggleable globally.

---

## 1. Reveal moment — the dopamine peak

The current reveal is well-composed but emotionally flat. Make it *physical*.

### 1.1 Tier system (drives all reaction strength)

| Tier         | Range (`pctOff`) | Color      | Stamp text   | Sound key       | Confetti | Screen shake | Haptic        |
|--------------|------------------|------------|--------------|-----------------|----------|--------------|---------------|
| Bullseye     | ≤ 0.02           | `--moss`   | "BULLSEYE!"  | `chaching_xl`   | XL gold  | 280ms heavy  | heavy         |
| Nailed it    | ≤ 0.05           | `--moss`   | "NAILED IT"  | `chaching_lg`   | L        | 180ms medium | medium        |
| Hot          | ≤ 0.10           | `--moss`   | "HOT"        | `chaching_md`   | M        | —            | light         |
| Solid        | ≤ 0.15           | `--moss`   | "SOLID"      | `coin_md`       | —        | —            | light         |
| Ballpark     | ≤ 0.30           | `--gold`   | "BALLPARK"   | `coin_sm`       | —        | —            | —             |
| Off          | ≤ 0.50           | `--flag`   | "OFF"        | `thud_md`       | —        | —            | —             |
| Yikes        | > 0.50           | `--flag`   | "YIKES"      | `thud_lg_sad`   | —        | 120ms small  | —             |

`pctOff = abs(guess − price) / price`. Existing `REACTIONS` copy bank in `src/data.js` stays — copy is picked from the tier's bank. Stamp text is the *short* word above; the longer reaction line below.

### 1.2 Stamp animation

A rubber-stamp effect drops onto the modal at a 6° rotation, scaling from 1.4 → 1.0 with overshoot, with a subtle ink-bleed shadow.

- 360ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` (back-out)
- Scale `1.4 → 1.0`, opacity `0 → 1`, rotate `0deg → -6deg`
- After landing: 80ms 0.5° wobble, then settle
- Bullseye/Nailed it: stamp is foiled — gradient sweep across the letterforms (animated `background-position` shimmer, 1200ms after landing)

### 1.3 Number ticker upgrades

Current ticker is fine but boring. Upgrades:

- **Tier-based duration:** bullseye = 1600ms (slow build), nailed = 1100ms, hot/solid = 900ms, off/yikes = 600ms (rip-the-bandaid quick)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo out) — slow start, fast finish, slight settle
- **Tick sound:** soft tick every 100ms during the count (gated by sound toggle)
- **Last digits hesitation:** at 90% of duration, slow to 0.3× speed for the final ~12 frames — feels like a slot reel landing
- **Color shift on land:** for bullseye/nailed, the price flashes to `--gold` for 200ms then settles to accent

### 1.4 Price-tag drop animation (replaces the current quiet reveal)

A literal price tag SVG falls from above the actual-price label and slaps into place underneath the number.

- Tag shape: rectangle with one notched corner + circle eyelet, in `--ink`, with the tier word in paper-color condensed type
- Trajectory: starts at `y: -120px, rotate: -28deg`, falls with gravity easing (`cubic-bezier(0.5, 0, 0.75, 0)`), lands at `y: 0, rotate: 8deg`
- Impact: 240ms, on land triggers screen-shake + sound + haptic
- After land: 600ms gentle pendulum sway (rotate 8 → 5 → 8 deg) before settling at 6deg

### 1.5 Screen shake

CSS-keyframe `translate3d` shake on `<RevealOverlay>` root. Three intensities:

```
@keyframes shake-light  { 0%, 100% { transform: none } 25% { transform: translate(-1px, -2px) } 50% { transform: translate(1px, 1px) } 75% { transform: translate(-1px, 2px) } }
@keyframes shake-medium { ...amplitudes 3px... }
@keyframes shake-heavy  { ...amplitudes 6px, also 0.5deg rotate... }
```

Apply `animation-duration` from the tier table. Heavy shake also blurs background photo by an extra 4px during shake for ~180ms.

### 1.6 Confetti upgrades

Existing `<Confetti>` works. Upgrades:

- **Tier-scaled count:** Bullseye 140 pieces gold/foil mix · Nailed 80 (existing) · Hot 40 small
- **Foil pieces:** half of bullseye confetti uses CSS conic-gradient backgrounds for holographic shimmer
- **Burst origin:** confetti emits from the price tag's landing point (radial outward + gravity), not just falling top-down
- **Stagger:** 0–600ms staggered emit, not 0–400ms
- **Bullseye-only:** a single large gold "💰" or coin-shape (custom SVG, not emoji) tumbles slowly center-screen

### 1.7 Bullseye-only theatrics

Reserve real fireworks for the rarest moments.

- 200ms full-screen flash to `--paper` overlay at 60% opacity, fading out
- "BULLSEYE!" stamp gets a radiating ink-line burst (8 dashes shooting outward, fading)
- The actual-price number gets a 1200ms gold→accent gradient sweep
- Sound: `chaching_xl` followed by `crowd_cheer_short` (0.8s sample)

---

## 2. Combo / streak system (in-game)

The existing `streak` state is days-played. We add an *intra-game* combo that builds tension across rounds.

### 2.1 Tracking

- A close call is any guess at "Hot" tier or better (`pctOff ≤ 0.10`)
- `combo` increments on each close call, resets to 0 on miss (Off/Yikes), holds (no increment, no reset) on Ballpark
- Multiplier table:

| Combo | Multiplier | Title       | Flame state           |
|-------|------------|-------------|-----------------------|
| 0–1   | ×1.0       | —           | base                  |
| 2     | ×1.2       | "WARM"      | +20% flame size       |
| 3     | ×1.5       | "ON FIRE"   | flame doubles, glows  |
| 5     | ×2.0       | "UNREAL"    | flame + ember sparks  |
| 7     | ×3.0       | "GOATED"    | flame + ring of fire  |

Final round score per round = `points × multiplier`, displayed as `+87 × 1.5 = 130` on the reveal metric card.

### 2.2 Flame visual

Replace the existing `<StreakFlame>` with a tiered version:

- **Base:** existing flicker keyframe
- **WARM (×1.2):** scale 1.2, hue shift slightly toward gold
- **ON FIRE (×1.5):** scale 1.4, glow `box-shadow: 0 0 24px var(--accent)`, second flame layer offset behind for depth
- **UNREAL (×2.0):** ember sparks emit from the top of the flame every 400ms (small dots animating up and fading)
- **GOATED (×3.0):** thin ring of fire (rotating dashed circle) orbits the flame

Each tier-up plays a chime that's a half-step higher than the previous (whole-note scale: C, D, E, G, B). Chime is gated by sound toggle.

### 2.3 Combo break (this is the addictive part)

When the user breaks a 3+ combo:

- The flame literally *shatters* into pieces that fall and fade (12 SVG triangles, 700ms)
- Sound: glass-break sample
- A small inline message in the metric strip: "Combo broken at ×N" in flag color, fades after 2s
- The next round's reveal stamp gets a small "REBUILD" word in caption type underneath, gently nudging recovery

### 2.4 Combo HUD location

Top bar, next to the round pill. The flame grows up to ~36×36 at GOATED, with the multiplier "× 3.0" in tabular numerals next to it in display italic. Subtle pulse on every increment (200ms scale 1 → 1.06 → 1).

---

## 3. Sound design

Master toggle in top-right of every screen (small speaker icon, persistent). Default off. Setting persists in `localStorage` as `pricetag.sound`.

### 3.1 Sound bank

| Key                | Description                                | Trigger                            |
|--------------------|--------------------------------------------|-------------------------------------|
| `tick_slider`      | Soft wood-block tick                       | Slider drag, every $50K crossed     |
| `lock_in`          | Whoosh + soft confirm chord                | Lock it in pressed                  |
| `tick_ticker`      | Subtle digital tick                        | Each 100ms during number ticker     |
| `chaching_xl`      | Cash register full chord + cheer tail      | Bullseye reveal                     |
| `chaching_lg`      | Cash register full chord                   | Nailed reveal                       |
| `chaching_md`      | Cash register short                        | Hot reveal                          |
| `coin_md`          | Two coin clinks                            | Solid reveal                        |
| `coin_sm`          | One coin clink                             | Ballpark reveal                     |
| `thud_md`          | Muted wooden thud                          | Off reveal                          |
| `thud_lg_sad`      | Wooden thud + descending two-note          | Yikes reveal                        |
| `chime_combo_N`    | 5 ascending chimes (C/D/E/G/B)             | Combo tier-up at 2/3/5/7            |
| `glass_break`      | Short glass shatter                        | Combo break                         |
| `power_up`         | Twinkly rising arpeggio                    | Power-up activated                  |
| `power_pickup`     | Soft rising whoosh                         | Power-up earned (rare)              |
| `level_up`         | Triumphant chord                           | XP level-up on summary              |
| `unlock`           | Single chime + click                       | Achievement unlocked                |
| `ambient_play`     | Low warm hum (loop, -24dB)                 | Play screen background, optional    |
| `ambient_summary`  | Cheerful piano loop (-20dB)                | Summary screen background           |
| `transition_round` | Whoosh + soft chord                        | Between-round stinger card          |

### 3.2 Audio implementation

- Use a single `<AudioManager>` singleton (Howler.js recommended, or native Web Audio if size matters)
- Preload all SFX on first user gesture (browser policy)
- Each sample mastered to -14 LUFS, peak -1dBFS
- Master volume slider in settings (0–100, default 50)
- All sounds duck the ambient loop by 6dB during playback
- Tick samples have ±5% pitch randomization to avoid robotic repetition

### 3.3 Sourcing

This bundle does NOT include the audio files. Recommended sources:
- Freesound.org (CC0)
- Zapsplat (free with account)
- Custom commission via a sound designer for the cha-ching tier and combo chimes (these are the signature sounds — worth the investment)

Place audio in `public/audio/` as `.mp3` (broad compatibility) plus `.ogg` fallback. Reference them by key from a manifest (`audio.manifest.json`).

---

## 4. Slider feel

Currently functional. Make it tactile.

- **Tick sound** every $50K crossed (debounced to max 1 per 60ms during fast drags)
- **Subtle haptic** on touch devices at every major tick mark ($100K, $500K, $1M, etc.) via `navigator.vibrate(8)`
- **Magnetic snap zones** at major ticks: within ±2% of a major tick, the thumb subtly accelerates toward it
- **Thumb scale on press:** 1.0 → 1.15 on `:active`, with a soft ring shadow
- **Drag trail:** as the thumb moves, a faint accent-colored trail (gradient overlay on the track) shows recent positions, fading after 300ms

---

## 5. Lock-in animation

The "Lock it in" press is the moment of commitment. Make it feel decisive.

- 80ms button press-down (existing)
- The slider thumb animates a small downward "lock" jiggle (rotate 0 → -8 → 0 deg, scale 1 → 1.1 → 1, 240ms)
- The slider track briefly fills entirely with `--accent` (200ms wash) before fading
- Sound: `lock_in`
- Then the reveal modal scales in from the thumb's position (transform-origin set dynamically)

---

## 6. Between-round stinger

After "Next round" is pressed, before the next round renders, a brief overlay flashes across:

- 500ms total
- Full-screen `--ink` panel slides in from the right (300ms ease-out), holds 100ms, slides out left (200ms)
- Centered: "ROUND 04" in 96px display italic with the round number in accent
- Sound: `transition_round`
- Skipped on `prefers-reduced-motion: reduce` — instead a 120ms paper fade

This is also where bonus-round announcements happen (see Mechanics spec).

---

## 7. Idle / waiting micro-animations

- The wordmark logo's parallelogram does a tiny tilt (4deg → 0 → 4deg, 4s loop) when on landing for >5s
- Photo carousel: if no interaction for 6s, a gentle thumb hint animates over the swipe direction (subtle, fades after 1 cycle)
- The "Lock it in" CTA, once enabled, gets a slow breathing animation (box-shadow scales 1.0 → 1.05 → 1.0, 2.4s ease-in-out infinite) — invitation to act

---

## 8. Performance budget

- All animations must run at 60fps on mid-tier mobile (iPhone 12 / Pixel 6 baseline)
- GPU-friendly: `transform` and `opacity` only — no `top/left/width/height` animations
- Confetti: max 200 simultaneous DOM nodes; recycle with object pool, or use canvas if exceeding
- Sound: max 4 concurrent playbacks; older instances cut
- Total added bundle weight (with audio sprites): under 600KB gzipped

---

## 9. Tweakable from settings

These should be exposed in a Settings panel (new screen) so users can dial down if they want:

- Sound: master toggle + 0–100 volume
- Music (ambient loops): independent toggle
- Confetti: on / minimal / off
- Screen shake: on / off
- Haptics (mobile only): on / off
- Reduced motion: auto-respect / force on

Persist all settings to `localStorage` under `pricetag.settings`.

---

## 10. What this layer does NOT change

- The serif headline + paper background aesthetic
- The accent restraint (one accent moment per screen still holds)
- The reaction copy voice
- The information density of the play screen
- The existing routing / state machine
- The share card design

If a juice element starts to fight the editorial feel, dial it down before adding more. Less juice that lands consistently > more juice that overwhelms.
