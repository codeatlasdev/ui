/** Context between a `ResizablePanels` group and its panels and handles. */
export interface PanelSpec {
	id: string;
	/** Percent of the group. */
	min: number;
	max: number;
	/** A limit given in px (`minSize="280px"`): it wins over `min`/`max` once the group's size is known (#996). */
	minPx?: number;
	maxPx?: number;
}

export interface SplitterContext {
	direction: "horizontal" | "vertical";
	register(spec: PanelSpec, initial: number): () => void;
	size(id: string): number;
	/** The panel before handle `index` is `panels[index]`, the one after is `panels[index + 1]`. */
	panelId(index: number): string | undefined;
	/** DOM id of the panel before a handle, for `aria-controls`. */
	panelDomId(index: number): string | undefined;
	bounds(index: number): { min: number; max: number };
	value(index: number): number;
	resizeTo(index: number, percent: number, commit: boolean): void;
	commit(): void;
	/** Size of the group on its main axis, in px. */
	extent(): number;
	handleIndex(el: HTMLElement): number;
}

export const SPLITTER_KEY = Symbol("ca-resizable-panels");

/**
 * Moves the boundary between panel `i` and `i + 1` so panel `i` is `target` percent, trading
 * with its neighbour only and honouring both panels' limits. Returns a new array.
 */
export function moveBoundary(
	sizes: number[],
	specs: PanelSpec[],
	i: number,
	target: number
): number[] {
	const a = specs[i];
	const b = specs[i + 1];
	if (!a || !b) return sizes;
	const pair = sizes[i] + sizes[i + 1];
	const lo = Math.max(a.min, pair - b.max);
	const hi = Math.min(a.max, pair - b.min);
	const next = Math.min(Math.max(target, lo), Math.max(lo, hi));
	if (next === sizes[i]) return sizes;
	const out = sizes.slice();
	out[i] = next;
	out[i + 1] = pair - next;
	return out;
}

/** Scales `sizes` so they add up to 100 (a layout from defaults that do not). */
export function normalize(sizes: number[]): number[] {
	const sum = sizes.reduce((s, n) => s + n, 0);
	if (sum <= 0) return sizes.map(() => 100 / sizes.length);
	return sizes.map((n) => (n / sum) * 100);
}

/** The percent limits for a group whose panels share `extent` px: a px limit becomes its share of it (#996). */
export function resolveSpecs(specs: PanelSpec[], extent: number): PanelSpec[] {
	if (!(extent > 0)) return specs;
	return specs.map((s) => ({
		...s,
		min: s.minPx !== undefined ? (s.minPx / extent) * 100 : s.min,
		max: s.maxPx !== undefined ? Math.min(100, (s.maxPx / extent) * 100) : s.max,
	}));
}

/**
 * Brings every size within its panel's limits and keeps the sum at 100: what a clamp frees or takes is shared by
 * the panels with room, in proportion. When the minimums alone exceed 100 (they do not fit), sizes follow the
 * minimums' proportions.
 */
export function fit(sizes: number[], specs: PanelSpec[]): number[] {
	const mins = specs.map((s) => s.min);
	if (mins.reduce((a, b) => a + b, 0) >= 100) return normalize(mins);
	let out = sizes.map((n, i) => Math.min(Math.max(n, specs[i].min), specs[i].max));
	for (let pass = 0; pass < 4; pass++) {
		const diff = 100 - out.reduce((a, b) => a + b, 0);
		if (Math.abs(diff) < 1e-6) break;
		const room = out.map((n, i) => Math.max(0, diff > 0 ? specs[i].max - n : n - specs[i].min));
		const total = room.reduce((a, b) => a + b, 0);
		if (total <= 0) break;
		out = out.map((n, i) => n + (diff * room[i]) / total);
	}
	return out;
}
