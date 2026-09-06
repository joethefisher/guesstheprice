// Global test setup. Loaded by every test regardless of environment.
// The jest-dom matcher extensions are only meaningful in jsdom, but
// importing them here is a no-op in node env, so it's safe to have
// unconditionally.
import "@testing-library/jest-dom/vitest";

// rAF polyfill for jsdom — some component effects (e.g. number-ticker
// animations) call requestAnimationFrame during mount, which jsdom does
// not provide out of the box. Cheap shim; no-op if the runtime already
// has it (node has it since v16 too).
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16) as unknown as number);
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id));
}
