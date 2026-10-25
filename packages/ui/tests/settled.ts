// The public helper: one implementation for the suite and for apps (`@codeatlasdev/ui/testing`).
export { settled } from "../src/lib/testing";

/**
 * Test-level budget for multi-step keyboard/typing flows. Every Playwright step (fill, key press,
 * `expect.element`) is a CDP round trip that costs hundreds of ms to seconds when the machine is
 * starved (full suite on many workers, CI under load), so a flow of ~15 steps outgrows Vitest's 15s
 * default without anything being wrong. Pass as the last argument to `it`.
 */
export const SLOW_FLOW = 120_000;
