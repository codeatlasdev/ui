import { describe, expect, it } from "bun:test";
import {
	contrast,
	extractPalette,
	formatColor,
	formatOklch,
	maxChroma,
	oklchSlice,
	parseColorInput,
	peakChroma,
	pickBrand,
	toHex,
	wcagLevel,
} from "../src/lib/utils/color.js";

/** RGBA buffer of `n` pixels per color, in order. */
const pixels = (...parts: [string, number][]) =>
	Uint8ClampedArray.from(
		parts.flatMap(([hex, n]) => {
			const rgb = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
			return Array.from({ length: n }, () => [...rgb, 255]).flat();
		})
	);

describe("parseColorInput", () => {
	it("reads hex, bare hex, rgb() and oklch() into the same canonical hex", () => {
		expect(parseColorInput("#fff")?.hex).toBe("#ffffff");
		expect(parseColorInput("2b5fd9")?.hex).toBe("#2b5fd9");
		expect(parseColorInput("rgb(43 95 217)")?.hex).toBe("#2b5fd9");
		expect(parseColorInput("oklch(1 0 0)")?.hex).toBe("#ffffff");
	});

	it("rejects anything that is not one color, including declaration injection", () => {
		expect(parseColorInput("not a color")).toBeNull();
		expect(parseColorInput("#fff; color: red")).toBeNull();
		expect(parseColorInput("var(--x)")).toBeNull();
	});

	it("keeps alpha apart from the opaque hex", () => {
		expect(parseColorInput("oklch(1 0 0 / 0.5)")?.alpha).toBeCloseTo(0.5, 2);
	});
});

describe("contrast", () => {
	it("is 21:1 for black on white and 1:1 for a color on itself", () => {
		expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
		expect(contrast("#336699", "#336699")).toBeCloseTo(1, 5);
	});

	it("composites a translucent foreground over the background before measuring", () => {
		const solid = contrast("#000000", "#ffffff") as number;
		const half = contrast("oklch(0 0 0 / 0.5)", "#ffffff") as number;
		expect(half).toBeLessThan(solid);
		expect(half).toBeGreaterThan(3);
	});

	it("is null for colors it cannot evaluate", () => {
		expect(contrast("var(--brand)", "#fff")).toBeNull();
	});
});

describe("wcagLevel", () => {
	it("maps ratios to the WCAG thresholds", () => {
		expect([2.9, 3, 4.49, 4.5, 6.99, 7].map(wcagLevel)).toEqual([
			"fail",
			"AA-large",
			"AA-large",
			"AA",
			"AA",
			"AAA",
		]);
	});
});

describe("toHex / formatOklch", () => {
	it("round-trips a mid blue within one channel step", () => {
		const hex = toHex("oklch(0.55 0.2 260)") as string;
		expect(hex).toMatch(/^#[0-9a-f]{6}$/);
		expect(formatOklch({ l: 0.55, c: 0.2, h: 260 })).toBe("oklch(0.55 0.2 260)");
	});
});

describe("extractPalette / pickBrand", () => {
	it("finds the dominant colors and ignores transparent pixels", () => {
		const data = pixels(["#2b5fd9", 600], ["#ffffff", 300], ["#e8590c", 100]);
		const rgba = Uint8ClampedArray.from([...data, 0, 0, 0, 0, 0, 0, 0, 0]);
		const palette = extractPalette(rgba, { k: 4 });
		expect(palette.length).toBeGreaterThanOrEqual(3);
		expect(palette[0]?.hex).toBe("#2b5fd9");
		expect(palette[0]?.share).toBeCloseTo(0.6, 1);
		expect(palette.reduce((a, p) => a + p.share, 0)).toBeCloseTo(1, 5);
	});

	it("is deterministic", () => {
		const data = pixels(["#16a34a", 400], ["#111111", 400], ["#fafafa", 200]);
		expect(extractPalette(data)).toEqual(extractPalette(data));
	});

	it("picks the vivid cluster over a bigger white or black one", () => {
		const data = pixels(["#ffffff", 700], ["#111111", 200], ["#e8590c", 100]);
		expect(pickBrand(extractPalette(data))?.hex).toBe("#e8590c");
	});

	it("falls back to the largest cluster for a grayscale image and to null for an empty one", () => {
		const gray = pixels(["#808080", 500], ["#cccccc", 100]);
		expect(pickBrand(extractPalette(gray))?.hex).toBe("#808080");
		expect(extractPalette(new Uint8ClampedArray(0))).toEqual([]);
		expect(pickBrand([])).toBeNull();
	});
});

describe("maxChroma", () => {
	/** Channels of the hex a color renders as. */
	const channels = (c: string) =>
		[1, 3, 5].map((i) => Number.parseInt(toHex(c)?.slice(i, i + 2) ?? "", 16));

	it("is the sRGB gamut edge: a channel sits on 0 or 255 there, and not below it", () => {
		for (const [l, h] of [
			[0.5, 30],
			[0.7, 145],
			[0.9, 260],
		] as const) {
			const edge = maxChroma(l, h);
			expect(edge).toBeGreaterThan(0.02);
			const at = channels(`oklch(${l} ${edge} ${h})`);
			expect(at.some((v) => v <= 1 || v >= 254)).toBe(true);
			const inside = channels(`oklch(${l} ${edge * 0.7} ${h})`);
			expect(inside.every((v) => v > 1 && v < 254)).toBe(true);
		}
	});

	it("is 0 at black and white, where only gray exists", () => {
		expect(maxChroma(0, 120)).toBe(0);
		expect(maxChroma(1, 120)).toBe(0);
	});
});

describe("formatColor", () => {
	it("writes oklch() with alpha only when translucent, and hex with #rrggbbaa", () => {
		const c = { l: 0.55, c: 0.2, h: 260 };
		expect(formatColor(c, 1, "oklch")).toBe("oklch(0.55 0.2 260)");
		expect(formatColor(c, 0.5, "oklch")).toBe("oklch(0.55 0.2 260 / 0.5)");
		expect(formatColor(c, 1, "hex")).toMatch(/^#[0-9a-f]{6}$/);
		expect(formatColor(c, 0.5, "hex")).toMatch(/^#[0-9a-f]{6}80$/);
	});
});

describe("oklchSlice", () => {
	it("is opaque inside the gamut, transparent outside, and white on top, black at the bottom", () => {
		const w = 40;
		const h = 40;
		const px = oklchSlice(250, w, h, 0.33);
		const at = (x: number, y: number) => Array.from(px.slice((y * w + x) * 4, (y * w + x) * 4 + 4));
		expect(
			at(0, 0)
				.slice(0, 3)
				.every((v) => v > 240)
		).toBe(true);
		expect(
			at(0, h - 1)
				.slice(0, 3)
				.every((v) => v < 15)
		).toBe(true);
		expect(at(w - 1, 0)[3]).toBe(0);
		expect(at(0, h >> 1)[3]).toBe(255);
		// The opaque run on a row ends exactly at the gamut edge maxChroma reports for that lightness.
		const row = h >> 1;
		let last = 0;
		for (let x = 0; x < w; x++) if (at(x, row)[3] === 255) last = x;
		const l = 1 - (row + 0.5) / h;
		expect(((last + 0.5) / w) * 0.33).toBeCloseTo(maxChroma(l, 250), 1);
	});
});

describe("peakChroma", () => {
	it("is at least the edge at any lightness, and reached by one of them", () => {
		for (const h of [30, 145, 250]) {
			const peak = peakChroma(h);
			for (const l of [0.2, 0.5, 0.8]) expect(maxChroma(l, h)).toBeLessThanOrEqual(peak + 1e-9);
			expect(peak).toBeGreaterThan(0.1);
		}
	});
});
