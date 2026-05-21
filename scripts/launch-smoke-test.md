# Pre-launch smoke test

Two browser-side checks I couldn't automate from the CLI. Do these on the
deployed Vercel preview (or `npm run dev` locally) before flipping the
GitHub repo to public.

## 1. Auth flow (Next 16 + next-auth beta — highest regression risk)

Highest-priority because we've been bitten before by next-auth beta
breaking between releases, and Next 16 changed enough that this combo
hasn't actually been exercised end-to-end yet.

- [ ] Open `/auth/signin` in an incognito window.
- [ ] Sign in as `joethefisher`.
- [ ] Confirm you land on `/` and see the user nav pill in the header.
- [ ] Click the user nav pill → "My profile" — confirm `/profile` renders
      and shows games, daily progress, recent activity.
- [ ] Hit `/leaderboard` — confirm your username appears.
- [ ] Sign out from the user pill menu.
- [ ] Confirm you're redirected to `/` and the pill is gone.
- [ ] Open `/auth/signup` — confirm the "no password recovery" disclaimer
      is visible under the password field.

If any step 4xx/5xx's, the next-auth beta is broken under Next 16 — roll
back the next.js bump (revert commit `chore(deps): bump next.js to v16`)
and reassess.

## 2. Visual QA on key pages

The 24-commit Tailwind sweep last session was CSS-only and has no
screenshot tests. Build green ≠ pixel-correct.

- [ ] **Landing (`/`)** — desktop. Hero photo loads, headline reads
      "Guess the price." (with accent-orange "price."), bottom strip
      shows 24-hour stat + top scorer + "Now showing". Eyebrow text in
      the bottom strip should be readable against the dark gradient
      (this was the bug we fixed yesterday — verify it stuck).
- [ ] **Landing** — mobile (375w). Confirm headline doesn't wrap weirdly,
      buttons aren't clipped, bottom strip doesn't crowd.
- [ ] **`/play`** — play one full freeplay round. Slider works,
      lock-in submits, reveal overlay renders correctly. Number ticker
      animates. Confetti fires on a nailed/expert guess.
- [ ] **`/play/summary`** — finish 5 rounds. Hero scoreboard shows the
      total + accent color. Round cards in the 5-column grid. "Best
      market" + "Worst guess" cards render.
- [ ] **`/daily`** — intro screen ("One house. One guess."), then
      `/daily` play. Submit, see reveal, then locked state.
- [ ] **`/profile`** — signed-in. Hero + 4 stat cards + accuracy
      breakdown + last 14 days heatmap + recent freeplay games each
      show their "X% avg" sublabel.
- [ ] **`/leaderboard`** — both tabs (High Scores, Streaks).
- [ ] **`/saved`** — masonry layout, filter chips, sort chips. Confirm
      saved-before-guess homes show "Saved before guess" instead of a
      price.
- [ ] **`/auth/signin`** + **`/auth/signup`** — form inputs aren't
      misaligned, focus rings appear on tab navigation, the disclaimer
      is visible.

## 3. Security headers (one-line confirmation)

```bash
curl -sI https://guesstheprice.ai/ | grep -iE 'strict-transport|x-frame|x-content|referrer|permissions'
```

Expected: all five headers present on the deployed site.

## 4. Image proxy on prod

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  'https://guesstheprice.ai/_next/image?url=https%3A%2F%2Fexample.com%2Ftest.jpg&w=640&q=75'
```

Expected: `400`. If 200, the prod env still has the old wildcard pattern
— force-redeploy.
