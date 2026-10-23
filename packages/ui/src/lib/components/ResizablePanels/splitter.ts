/** Context between a `ResizablePanels` group and its panels and handles. */
export interface PanelSpec {
	id: string;
	min: number;
	max: number;
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
