// ─── announce: one shared screen-reader live region ───────────────────────────
// Screen readers only speak changes inside a live region that already exists, and several
// regions talking at once step on each other. One pair of regions (polite + assertive), created
// on first use and shared by every component, keeps announcements ordered and reliable.

export type Politeness = "polite" | "assertive";

const regions: Partial<Record<Politeness, HTMLElement>> = {};
const clearTimers: Partial<Record<Politeness, number>> = {};

/** Visually hidden, not `display:none` (that removes it from the accessibility tree). */
const HIDDEN =
	"position:fixed;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;";

function region(politeness: Politeness): HTMLElement {
	let el = regions[politeness];
	if (el?.isConnected) return el;
	el = document.createElement("div");
	el.setAttribute("data-ca-announcer", politeness);
	el.setAttribute("role", politeness === "assertive" ? "alert" : "status");
	el.setAttribute("aria-live", politeness);
	el.setAttribute("aria-atomic", "true");
	el.style.cssText = HIDDEN;
	document.body.append(el);
	regions[politeness] = el;
	return el;
}

/**
 * Speak `message` to assistive technology without moving focus or showing anything.
 * No-op on the server. Announcing the same text twice in a row still re-triggers
 * (the region is emptied first, then filled on the next frame).
 *
 * @param politeness `polite` waits for the user to be idle (default); `assertive` interrupts.
 */
export function announce(message: string, politeness: Politeness = "polite"): void {
	if (typeof document === "undefined" || !message) return;
	const el = region(politeness);
	clearTimeout(clearTimers[politeness]);
	el.textContent = "";
	requestAnimationFrame(() => {
		el.textContent = message;
		// Drop the text afterwards so a screen reader's virtual cursor never lands on stale content.
		clearTimers[politeness] = window.setTimeout(() => {
			el.textContent = "";
		}, 5000);
	});
}
