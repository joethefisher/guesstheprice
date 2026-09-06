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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
