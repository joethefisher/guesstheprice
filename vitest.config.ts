import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Default: node env (fast) for pure-function tests. Component tests
    // opt into jsdom per-file with `// @vitest-environment jsdom` at the
    // top of the file, so we don't pay the jsdom startup cost on tests
    // that don't need it.
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    // Keep vitest out of playwright-tests/ — Playwright has its own
    // runner and syntax (test imports from @playwright/test); vitest
    // would fail to run those files.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/playwright-tests/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
