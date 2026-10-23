import { expect } from "vitest";
import { cdp } from "vitest/browser";

/** Move the virtual pointer to viewport coordinates. */
export async function movePointer(x: number, y: number): Promise<void> {
	await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

/**
 * Take the pointer off `el` and wait until `:hover` no longer matches. The Playwright pointer is
 * page state, not test state: a previous test file in the same Chromium page can leave it where
 * the next one renders (top-left, always), and `:hover` then swaps the colours the test reads
 * (`.ca-btn--filled:hover` uses `--ca-brand-fill-hover`). Order-dependent: passes alone, fails in
 * the full suite. Call before asserting a colour on an interactive element.
 */
export async function pointerAwayFrom(el: Element): Promise<void> {
	await movePointer(window.innerWidth - 2, window.innerHeight - 2);
	await expect.poll(() => el.matches(":hover")).toBe(false);
}
