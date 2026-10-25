// ─── Color helpers for pickers and theme tooling ─────────────────────────────
// DOM-free, so they run in Vite, Astro, workers and the browser alike. Everything is built on the
// parser the theme build already trusts (`evalColor`) and the OKLab matrices of `palette-generator`.

import { oklabToRgb, type ParsedColor } from "./css-color.js";
import { compositeOver, evalColor } from "./css-color-mix.js";
import { hexToOklch, oklchToHex } from "./palette-generator.js";

export interface Oklch {
	/** Lightness, 0 to 1. */
	l: number;
	/** Chroma, 0 to ~0.37 inside sRGB. */
	c: number;
	/** Hue angle in degrees, 0 to 360. */
	h: number;
}

const round = (n: number, p: number) => Number(n.toFixed(p));

const hex2 = (v: number) =>
	Math.round(Math.min(1, Math.max(0, v)) * 255)
		.toString(16)
		.padStart(2, "0");

/** Opaque `#rrggbb` of any color the theme parser understands (alpha is dropped). Null if it cannot be evaluated. */
export function toHex(color: string): string | null {
	const p = evalColor(color);
	return p ? `#${p.rgb.map(hex2).join("")}` : null;
}

/** OKLCH of any evaluable CSS color (alpha dropped). Null if it cannot be evaluated. */
export function toOklch(color: string): Oklch | null {
	const hex = toHex(color);
	return hex ? hexToOklch(hex) : null;
}

/** `oklch(L C H)` string with 3-decimal lightness/chroma and 1-decimal hue. */
export function formatOklch({ l, c, h }: Oklch): string {
	return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`;
}

/** Opaque `#rrggbb` for an OKLCH triple (gamut-clipped). */
export function oklchHex({ l, c, h }: Oklch): string {
	return oklchToHex(`oklch(${l.toFixed(5)} ${c.toFixed(5)} ${h.toFixed(3)})`);
}

/**
 * Parse what a user types into a color field: `#rgb`, `#rrggbb`, `rgb()`, `oklch()`, `color-mix()`,
 * `white`/`black`, or a bare `rrggbb`. Returns the canonical `#rrggbb` and OKLCH, or null.
 */
export function parseColorInput(
	input: string
): { hex: string; oklch: Oklch; alpha: number; css: string } | null {
	let t = input.trim();
	if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(t)) t = `#${t}`;
	const p = evalColor(t);
	if (!p) return null;
	const hex = `#${p.rgb.map(hex2).join("")}`;
	return { hex, oklch: hexToOklch(hex), alpha: p.alpha, css: t };
}

const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (c: ParsedColor["rgb"]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

/**
 * WCAG contrast ratio of `fg` on `bg`. A translucent `fg` is composited over `bg`, and a
 * translucent `bg` over white, like a browser paints them. Null when either cannot be evaluated
 * (`var()`, other keywords).
 */
export function contrast(fg: string, bg: string): number | null {
	const f = evalColor(fg);
	const b = evalColor(bg);
	if (!f || !b) return null;
	const base = compositeOver(b, [1, 1, 1]);
	const top = compositeOver(f, base);
	const [hi, lo] = [lum(top), lum(base)].sort((x, y) => y - x);
	return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA-large" | "fail";

/** WCAG level a ratio reaches for normal text: AAA 7, AA 4.5, AA-large 3 (large text and UI parts), else fail. */
export function wcagLevel(ratio: number): WcagLevel {
	return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-large" : "fail";
}

// ─── Palette extraction (logo / image → brand colors) ────────────────────────

export interface PaletteColor {
	hex: string;
	oklch: Oklch;
	/** Share of the sampled pixels in this cluster, 0 to 1. */
	share: number;
}

type Lab = [number, number, number];

const toLab = (rgb: [number, number, number]): Lab => {
	const [r, g, b] = rgb.map(lin) as [number, number, number];
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
};

const labDist = (a: Lab, b: Lab) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/**
 * Dominant colors of an RGBA pixel buffer (`ImageData.data`), by k-means in OKLab so clusters are
 * perceptual rather than channel-wise. Transparent pixels are ignored; the buffer is subsampled to
 * at most `maxSamples` pixels. Deterministic (farthest-point seeding, no randomness). Result is
 * sorted by `share`, largest first, and merged so no two entries sit within `minDistance` in OKLab.
 */
export function extractPalette(
	rgba: ArrayLike<number>,
	{ k = 6, maxSamples = 4000, minDistance = 0.06 } = {}
): PaletteColor[] {
	const px: Lab[] = [];
	const total = Math.floor(rgba.length / 4);
	const stride = Math.max(1, Math.floor(total / maxSamples));
	for (let i = 0; i < total; i += stride) {
		if ((rgba[i * 4 + 3] ?? 255) < 128) continue;
		px.push(
			toLab([(rgba[i * 4] ?? 0) / 255, (rgba[i * 4 + 1] ?? 0) / 255, (rgba[i * 4 + 2] ?? 0) / 255])
		);
	}
	if (px.length === 0) return [];

	// Farthest-point seeding: the first seed is the pixel nearest the mean, each next seed is the
	// pixel farthest from every seed so far. Deterministic, and it finds small accent clusters.
	const mean: Lab = [0, 0, 0];
	for (const p of px)
		for (let i = 0; i < 3; i++) mean[i] = (mean[i] ?? 0) + (p[i] ?? 0) / px.length;
	let seeds: Lab[] = [px.reduce((best, p) => (labDist(p, mean) < labDist(best, mean) ? p : best))];
	while (seeds.length < Math.min(k, px.length)) {
		let far = px[0] as Lab;
		let farD = -1;
		for (const p of px) {
			const d = Math.min(...seeds.map((s) => labDist(p, s)));
			if (d > farD) {
				farD = d;
				far = p;
			}
		}
		if (farD < 1e-6) break;
		seeds.push(far);
	}

	let groups: Lab[][] = [];
	for (let iter = 0; iter < 12; iter++) {
		groups = seeds.map(() => []);
		for (const p of px) {
			let best = 0;
			let bestD = Number.POSITIVE_INFINITY;
			seeds.forEach((s, i) => {
				const d = labDist(p, s);
				if (d < bestD) {
					bestD = d;
					best = i;
				}
			});
			groups[best]?.push(p);
		}
		seeds = seeds.map((s, i) => {
			const g = groups[i] ?? [];
			if (g.length === 0) return s;
			return [0, 1, 2].map((c) => g.reduce((a, p) => a + (p[c] ?? 0), 0) / g.length) as Lab;
		});
	}

	const clusters = seeds
		.map((lab, i) => ({ lab, n: groups[i]?.length ?? 0 }))
		.filter((c) => c.n > 0)
		.sort((a, b) => b.n - a.n);
	const merged: { lab: Lab; n: number }[] = [];
	for (const c of clusters) {
		const near = merged.find((m) => Math.sqrt(labDist(m.lab, c.lab)) < minDistance);
		if (near) near.n += c.n;
		else merged.push({ ...c });
	}
	return merged.map(({ lab, n }) => {
		// The hex comes from the unrounded center so a single-color cluster returns its exact color.
		const hex = `#${oklabToRgb(lab[0], lab[1], lab[2]).map(hex2).join("")}`;
		return { hex, oklch: hexToOklch(hex), share: n / px.length };
	});
}

/**
 * Pick the brand color of a palette: the most vivid cluster that is neither near-white nor near-black,
 * weighted by how much of the image it covers. Falls back to the largest cluster for a grayscale image.
 */
export function pickBrand(palette: PaletteColor[]): PaletteColor | null {
	const usable = palette.filter((p) => p.oklch.l > 0.25 && p.oklch.l < 0.92);
	const scored = usable
		.map((p) => ({ p, score: p.oklch.c * (0.4 + Math.sqrt(p.share)) }))
		.sort((a, b) => b.score - a.score);
	const best = scored[0];
	if (best && best.p.oklch.c > 0.04) return best.p;
	return palette[0] ?? null;
}
