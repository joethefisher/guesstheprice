# Business-metrics SQL — paste into Supabase SQL editor

These five queries answer "is the game growing / sticky / healthy?" without
leaving the DB. Each runs as-is against the production Postgres (schema in
`prisma/schema.prisma`). Paste into Supabase → SQL editor → Run.

For a real dashboard later: wire Metabase or Grafana against this same DB,
reusing these queries as the base cards. For now, bookmark this file.

Related: Vercel Analytics has its own dashboard for page views + the 10
custom events instrumented via `src/lib/analytics.ts` (game_started,
round_submitted, game_completed, daily_opened, daily_submitted,
daily_streak_milestone, home_saved, result_shared, notify_me_subscribed,
sign_up_completed). Those two surfaces complement each other — SQL for
the underlying DB truth, Analytics for the behavioral funnel.

---

## 1. Daily active users (last 30 days)

Distinct sessions that completed a game OR submitted a daily, bucketed by
calendar day in ET. Freeplay sessions without accounts count via
`Game.sessionId`.

```sql
SELECT
  DATE_TRUNC('day', ("completedAt" AT TIME ZONE 'America/New_York'))::date AS day_et,
  COUNT(DISTINCT COALESCE("userId", "sessionId")) AS dau
FROM "Game"
WHERE "completedAt" IS NOT NULL
  AND "completedAt" >= NOW() - INTERVAL '30 days'
GROUP BY day_et
ORDER BY day_et DESC;
```

---

## 2. Weekly retention — users who played this week AND last week

The core stickiness number. Returns a single row: how many distinct users
appeared in the last ISO week AND the week before. Divide by last-week's
user count for retention %.

```sql
WITH last_week AS (
  SELECT DISTINCT COALESCE("userId", "sessionId") AS user_key
  FROM "Game"
  WHERE "completedAt" >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
    AND "completedAt" <  DATE_TRUNC('week', NOW())
),
this_week AS (
  SELECT DISTINCT COALESCE("userId", "sessionId") AS user_key
  FROM "Game"
  WHERE "completedAt" >= DATE_TRUNC('week', NOW())
)
SELECT
  (SELECT COUNT(*) FROM last_week) AS last_week_users,
  (SELECT COUNT(*) FROM this_week) AS this_week_users,
  (SELECT COUNT(*) FROM last_week l
   INNER JOIN this_week t ON l.user_key = t.user_key) AS retained,
  ROUND(
    100.0 *
    (SELECT COUNT(*) FROM last_week l
     INNER JOIN this_week t ON l.user_key = t.user_key) /
    NULLIF((SELECT COUNT(*) FROM last_week), 0),
    1
  ) AS retention_pct;
```

---

## 3. Game completion rate — last 7 days

What fraction of started games complete all 5 rounds? Started = row exists
in `Game`; completed = `completedAt IS NOT NULL`.

```sql
SELECT
  COUNT(*) AS started,
  COUNT("completedAt") AS completed,
  ROUND(100.0 * COUNT("completedAt") / NULLIF(COUNT(*), 0), 1) AS completion_rate_pct
FROM "Game"
WHERE "startedAt" >= NOW() - INTERVAL '7 days'
  AND "gameType" = 'freeplay';
```

---

## 4. Score distribution — all freeplay completions, last 30 days

Histogram by quartile. Tells you if players are mostly nailing it,
mostly off, or everywhere. Use this to decide if the tier thresholds
need adjustment.

```sql
SELECT
  CASE
    WHEN "totalScore" >= 400 THEN '400+ (expert)'
    WHEN "totalScore" >= 300 THEN '300-399 (solid)'
    WHEN "totalScore" >= 200 THEN '200-299 (ballpark)'
    WHEN "totalScore" >= 100 THEN '100-199 (off)'
    ELSE '0-99 (yikes)'
  END AS score_bucket,
  COUNT(*) AS games,
  ROUND(AVG("avgAccuracy")::numeric, 1) AS avg_accuracy_pct
FROM "Game"
WHERE "completedAt" IS NOT NULL
  AND "completedAt" >= NOW() - INTERVAL '30 days'
  AND "totalScore" IS NOT NULL
GROUP BY score_bucket
ORDER BY MIN("totalScore") DESC;
```

---

## 5. Hardest listings — lowest average accuracy

Which specific homes trip up players most? Useful for identifying
listings to feature in "hard mode" or flag for quality review if the
difficulty is from bad data rather than genuine ambiguity.

```sql
SELECT
  l.id,
  l."streetAddress",
  l.city,
  l.state,
  l."soldPrice",
  COUNT(r.id) AS times_guessed,
  ROUND(AVG(r.accuracy)::numeric, 3) AS avg_accuracy,
  ROUND(AVG(ABS(r.guess - l."soldPrice"))::numeric) AS avg_dollar_error
FROM "Round" r
INNER JOIN "Listing" l ON r."listingId" = l.id
WHERE r.accuracy IS NOT NULL
  AND r."guessedAt" >= NOW() - INTERVAL '30 days'
GROUP BY l.id, l."streetAddress", l.city, l.state, l."soldPrice"
HAVING COUNT(r.id) >= 5
ORDER BY avg_accuracy ASC
LIMIT 25;
```

---

## Notes for extending this file

- **Notify waitlist growth**: `SELECT DATE_TRUNC('day', "createdAt"), COUNT(*) FROM "NotifyWaitlist" GROUP BY 1 ORDER BY 1 DESC;`
- **Saved-home engagement** (signed-in only): `SELECT COUNT(DISTINCT "userId") FROM "SavedHome" WHERE "savedAt" >= NOW() - INTERVAL '7 days';`
- **Ingestion freshness**: `SELECT MAX("startedAt") AS last_ingest FROM "IngestionRun" WHERE status = 'completed';`

When any of these snippets becomes a daily-check habit, graduate it to
a Metabase/Grafana card against this same DB. Until then, the file is
the source of truth.
