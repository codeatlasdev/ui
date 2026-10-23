// ─── CSS color → sRGB + alpha, at build time ─────────────────────────────────
// Theme tooling needs two answers about a role color a theme author wrote: "is this one CSS color
// and nothing else" (it lands inside a declaration, so `;`/`{}` must never get through) and "what
// pixels is it" (contrast after compositing alpha). No DOM, no canvas: it runs in Vite and Astro.
// Colors the parser cannot evaluate (`var()`, named keywords, relative color syntax) are valid but
// `parseCssColor` returns null for them (`color-mix()` too, unless the caller passes the evaluator from `css-color-mix.ts`), so a contrast check skips them instead of guessing.

/** Encoded sRGB 0..1 and alpha 0..1, the space and order browsers blend in. */
export interface ParsedColor {
	rgb: [number, number, number];
	alpha: number;
}

const NUM = "[+-]?(?:\\d+\\.?\\d*|\\.\\d+)";
const ALPHA = `(?:\\s*/\\s*(${NUM})(%)?)?`;
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function alphaOf(value: string | undefined, percent: string | undefined): number {
	if (value === undefined) return 1;
	return clamp01(percent ? Number.parseFloat(value) / 100 : Number.parseFloat(value));
}

const encode = (lin: number) => {
	const x = clamp01(lin);
	return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
};

/** OKLab → encoded sRGB (gamut-clipped by clamping, like the rest of the package). */
export function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
}

function hexColor(t: string): ParsedColor | null {
	const m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(t);
	if (!m) return null;
	let h = m[1];
	if (h.length <= 4) h = [...h].map((c) => c + c).join("");
	const byte = (i: number) => Number.parseInt(h.slice(i, i + 2), 16) / 255;
	return { rgb: [byte(0), byte(2), byte(4)], alpha: h.length === 8 ? byte(6) : 1 };
}

function rgbColor(t: string): ParsedColor | null {
	const sep = "(?:\\s*,\\s*|\\s+)";
	const m = new RegExp(
		`^rgba?\\(\\s*(${NUM})(%)?${sep}(${NUM})(%)?${sep}(${NUM})(%)?(?:\\s*[,/]\\s*(${NUM})(%)?)?\\s*\\)$`,
		"i"
	).exec(t);
	if (!m) return null;
	const ch = (v: string, pct?: string) =>
		clamp01(pct ? Number.parseFloat(v) / 100 : Number.parseFloat(v) / 255);
	return {
		rgb: [ch(m[1], m[2]), ch(m[3], m[4]), ch(m[5], m[6])],
		alpha: alphaOf(m[7], m[8]),
	};
}

function oklchColor(t: string): ParsedColor | null {
	const m = new RegExp(
		`^oklch\\(\\s*(${NUM})(%)?\\s+(${NUM})\\s+(${NUM})(?:deg)?${ALPHA}\\s*\\)$`,
		"i"
	).exec(t);
	if (!m) return null;
	const L = m[2] ? Number.parseFloat(m[1]) / 100 : Number.parseFloat(m[1]);
	const C = Number.parseFloat(m[3]);
	const H = (Number.parseFloat(m[4]) * Math.PI) / 180;
	return {
		rgb: oklabToRgb(L, C * Math.cos(H), C * Math.sin(H)),
		alpha: alphaOf(m[5], m[6]),
	};
}

/** Split on top-level commas (not inside a nested function). */
export function splitTop(s: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let cur = "";
	for (const ch of s) {
		if (ch === "(") depth++;
		if (ch === ")") depth--;
		if (ch === "," && depth === 0) {
			out.push(cur.trim());
			cur = "";
		} else cur += ch;
	}
	out.push(cur.trim());
	return out;
}

const KEYWORDS: Record<string, ParsedColor> = {
	transparent: { rgb: [0, 0, 0], alpha: 0 },
	white: { rgb: [1, 1, 1], alpha: 1 },
	black: { rgb: [0, 0, 0], alpha: 1 },
};

/**
 * Evaluate a CSS color to encoded sRGB + alpha: `#rgb[a]`, `#rrggbb[aa]`, `rgb()/rgba()`, `oklch()`
 * (all with `/ alpha`), `color-mix(in oklab|srgb, …)` of those, and `transparent`/`white`/`black`.
 * Null for anything else: `var()`, other keywords, relative colors, and any string that carries a
 * declaration separator.
 */
export function parseCssColor(
	color: string,
	extra?: (t: string) => ParsedColor | null
): ParsedColor | null {
	const t = color.trim();
	if (!t || /[;{}]/.test(t)) return null;
	return (
		KEYWORDS[t.toLowerCase()] ?? hexColor(t) ?? rgbColor(t) ?? oklchColor(t) ?? extra?.(t) ?? null
	);
}

/**
 * Whether `value` is safe and meaningful as one role color inside a declaration: no declaration
 * separators or braces, balanced parentheses, and either something `parseCssColor` evaluates or a
 * `var()`/`color-mix()`/`light-dark()`/other color function the browser will resolve.
 */
export function isCssColor(value: string): boolean {
	const t = value.trim();
	if (!t || /[;{}\\]|\/\*|\*\//.test(t)) return false;
	let depth = 0;
	for (const ch of t) {
		if (ch === "(") depth++;
		if (ch === ")" && --depth < 0) return false;
	}
	if (depth !== 0) return false;
	if (parseCssColor(t)) return true;
	return /^(?:var|color-mix|color|light-dark|hsl|hsla|hwb|lab|lch|oklab|oklch|rgb|rgba)\(/i.test(t);
}
