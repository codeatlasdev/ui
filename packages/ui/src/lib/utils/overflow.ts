/**
 * Overflow measurement shared by components that move what does not fit into a "More" menu
 * (`Toolbar overflow="menu"`; `PageShell` actions reuse it). DOM only, no framework state.
 */

export interface OverflowOptions {
	/** Items that may move, in order. */
	items: readonly HTMLElement[];
	/** The row they sit in. Its `clientWidth` is the room available. */
	container: HTMLElement;
	/** Width the "More" trigger takes, reserved while at least one item has moved. */
	reserve: number;
	/** Gap between items in px. */
	gap: number;
	/** An item that never moves (a primary action). It still takes room. */
	pinned?: (el: HTMLElement) => boolean;
}

/**
 * Indexes of the items that do not fit, measured on the items' natural widths (`items` must be laid
 * out, not hidden). Pinned items are kept first; the rest keep their order and the first one that
 * does not fit moves with everything after it, so the menu order matches the row order.
 */
export function measureOverflow({
	items,
	container,
	reserve,
	gap,
	pinned,
}: OverflowOptions): Set<number> {
	const widths = items.map((el) => el.getBoundingClientRect().width);
	const room = container.clientWidth;
	const total = (idx: number[]) =>
		idx.reduce((sum, i) => sum + widths[i], 0) + gap * Math.max(0, idx.length - 1);
	const all = items.map((_, i) => i);
	if (total(all) <= room + 0.5) return new Set();

	const keep = all.filter((i) => pinned?.(items[i]));
	const budget = room - reserve - gap;
	const moved = new Set<number>();
	let fits = true;
	for (const i of all) {
		if (pinned?.(items[i])) continue;
		if (fits && total([...keep, i]) <= budget) keep.push(i);
		else {
			fits = false;
			moved.add(i);
		}
	}
	return moved;
}

/** One item moved into the "More" menu. */
export interface MovedItem {
	el: HTMLElement;
	label: string;
	disabled: boolean;
	/** What a menu pick clicks: the item itself when it is a button or link, else its first one inside. */
	activate: () => void;
}

export interface LayoutOverflowOptions {
	/** The "More" trigger wrapper in the row (never moved, never measured as an item). */
	trigger?: HTMLElement | null;
	/** Extra items that never move, besides spacers, `data-priority="primary"` and what cannot be clicked from a menu. */
	pinned?: (el: HTMLElement) => boolean;
	/** The currently listed items; the result is `null` when nothing changed, so a caller can skip a state write. */
	previous?: readonly MovedItem[];
}

const CLICKABLE = "button, a[href]";
const isClickable = (el: HTMLElement) => el.matches(CLICKABLE);
/** What a menu entry clicks for `el`: itself (button, link) or its first button or link inside. */
const targetOf = (el: HTMLElement) =>
	isClickable(el) ? el : el.querySelector<HTMLElement>(CLICKABLE);

const labelOf = (el: HTMLElement) =>
	el.dataset.overflow || el.getAttribute("aria-label") || el.textContent?.trim() || "";

/** The row's own children, never the trigger wrapper (`ca-toolbar__more`, `ca-page-shell__more`). A spacer stays in the list: it takes a gap slot. */
export function overflowItems(row: HTMLElement): HTMLElement[] {
	return Array.from(row.children).filter(
		(el): el is HTMLElement =>
			el instanceof HTMLElement &&
			!el.classList.contains("ca-toolbar__more") &&
			!el.classList.contains("ca-page-shell__more")
	);
}

/**
 * Un-hides everything, measures, then hides what does not fit (`data-overflowed` on the item,
 * `data-shown` on the trigger): one synchronous pass, so no flash. An item moves only when a menu entry
 * can act for it: a `button` or `a[href]` child, or any child marked `data-overflow` that holds one.
 * Everything else (a `ButtonGroup`, a field, a spacer, `data-priority="primary"`) stays in the row.
 * Returns the moved items in row order, or `null` when they equal `previous`.
 */
export function layoutOverflow(
	row: HTMLElement,
	{ trigger, pinned, previous = [] }: LayoutOverflowOptions = {}
): MovedItem[] | null {
	const items = overflowItems(row);
	for (const el of items) el.removeAttribute("data-overflowed");
	trigger?.removeAttribute("data-shown");
	// Reserve the trigger's real width: show it for the measurement, it is hidden again below.
	trigger?.setAttribute("data-measuring", "");
	const reserve = trigger?.getBoundingClientRect().width || 32;
	trigger?.removeAttribute("data-measuring");
	const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
	const out = measureOverflow({
		items,
		container: row,
		reserve,
		gap,
		pinned: (el) =>
			el.classList.contains("ca-toolbar-spacer") ||
			el.dataset.priority === "primary" ||
			el.querySelector('[data-priority="primary"]') !== null ||
			(!isClickable(el) && !("overflow" in el.dataset && targetOf(el))) ||
			pinned?.(el) === true,
	});
	items.forEach((el, i) => {
		if (out.has(i)) el.setAttribute("data-overflowed", "");
	});
	if (out.size) trigger?.setAttribute("data-shown", "");
	const next = items
		.filter((_, i) => out.has(i))
		.map((el) => {
			const target = targetOf(el);
			return {
				el,
				label: labelOf(el),
				disabled:
					el.hasAttribute("disabled") ||
					el.getAttribute("aria-disabled") === "true" ||
					target?.hasAttribute("disabled") === true ||
					target?.getAttribute("aria-disabled") === "true",
				activate: () => target?.click(),
			};
		});
	const same =
		next.length === previous.length &&
		next.every(
			(m, i) =>
				m.el === previous[i].el &&
				m.label === previous[i].label &&
				m.disabled === previous[i].disabled
		);
	return same ? null : next;
}

/**
 * Calls `onChange` when the row or any item resizes, when an item is added or removed, and once the
 * page fonts load (text width changes). Returns the cleanup. `onChange` runs at most once per frame.
 */
export function observeOverflow(
	container: HTMLElement,
	items: () => readonly HTMLElement[],
	onChange: () => void
): () => void {
	let frame = 0;
	const schedule = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(onChange);
	};
	const ro = new ResizeObserver(schedule);
	ro.observe(container);
	const watched = new Set<HTMLElement>();
	const watch = () => {
		const now = new Set(items());
		for (const el of watched) if (!now.has(el)) ro.unobserve(el);
		for (const el of now) if (!watched.has(el)) ro.observe(el);
		watched.clear();
		for (const el of now) watched.add(el);
	};
	watch();
	const mo = new MutationObserver(() => {
		watch();
		schedule();
	});
	mo.observe(container, { childList: true });
	document.fonts?.addEventListener("loadingdone", schedule);
	void document.fonts?.ready.then(schedule);
	return () => {
		cancelAnimationFrame(frame);
		ro.disconnect();
		mo.disconnect();
		document.fonts?.removeEventListener("loadingdone", schedule);
	};
}
