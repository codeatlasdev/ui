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

/**
 * Calls `onChange` when the row or any item resizes, and once the page fonts load (text width
 * changes). Returns the cleanup. `onChange` runs at most once per frame.
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
	for (const el of items()) ro.observe(el);
	document.fonts?.addEventListener("loadingdone", schedule);
	void document.fonts?.ready.then(schedule);
	return () => {
		cancelAnimationFrame(frame);
		ro.disconnect();
		document.fonts?.removeEventListener("loadingdone", schedule);
	};
}
