import { createRequire } from "node:module";
import { join } from "node:path";

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** One element: its bounding box and the computed styles that were asked for (camelCase keys). */
export interface Measurement {
	rect: Rect;
	styles: Record<string, string>;
}

/** Elements of one page at one viewport, keyed by selector or `[data-testid=name]`. */
export type Measurements = Record<string, Measurement>;

export interface DiffRow {
	key: string;
	viewport: number;
	/** `rect.width`, `fontWeight`, `missing`, `pixels`, ... */
	property: string;
	a: string;
	b: string;
	deviation: number;
}

export interface DiffOptions {
	/** Rect deltas up to this many px are ignored. Default 0.5. */
	tolerancePx?: number;
	viewport?: number;
}

const RECT_PROPS = ["x", "y", "width", "height"] as const;

/** A value like `12px`, `700` or `-0.5px` as a number; `null` for anything else (colors, keywords). */
function numeric(value: string): number | null {
	const m = /^(-?\d*\.?\d+)(px)?$/.exec(value.trim());
	return m ? Number(m[1]) : null;
}

/** Row ordering: largest deviation first, then stable by key/property. */
function byDeviation(x: DiffRow, y: DiffRow): number {
	return (
		y.deviation - x.deviation || x.key.localeCompare(y.key) || x.property.localeCompare(y.property)
	);
}

/**
 * Diff two measurement sets. Rect props differ only above `tolerancePx`; a style that parses as a number
 * (optionally in px) is compared numerically, anything else by string equality with deviation 1.
 */
export function diffMeasurements(
	a: Measurements,
	b: Measurements,
	options: DiffOptions = {}
): DiffRow[] {
	const tolerance = options.tolerancePx ?? 0.5;
	const viewport = options.viewport ?? 0;
	const rows: DiffRow[] = [];
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const ma = a[key];
		const mb = b[key];
		if (!ma || !mb) {
			rows.push({
				key,
				viewport,
				property: "missing",
				a: ma ? "present" : "absent",
				b: mb ? "present" : "absent",
				deviation: Number.POSITIVE_INFINITY,
			});
			continue;
		}
		for (const prop of RECT_PROPS) {
			const delta = Math.abs(ma.rect[prop] - mb.rect[prop]);
			if (delta > tolerance)
				rows.push({
					key,
					viewport,
					property: `rect.${prop}`,
					a: String(ma.rect[prop]),
					b: String(mb.rect[prop]),
					deviation: delta,
				});
		}
		for (const prop of new Set([...Object.keys(ma.styles), ...Object.keys(mb.styles)])) {
			const va = ma.styles[prop] ?? "";
			const vb = mb.styles[prop] ?? "";
			if (va === vb) continue;
			const na = numeric(va);
			const nb = numeric(vb);
			const deviation = na !== null && nb !== null ? Math.abs(na - nb) : 1;
			if (deviation === 0) continue;
			rows.push({ key, viewport, property: prop, a: va, b: vb, deviation });
		}
	}
	return rows.sort(byDeviation);
}

/** Plain aligned text, one line per row after a header; `No differences.` when there is nothing to show. */
export function formatTable(rows: DiffRow[]): string {
	if (rows.length === 0) return "No differences.";
	const head = ["element", "viewport", "property", "A", "B", "deviation"];
	const body = rows.map((r) => [
		r.key,
		String(r.viewport),
		r.property,
		r.a,
		r.b,
		Number.isFinite(r.deviation) ? String(Math.round(r.deviation * 100) / 100) : "∞",
	]);
	const widths = head.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length)));
	const line = (cells: string[]) =>
		cells
			.map((c, i) => c.padEnd(widths[i]))
			.join("  ")
			.trimEnd();
	return [line(head), ...body.map(line)].join("\n");
}

/** The slice of a Playwright `Page` that compare calls. */
export interface ComparePage {
	setViewportSize(size: { width: number; height: number }): Promise<void>;
	goto(url: string, options?: { waitUntil?: "load" | "networkidle" }): Promise<unknown>;
	evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R>;
	screenshot(options?: { fullPage?: boolean; type?: "png" }): Promise<Buffer>;
	close(): Promise<void>;
}

/** The slice of a Playwright `Browser` that compare calls. */
export interface CompareBrowser {
	newPage(): Promise<ComparePage>;
	close(): Promise<void>;
}

export interface CompareOptions {
	/** CSS selectors, keyed by the selector string (first match). Default: every `[data-testid]`, keyed `[data-testid=name]`. */
	selectors?: string[];
	/** Viewport widths in px. Default `[390, 1280]`. */
	viewports?: number[];
	/** Computed style props (camelCase) to diff. */
	props?: string[];
	/** Rect deltas up to this many px are ignored. Default 0.5. */
	tolerancePx?: number;
	/** Where to look for `playwright`. Default `process.cwd()`. */
	cwd?: string;
	log?: (line: string) => void;
	/** Replaces Chromium launching (tests). */
	launch?: () => Promise<CompareBrowser>;
	/** Replaces the `playwright` lookup; `null` means it is not installed (tests). */
	resolve?: (cwd: string) => PlaywrightLike | null;
}

export interface PlaywrightLike {
	chromium: { launch(): Promise<CompareBrowser> };
}

export const DEFAULT_VIEWPORTS = [390, 1280];
export const DEFAULT_PROPS = [
	"fontWeight",
	"fontSize",
	"letterSpacing",
	"lineHeight",
	"color",
	"backgroundColor",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"marginTop",
	"marginRight",
	"marginBottom",
	"marginLeft",
	"borderRadius",
	"gap",
];
export const TESTID_SELECTOR = "[data-testid]";
export const MISSING_PLAYWRIGHT =
	"compare needs playwright (bun add -d playwright && bunx playwright install chromium)";

/** `playwright` is not a dependency: look in the project first, then next to the CLI. */
export function loadPlaywright(cwd: string): PlaywrightLike | null {
	for (const from of [join(cwd, "noop.js"), import.meta.url]) {
		for (const name of ["playwright", "@playwright/test"]) {
			try {
				const mod = createRequire(from)(name) as PlaywrightLike;
				if (mod.chromium) return mod;
			} catch {}
		}
	}
	return null;
}

interface MeasureArg {
	selectors: string[];
	props: string[];
	testid: string;
}

/** Runs inside the page: self-contained, no imports or outer references. */
function measureInPage({ selectors, props, testid }: MeasureArg): Record<string, Measurement> {
	const out: Record<string, Measurement> = {};
	const read = (el: Element): Measurement => {
		const r = el.getBoundingClientRect();
		const cs = getComputedStyle(el) as unknown as Record<string, string>;
		const styles: Record<string, string> = {};
		for (const p of props) styles[p] = cs[p] ?? "";
		return { rect: { x: r.x, y: r.y, width: r.width, height: r.height }, styles };
	};
	for (const selector of selectors) {
		if (selector === testid) {
			for (const el of Array.from(document.querySelectorAll(testid))) {
				const id = el.getAttribute("data-testid");
				const key = `[data-testid=${id}]`;
				if (!(key in out)) out[key] = read(el);
			}
		} else {
			const el = document.querySelector(selector);
			if (el) out[selector] = read(el);
		}
	}
	return out;
}

interface PixelArg {
	a: string;
	b: string;
}

interface PixelResult {
	aSize: [number, number];
	bSize: [number, number];
	diff: number;
	total: number;
}

/** Runs inside the page: decodes both PNG data URLs on a canvas and counts differing pixels. */
async function comparePixelsInPage({ a, b }: PixelArg): Promise<PixelResult> {
	const load = (src: string) => {
		const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("could not decode screenshot"));
		img.src = src;
		return promise;
	};
	const [ia, ib] = await Promise.all([load(a), load(b)]);
	const aSize: [number, number] = [ia.naturalWidth, ia.naturalHeight];
	const bSize: [number, number] = [ib.naturalWidth, ib.naturalHeight];
	if (aSize[0] !== bSize[0] || aSize[1] !== bSize[1]) return { aSize, bSize, diff: 0, total: 0 };
	const data = (img: HTMLImageElement) => {
		const canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("no 2d canvas");
		ctx.drawImage(img, 0, 0);
		return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	};
	const da = data(ia);
	const db = data(ib);
	let diff = 0;
	for (let i = 0; i < da.length; i += 4)
		if (
			da[i] !== db[i] ||
			da[i + 1] !== db[i + 1] ||
			da[i + 2] !== db[i + 2] ||
			da[i + 3] !== db[i + 3]
		)
			diff++;
	return { aSize, bSize, diff, total: da.length / 4 };
}

async function capture(page: ComparePage, url: string, width: number, arg: MeasureArg) {
	await page.setViewportSize({ width, height: 800 });
	await page.goto(url, { waitUntil: "networkidle" });
	const measured = await page.evaluate(measureInPage, arg);
	const png = await page.screenshot({ fullPage: true, type: "png" });
	return { measured, png };
}

function pixelRow(viewport: number, r: PixelResult): DiffRow | null {
	const size = (s: [number, number]) => `${s[0]}x${s[1]}`;
	if (r.aSize[0] !== r.bSize[0] || r.aSize[1] !== r.bSize[1])
		return {
			key: "page",
			viewport,
			property: "pixels",
			a: size(r.aSize),
			b: size(r.bSize),
			deviation: 100,
		};
	if (r.diff === 0) return null;
	const pct = Math.round((r.diff / r.total) * 10000) / 100;
	return {
		key: "page",
		viewport,
		property: "pixels",
		a: size(r.aSize),
		b: `${r.diff}px differ`,
		deviation: pct,
	};
}

/**
 * Compare two URLs in Chromium at each viewport and print a table sorted by deviation.
 * Returns the exit code: 0 clean, 1 on any deviation above tolerance or a missing element,
 * 2 when Playwright cannot be loaded.
 */
export async function runCompare(
	urlA: string,
	urlB: string,
	options: CompareOptions = {}
): Promise<number> {
	const log = options.log ?? ((l: string) => console.log(l));
	const cwd = options.cwd ?? process.cwd();
	const tolerancePx = options.tolerancePx ?? 0.5;
	const selectors = options.selectors?.length ? options.selectors : [TESTID_SELECTOR];
	const arg: MeasureArg = {
		selectors,
		props: options.props ?? DEFAULT_PROPS,
		testid: TESTID_SELECTOR,
	};

	let launch = options.launch;
	if (!launch) {
		const pw = (options.resolve ?? loadPlaywright)(cwd);
		if (!pw) {
			log(MISSING_PLAYWRIGHT);
			return 2;
		}
		launch = () => pw.chromium.launch();
	}

	const browser = await launch();
	const rows: DiffRow[] = [];
	try {
		const page = await browser.newPage();
		for (const viewport of options.viewports ?? DEFAULT_VIEWPORTS) {
			const a = await capture(page, urlA, viewport, arg);
			const b = await capture(page, urlB, viewport, arg);
			rows.push(...diffMeasurements(a.measured, b.measured, { tolerancePx, viewport }));
			if (!a.png.equals(b.png)) {
				const url = (png: Buffer) => `data:image/png;base64,${png.toString("base64")}`;
				const px = pixelRow(
					viewport,
					await page.evaluate(comparePixelsInPage, { a: url(a.png), b: url(b.png) })
				);
				if (px) rows.push(px);
			}
		}
	} finally {
		await browser.close();
	}
	rows.sort(byDeviation);
	log(formatTable(rows));
	return rows.length > 0 ? 1 : 0;
}
