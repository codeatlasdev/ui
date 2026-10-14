import type { Action } from "svelte/action";

// iOS only opens the on-screen keyboard for focus() called synchronously inside a
// user gesture. Focus moved later (on mount, in rAF, after a transition) lands on the
// field without a keyboard and makes Safari scroll/zoom toward it: the "weird jump".
// Pattern: inside the tap handler call primeKeyboard() (focuses an invisible 16px
// proxy input, so the keyboard opens), then autofocus moves focus to the real field;
// iOS keeps the keyboard up when focus moves between text fields.

let proxy: HTMLInputElement | null = null;

/**
 * Call synchronously in the click/tap handler that opens a view with an autofocused
 * field (dialog, sheet, search). Opens the keyboard on iOS/Android; no-op on desktop.
 *
 *   <Button onclick={() => { primeKeyboard(); open = true; }}>Search</Button>
 */
export function primeKeyboard(): void {
	if (!matchMedia("(pointer: coarse)").matches) return;
	if (!proxy) {
		proxy = document.createElement("input");
		proxy.setAttribute("aria-hidden", "true");
		proxy.tabIndex = -1;
		// Never display:none (cannot focus). 16px so iOS does not zoom; fixed at top so nothing scrolls.
		proxy.style.cssText =
			"position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;pointer-events:none";
	}
	// Re-attach if the app re-rendered <body> since the last call.
	if (!proxy.isConnected) document.body.appendChild(proxy);
	proxy.focus({ preventScroll: true });
	// Nothing claimed the keyboard (view failed to open): do not leave it up over nothing.
	setTimeout(() => {
		if (document.activeElement === proxy) proxy?.blur();
	}, 1000);
}

/**
 * Focuses the element on mount without scrolling the page.
 * On touch devices it only focuses when the keyboard was primed in the opening gesture
 * (see primeKeyboard); otherwise it leaves focus alone instead of half-focusing a field
 * with no keyboard. Pass `{ touch: true }` to focus anyway (e.g. hardware keyboards).
 * @example `<input use:autofocus>`
 */
/**
 * Focus a text field the way autofocus does: always with a fine pointer, on touch only
 * when the keyboard was primed in the opening gesture. Returns whether it focused.
 */
export function focusTextField(el: HTMLElement | null | undefined, force = false): boolean {
	if (!el) return false;
	const primed = proxy !== null && document.activeElement === proxy;
	if (matchMedia("(pointer: coarse)").matches && !primed && !force) return false;
	el.focus({ preventScroll: true });
	return true;
}

/** Svelte action: focuses the element on mount without scrolling. On touch it only focuses when `primeKeyboard()` ran in the opening gesture (`{ touch: true }` forces it). Usage: `<input use:autofocus>`. */
export const autofocus: Action<HTMLElement, { touch?: boolean } | undefined> = (node, opts) => {
	// Defer so parent mount (and portals/transitions) finish first.
	const id = requestAnimationFrame(() => focusTextField(node, opts?.touch));
	return {
		destroy() {
			cancelAnimationFrame(id);
		},
	};
};
