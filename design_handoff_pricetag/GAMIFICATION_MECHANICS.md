# Pricetag — Gamification: Mechanics Spec

**Goal:** Add structural gameplay systems that give every session more variety, more decision-making, and more long-term progression. Players should have something new to discover for the first ~30 sessions, and meaningful reasons to return after that.

**Principle:** Mechanics are layered onto the existing 10-round loop without disrupting it. A new player can still play a "vanilla" round and have the experience the brief describes. Every mechanic below is *additive* — it can be soft-launched independently.

This doc pairs with `GAMIFICATION_JUICE.md`. Juice is the felt experience; this is the system underneath.

---

## 1. Combo multiplier (cross-references juice spec)

See `GAMIFICATION_JUICE.md` §2 for visuals. Mechanic summary:

- `combo` integer, in-game state
- Increments on Hot tier or better (`pctOff ≤ 0.10`)
- Resets on Off/Yikes (`pctOff > 0.30`)
- Holds (no increment, no reset) on Solid/Ballpark (`0.10 < pctOff ≤ 0.30`)
- Multiplier applied to that round's points: stored on each `RoundResult` as `multiplier: number` and `pointsRaw: number` so summary can show pre/post-multiplier breakdown
- Total game score = sum of `points × multiplier` per round

### Edge cases

- Skipped round: combo holds (no change), 0 points awarded
- Power-up "Zillow Peek" used: that round's multiplier capped at ×1.5 even if combo is higher
- Streak tracking on the home screen (existing `streak`) is per-day, separate from in-game combo

---

## 2. Power-ups / lifelines

Each game grants 2 power-up charges, total. They appear as small icon buttons in the top bar, next to the streak flame. Tapping consumes a charge and applies the effect to the *current* round only.

### 2.1 Available power-ups

| Power-up        | Icon  | Effect                                                      | Cost | Cap on combo | Notes                          |
|-----------------|-------|-------------------------------------------------------------|------|--------------|--------------------------------|
| Zillow Peek     | 🔍    | Reveals one comparable sale ($price + neighborhood) below the photo | 1 charge | ×1.5 | Comp is ±15% of true price |
| Narrow the Field| 📐    | Slider min/max snap to a 50% range centered on true price   | 1 charge | ×1.5 | Visible green-tinted band on slider |
| Neighbor        | 🏘️   | Shows one stat: avg price for the same zip                  | 1 charge | ×2.0 | Mildest hint, smallest cap      |

User starts each game with 2 charges, allocated as the user wishes. Daily challenge restricts to **1 charge** (harder). Hard mode disables power-ups entirely.

### 2.2 Earning more charges

- +1 charge per achieved Bullseye (max stockpile of 5)
- +1 charge for completing a 7-day streak
- Charges persist across games in user state, displayed on the landing screen as a small "🔍 ×3" indicator

### 2.3 UI

- Power-up bar slides in from the right of the top header
- Tapping a power-up: confirm modal ("Use Zillow Peek? You have 2 left.")
- Used power-up animates: icon fades to disabled state, sound `power_up`, brief overlay shows the hint info

### 2.4 Data model

```ts
type UserState = {
  charges: { peek: number; narrow: number; neighbor: number };
  // ...
}

type RoundResult = {
  // ...existing fields...
  powerUpUsed: "peek" | "narrow" | "neighbor" | null;
  multiplier: number;
  pointsRaw: number;     // pre-multiplier
  points: number;        // post-multiplier
}
```

---

## 3. Bonus rounds

Every 4th round in a 10-round game (rounds 4 and 8) is a *bonus round* with a twist. Announced in the between-round stinger (juice §6) with "BONUS ROUND" in accent.

### 3.1 Bonus round variants (random selection per game)

| Variant         | Twist                                                             | Multiplier on points |
|-----------------|-------------------------------------------------------------------|----------------------|
| Specs Only      | No photos. Property facts + floorplan only                        | ×2                   |
| Photos Only     | No facts. Photos + city only                                      | ×2                   |
| Lightning       | 20-second timer (see §4); fast accuracy bonus                     | ×1.5 + speed bonus   |
| Mystery City    | City label hidden. Reveal includes "Where in the world?" with map | ×2                   |
| Tandem          | Two homes side-by-side; guess both, score is min(both accuracies) | ×2                   |

Each game gets one of each rarity tier, picked deterministically from a daily seed (so daily-challenge bonus rounds are the same for everyone).

### 3.2 UX

- Top bar pill changes from "ROUND 04" to "BONUS — Specs Only" in accent color
- The reveal stamp shows "BONUS BULLSEYE!" etc. with the bonus badge stacked
- Summary distinguishes bonus rounds with a small ⚡ marker on the round card

---

## 4. Lightning rounds (per-round timer, optional via mode)

Hard mode toggle (already in tweaks panel) enables a 30-second timer on every round. Lightning bonus round (§3.1) uses a 20-second timer regardless.

### 4.1 Timer UX

- Slim progress bar at top of the play screen, full width, drains left-to-right
- Color stages: paper → gold (last 10s) → flag (last 5s) with a pulse
- Sound: subtle metronome tick last 5 seconds (1Hz, increasing pitch each tick)
- At 0:00, the current slider position auto-locks-in. Reveal proceeds normally.

### 4.2 Speed bonus

- Lock-in within 5s: +20 bonus points
- Within 10s: +10 bonus points
- Within 15s: +5 bonus points
- After 15s: no bonus

Speed bonus is shown on reveal as a 4th metric ("Speed bonus: +20") in the metric strip.

---

## 5. XP and progression

Every point earned is also an XP point. Players level up at thresholds, granting a title and (optionally) cosmetic unlocks.

### 5.1 Level table

| Level | XP threshold | Title          | Unlock                                  |
|-------|--------------|----------------|-----------------------------------------|
| 1     | 0            | Browser        | (start)                                 |
| 2     | 250          | Open House     | Alt accent: Sage                        |
| 3     | 750          | Junior Agent   | Share card frame: Embossed              |
| 4     | 1,750        | Realtor        | Alt accent: Cobalt                      |
| 5     | 3,500        | Senior Agent   | Map style: Architect                    |
| 6     | 6,000        | Broker         | Alt accent: Plum                        |
| 7     | 9,500        | Closer         | Share card frame: Foil                  |
| 8     | 14,000       | Top Producer   | Alt display font: DM Serif              |
| 9     | 20,000       | Mogul          | Power-up: extra charge per game         |
| 10    | 30,000       | Tycoon         | Gold wordmark on share card             |

### 5.2 Level-up moment (on summary screen)

When the summary calculation pushes the user over a threshold:

- A new card appears below the share card: "LEVEL UP" with the new title in display italic
- Card unfolds with a 600ms reveal animation, sound `level_up`
- Shows the cosmetic unlock with a "Equip" CTA
- Persists in user state; subsequent summaries don't show level card unless another threshold was crossed

---

## 6. Achievements / badges

A wall of stamps the user collects. Locked = grayed silhouette, unlocked = full color with date.

### 6.1 Achievement list (V1, ~20 to start)

| Stamp           | Trigger                                                              | Tier     |
|-----------------|----------------------------------------------------------------------|----------|
| First Sale      | Complete first game                                                  | Bronze   |
| Steel Trap      | 5 close-calls (Hot+) in a single game                                | Silver   |
| Sniper          | 3 Bullseyes in a single game                                         | Gold     |
| Cold Read       | Bullseye on a home with <3 photos viewed                             | Gold     |
| Coastal Elite   | All California homes 90%+ in one game                                | Silver   |
| Bicoastal       | 90%+ on both NYC and SF in one game                                  | Silver   |
| Flyover         | 90%+ on a Midwest home                                               | Bronze   |
| Goated          | Hit a ×3.0 combo                                                     | Gold     |
| Streak Master   | 7-day login streak                                                   | Silver   |
| Centurion       | 100 games played                                                     | Gold     |
| Speed Demon     | 5 lightning-round speed bonuses in one game                          | Silver   |
| Frugal          | Bullseye on a sub-$500K home                                         | Bronze   |
| Whale Watcher   | Bullseye on a $10M+ home                                             | Gold     |
| The Specs Guy   | Win a "Specs Only" bonus round with 95%+                             | Silver   |
| Photographer    | Win a "Photos Only" bonus round with 95%+                            | Silver   |
| Comeback Kid    | Recover from a Yikes to a Bullseye in consecutive rounds             | Gold     |
| Pure            | Complete a 10-round game without using a power-up                    | Silver   |
| Daily Devotee   | Complete 30 daily challenges                                         | Gold     |
| Globalist       | Hit 90%+ in 10 distinct cities (across games)                        | Silver   |
| Honest Mistake  | Off by exactly $0 (dead match)                                       | Platinum |

### 6.2 Surfacing

- Stats screen has a "Trophy Case" section: 4-column grid of stamps, locked ones grayed
- Toast on unlock: "🏆 Sniper unlocked" appears top-right during the summary screen, animates in with sound `unlock`
- Tapping a stamp opens a detail card: the achievement title, the trigger, the date earned, and how rare it is (% of players who have it)

### 6.3 Data model

```ts
type Achievement = {
  id: string;
  unlockedAt: number | null;  // ms timestamp, null = locked
}

type UserState = {
  // ...existing...
  level: number;
  xp: number;
  achievements: Record<string, Achievement>;
}
```

---

## 7. City passport

Light progression layer that surfaces existing data. Every city has a passport stamp; you earn it by hitting Solid or better on any home in that city.

### 7.1 Stamp design

Each city stamp is a circular illustration: a rough postmark-style ring with the city silhouette / icon in the center, the city name around the perimeter, and a date stamped diagonally across when earned.

### 7.2 Passport screen

New tab in the floating nav (alongside Saved): "Passport". A grid of all available cities, locked ones grayed.

- Tap stamp: opens a detail view — your best guess accuracy in that city, your worst, total games played there
- "Specialist" status when you have 5+ games in a city all at Solid+
- Map view: stylized world map with pins on visited cities

---

## 8. Daily challenge upgrades

Existing daily concept stays. Add:

### 8.1 Daily mutators

Each day's set rotates through theme mutators (visible in the daily card on landing):

- "Tiny Homes" — all homes < 1500 sqft
- "Mansions" — all > 5000 sqft
- "Pre-1950"
- "California Cool"
- "Brutalist"
- "Eat Your Greens" (homes with notable yards)
- "Studio Hour" — all studios

The mutator is shown on the landing card and on the daily summary share text.

### 8.2 Daily leaderboard

After completing daily, show:

- "You scored 837. You beat 73% of players today."
- "Top score today: 962 by @margaux_b"
- Tappable: opens a small modal with top-10 board for today

### 8.3 Streak rewards

| Streak | Reward                                       |
|--------|----------------------------------------------|
| 3 days | Unlock hard mode                             |
| 7 days | +1 power-up charge per game (permanent)      |
| 14 days| Unlock alt color theme: Midnight             |
| 30 days| Gold wordmark + "Loyal" achievement          |
| 100 days| Foil share card + "Devotee" achievement      |

Streak shield: one "skip day" allowed per 30 days (auto-applied if you miss a day after completing 7+ in a row).

---

## 9. Ghost players (social pressure, low-friction)

After lock-in, before reveal opens, a 1.2s suspense beat shows:

- Slider becomes static
- Tick marks light up where other players guessed (anonymous, anonymized to nearest 5%)
- "423 people guessed near here" caption fades in
- Then reveal proceeds

### 9.1 Implementation

- Server stores anonymized guess distribution per listing per day
- Client fetches when reveal is about to fire (preload with the listing data)
- Distribution shown as small accent dots above the slider track, sized by frequency
- Privacy: never link guesses to individuals

If offline / no data, this beat is skipped (no network = no ghosts, reveal proceeds normally).

---

## 10. Daily share card upgrades

Current share card is solid Wordle DNA. Upgrades:

- Mutator badge in the corner: "🌵 Tiny Homes day"
- Leaderboard rank: "#142 today" (matches brief §3.4)
- Streak indicator: "🔥 12-day streak"
- Foil/Embossed/Gold frames if user has unlocked them
- A QR-style data block in the corner that, when copied as text, encodes the user's tile pattern + score for friends to reproduce

---

## 11. Rolling user state schema (full)

```ts
type UserState = {
  // Identity (optional, for V2)
  handle: string | null;

  // Progression
  xp: number;
  level: number;
  achievements: Record<string, Achievement>;
  passport: Record<CityId, { firstSeen: number; bestAccuracy: number; gamesPlayed: number }>;

  // Streak
  loginStreak: number;
  lastLoginAt: number;       // ms
  shieldUsedAt: number | null;

  // Inventory
  charges: { peek: number; narrow: number; neighbor: number };

  // Stats
  totalGamesPlayed: number;
  totalBullseyes: number;
  bestSingleGame: number;
  averageAccuracy: number;   // running

  // Settings (juice spec ties in here)
  settings: {
    sound: boolean;
    soundVolume: number;     // 0–100
    music: boolean;
    confetti: "full" | "minimal" | "off";
    screenShake: boolean;
    haptics: boolean;
    reducedMotion: "auto" | "on";
    accentTheme: "coral" | "sage" | "cobalt" | "plum" | "midnight";
    displayFont: "fraunces" | "dmserif" | "recoleta";
  };

  // Daily
  dailyHistory: Record<DateString, { score: number; accuracy: number; rank: number; mutator: string }>;
}
```

Persist to `localStorage` for V1; migrate to backend when accounts are introduced.

---

## 12. Recommended ship order

If shipping incrementally rather than all at once:

1. **Combo multiplier + flame visuals** (juice §2 + mechanics §1) — biggest felt impact for least work
2. **Sound design** (juice §3) — binary "feels like a game" upgrade
3. **Reveal upgrades** (juice §1, all of it) — bullseye theatrics, stamp, ticker, shake
4. **Achievements** (mechanics §6) — collection hook activates
5. **Power-ups** (mechanics §2) — adds decision-making
6. **Bonus rounds** (mechanics §3) — adds variety
7. **XP / levels** (mechanics §5) — long-term hook
8. **City passport** (mechanics §7) — surfaces existing data nicely
9. **Daily upgrades** (mechanics §8) — extends daily's pull
10. **Lightning timer** (mechanics §4) — opt-in mode
11. **Ghost players** (mechanics §9) — needs backend, ship later

Each row above is independently shippable. Don't gate any of them on the next.

---

## 13. Anti-patterns to avoid

- **No gacha, no lootboxes, no "energy" timers, no "watch ad to continue"**. This is a paid/free game with a soul, not a slot machine.
- **No paywalled cosmetics in V1.** Every unlock is earned through play.
- **No leaderboards that rank strangers head-to-head globally** — the social layer should feel like Letterboxd, not Call of Duty. Daily rank and friend-comparison only.
- **No XP grind walls.** Levels should feel naturally earned by the user who's having fun anyway. If a level takes more than ~10 sessions to reach, raise the XP awarded.
- **No achievement spam.** ~20 achievements at launch. Add more carefully, never more than 5 per quarter.
- **No streak shame.** If a user breaks a streak, the copy should say "see you tomorrow," never "you lost your streak."
