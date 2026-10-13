import type { Action } from "svelte/action";
import { focusables } from "../primitives/focus.js";

/**
 * Traps keyboard focus inside the element when `enabled` is true.
 * @example `<div use:focusTrap={open}>`
 */
export const focusTrap: Action<HTMLElement, boolean> = (node, enabled) => {
	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== "Tab") return;
		const focusable = focusables(node);
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	if (enabled) node.addEventListener("keydown", handleKeydown);

	return {
		update(newEnabled: boolean) {
			node.removeEventListener("keydown", handleKeydown);
			if (newEnabled) node.addEventListener("keydown", handleKeydown);
		},
		destroy() {
			node.removeEventListener("keydown", handleKeydown);
		},
	};
};
