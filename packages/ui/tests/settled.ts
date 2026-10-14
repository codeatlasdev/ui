import { expect } from "vitest";

/** Resolves once no CSS animation/transition is running (overlays fade in; axe must see final colours). Polls playState: `Animation.finished` can hang on already-finished animations. */
export async function settled(): Promise<void> {
	await new Promise((r) => requestAnimationFrame(() => r(null)));
	await expect
		.poll(
			() =>
				document
					.getAnimations()
					// Spinners, shimmers and indeterminate bars loop forever: they have no final state.
					.filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity)
					.length
		)
		.toBe(0);
}

/**
 * Test-level budget for multi-step keyboard/typing flows. Every Playwright step (fill, key press,
 * `expect.element`) is a CDP round trip that costs hundreds of ms to seconds when the machine is
 * starved (full suite on many workers, CI under load), so a flow of ~15 steps outgrows Vitest's 15s
 * default without anything being wrong. Pass as the last argument to `it`.
 */
export const SLOW_FLOW = 120_000;
