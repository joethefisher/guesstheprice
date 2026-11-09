import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile smoke suite for guesstheprice.ai.
 *
 * Targets the exact regression class we just fixed: horizontal overflow
 * at phone widths. The suite runs on three real iOS viewports to catch
 * the smallest (iPhone SE) up through the wider "Plus" sizes.
 *
 * Default: runs against `npm run dev` on localhost:3000, which the
 * webServer block boots automatically if it's not already running.
 * Override with SMOKE_TEST_URL to point at a deployed URL (useful for
 * verifying Vercel previews without pulling the app locally).
 *
 * Browser scope: Chromium only — this is a layout smoke check, not a
 * cross-engine compatibility test. Add webkit/firefox later if cross-
 * engine coverage becomes a goal.
 */
export default defineConfig({
  testDir: "./playwright-tests",
  // Generous timeout per test — dev server can be slow on first load
  // while Next compiles the route on demand.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: process.env.SMOKE_TEST_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // Three real mobile widths. Covers the smallest common viewport (SE,
  // 375 — the width every phone-layout fix was designed for) through the
  // size the user owns (16E, 390) and the common "Plus" tier (414).
  //
  // Chromium (not WebKit) is deliberate: this suite checks layout
  // regressions (no horizontal overflow), not Safari-specific rendering
  // quirks. Keeps the CI install time to 1 browser (~100 MiB) instead
  // of 3 (~500 MiB), and the viewport widths are what drives the layout
  // CSS we actually care about.
  projects: [
    {
      name: "iphone-se",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
      },
    },
    {
      name: "iphone-16e",
      // 390x844, matches what the user has been testing on.
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
      },
    },
    {
      name: "iphone-plus",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 414, height: 896 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
      },
    },
  ],

  // Boot `npm run dev` automatically if we're testing localhost. Skipped
  // when SMOKE_TEST_URL is set (then we're testing a remote URL).
  webServer: process.env.SMOKE_TEST_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
