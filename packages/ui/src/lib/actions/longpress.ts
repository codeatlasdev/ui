import type { Action } from "svelte/action";

export interface LongpressOptions {
	/** Hold time in ms. Default 500. */
	duration?: number;
	/** Pixels the pointer may drift from the press point before the press is a scroll or a drag. Default 10. */
	slop?: number;
	/** Pointer types that can long press. Default `["touch", "pen"]`: a mouse has the context menu. */
	pointerTypes?: string[];
	/** Swallow the click that follows a fired long press, so the tap action does not run too. Default true. */
	preventClick?: boolean;
}

/** `event.detail` of the `longpress` event. */
export interface LongpressDetail {
	x: number;
	y: number;
	pointerType: string;
}

/**
 * Fires a `longpress` CustomEvent after the pointer is held still for `duration` ms. A move beyond
 * `slop`, `pointerup`, `pointerleave` or `pointercancel` (the browser took the gesture to scroll) cancels
 * it; touch and pen only unless `pointerTypes` says otherwise; the click that follows a fired press is
 * swallowed once. `detail` is `{ x, y, pointerType }`, so a menu can open under the finger.
 * @example `<div use:longpress={500} onlongpress={(e) => open(e.detail)}>`
 */
export const longpress: Action<
	HTMLElement,
	number | LongpressOptions | undefined,
	{ onlongpress?: (e: CustomEvent<LongpressDetail>) => void }
> = (node, param) => {
	const read = (p: number | LongpressOptions | undefined) => {
		const o = typeof p === "number" ? { duration: p } : (p ?? {});
		return {
			duration: o.duration ?? 500,
			slop: o.slop ?? 10,
			pointerTypes: o.pointerTypes ?? ["touch", "pen"],
			preventClick: o.preventClick ?? true,
		};
	};
	let opts = read(param);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let start: { x: number; y: number } | null = null;

	function cancel() {
		clearTimeout(timer);
		start = null;
	}

	function swallowClick(e: Event) {
		e.stopImmediatePropagation();
		e.preventDefault();
	}

	function onDown(e: PointerEvent) {
		cancel();
		if (!opts.pointerTypes.includes(e.pointerType)) return;
		const { clientX: x, clientY: y, pointerType } = e;
		start = { x, y };
		timer = setTimeout(() => {
			start = null;
			if (opts.preventClick) {
				// The release that follows delivers a click: eat it once, and never keep eating if none comes.
				node.addEventListener("click", swallowClick, { capture: true, once: true });
				setTimeout(() => node.removeEventListener("click", swallowClick, true), 400);
			}
			node.dispatchEvent(
				new CustomEvent<LongpressDetail>("longpress", { detail: { x, y, pointerType } })
			);
		}, opts.duration);
	}

	function onMove(e: PointerEvent) {
		if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > opts.slop) cancel();
	}

	node.addEventListener("pointerdown", onDown);
	node.addEventListener("pointermove", onMove);
	node.addEventListener("pointerup", cancel);
	node.addEventListener("pointerleave", cancel);
	node.addEventListener("pointercancel", cancel);

	return {
		update(next) {
			opts = read(next);
		},
		destroy() {
			cancel();
			node.removeEventListener("click", swallowClick, true);
			node.removeEventListener("pointerdown", onDown);
			node.removeEventListener("pointermove", onMove);
			node.removeEventListener("pointerup", cancel);
			node.removeEventListener("pointerleave", cancel);
			node.removeEventListener("pointercancel", cancel);
		},
	};
};
