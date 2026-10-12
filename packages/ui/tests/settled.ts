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
