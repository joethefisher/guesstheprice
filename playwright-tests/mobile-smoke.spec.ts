import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

/**
 * Mobile smoke suite — asserts every key user-facing route renders at
 * phone widths without the single-most-common mobile regression we just
 * spent a project fixing: horizontal overflow.
 *
 * For each route we check:
 *   1. The page loads (navigation returned a 2xx or 3xx status).
 *   2. document.documentElement.scrollWidth <= window.innerWidth.
 *      That's the binary "nothing extends past the viewport edge" test.
 *   3. No unexpected console errors fired during load.
 *
 * Routes that need auth (profile when signed-out) or specific data
 * (summary needs ?data=) are flagged in the ROUTES list so we test only
 * what's reachable anonymously.
 */

type Route = {
  path: string;
  label: string;
  /** If true, allow loading indicators or client redirects to settle
   *  longer before the overflow check. */
  slow?: boolean;
};

const ROUTES: Route[] = [
  { path: "/", label: "landing" },
  { path: "/play", label: "freeplay", slow: true },
  { path: "/daily", label: "daily (intro / locked)", slow: true },
  { path: "/saved", label: "saved homes" },
  { path: "/leaderboard", label: "leaderboard" },
  { path: "/auth/signin", label: "sign in" },
  { path: "/auth/signup", label: "sign up" },
  { path: "/how-it-works", label: "how it works" },
];

// Console warnings/errors we intentionally ignore because they're either
// third-party noise (Sentry probe failures on local dev with no DSN, Next
// dev-mode hydration warnings during route transitions) or environmental.
const IGNORED_CONSOLE_PATTERNS = [
  /Sentry/i,
  /favicon/i,
  /devtools/i,
  // Next.js dev-mode hot-reload / fast-refresh chatter.
  /Fast Refresh/,
  /Hot Module Replacement/i,
  // Hydration warnings in dev mode on first paint.
  /Hydration failed/i,
  /There was an error while hydrating/i,
  // Third-party map / image loader fetches we don't care about in smoke.
  /Failed to load resource/i,
  // Google Maps auth failure handler we installed intentionally.
  /gm_authFailure/,
];

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (err: Error) => {
    if (IGNORED_CONSOLE_PATTERNS.some((re) => re.test(err.message))) return;
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

async function assertNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth, offsetWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    offsetWidth: document.documentElement.offsetWidth,
    innerWidth: window.innerWidth,
  }));
  // Allow 1px tolerance — sub-pixel rounding on scaled viewports can
  // produce scrollWidth=376 for a 375px viewport without any actual
  // visible overflow.
  expect(
    scrollWidth,
    `horizontal overflow at ${innerWidth}px: scrollWidth=${scrollWidth}, offsetWidth=${offsetWidth}`,
  ).toBeLessThanOrEqual(innerWidth + 1);
}

for (const route of ROUTES) {
  test(`${route.label} (${route.path}) — no horizontal overflow`, async ({ page }) => {
    const consoleErrors = await collectConsoleErrors(page);

    const response = await page.goto(route.path, {
      waitUntil: "domcontentloaded",
    });

    expect(
      response?.status(),
      `navigation failed for ${route.path}`,
    ).toBeLessThan(400);

    // Give Next's client-side effects + framer-motion a moment to settle
    // before measuring. Routes that fetch listings need a bit more.
    await page.waitForLoadState("networkidle", { timeout: route.slow ? 20_000 : 10_000 }).catch(() => {
      // networkidle can time out if an XHR loop is running (e.g., Sentry
      // retries). That's fine — fall back to a short pause.
    });
    await page.waitForTimeout(500);

    await assertNoHorizontalOverflow(page);

    expect(
      consoleErrors,
      `unexpected console errors on ${route.path}:\n  ${consoleErrors.join("\n  ")}`,
    ).toHaveLength(0);
  });
}

// Spot-check that the primary CTA on the landing is visible in the
// viewport without scrolling. Catches regressions where the hero collapses
// or the bottom strip pushes the CTA off-screen.
test("landing — Play 5 rounds CTA is visible above the fold", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const cta = page.getByRole("button", { name: /play 5 rounds/i });
  await expect(cta).toBeVisible();
  const inViewport = await cta.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
  });
  expect(inViewport, "Play 5 rounds CTA is not in the initial viewport").toBe(true);
});
