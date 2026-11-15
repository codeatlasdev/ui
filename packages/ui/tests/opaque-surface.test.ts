import { describe, expect, it } from "bun:test";
import { colorAlpha } from "../src/lib/testing/opaque.js";

// What `getComputedStyle(el).backgroundColor` returns, per syntax (#1158). Chromium's own output for
// each is checked in src/lib/testing/opaque.svelte.test.ts; these pin the parser on every form.
describe("colorAlpha", () => {
	it("reads the legacy comma forms", () => {
		expect(colorAlpha("rgb(10, 20, 30)")).toBe(1);
		expect(colorAlpha("rgba(10, 20, 30, 0.5)")).toBe(0.5);
		expect(colorAlpha("rgba(0, 0, 0, 0)")).toBe(0);
		expect(colorAlpha("hsla(0, 100%, 50%, 0.6)")).toBe(0.6);
		expect(colorAlpha("hsl(0, 100%, 50%)")).toBe(1);
	});

	it("reads the alpha after the slash, as a number, a percentage or none", () => {
		expect(colorAlpha("rgb(10 20 30 / 25%)")).toBe(0.25);
		expect(colorAlpha("hsl(0 100% 50% / 40%)")).toBe(0.4);
		expect(colorAlpha("hwb(0 0% 0% / none)")).toBe(0);
		expect(colorAlpha("lab(50 10 20 / 0.3)")).toBe(0.3);
		expect(colorAlpha("lch(50 10 20 / .35)")).toBe(0.35);
	});

	it("reads color() and the OKLab spaces that color-mix resolves to", () => {
		expect(colorAlpha("color(srgb 0.1 0.2 0.3 / 0.8)")).toBe(0.8);
		expect(colorAlpha("color(display-p3 1 0 0)")).toBe(1);
		expect(colorAlpha("oklch(0.995 0.001 55)")).toBe(1);
		expect(colorAlpha("oklch(0.235 0.002 55 / 0.94)")).toBe(0.94);
		expect(colorAlpha("oklab(0.5 0.01 -0.02 / 0.94)")).toBe(0.94);
		expect(colorAlpha("OKLCH(0.5 0.1 200 / 0.9)")).toBe(0.9);
	});

	it("reads hex with and without an alpha digit pair", () => {
		expect(colorAlpha("#fff")).toBe(1);
		expect(colorAlpha("#ffffff")).toBe(1);
		expect(colorAlpha("#f008")).toBeCloseTo(0x88 / 255, 6);
		expect(colorAlpha("#ff000080")).toBeCloseTo(0x80 / 255, 6);
	});

	it("reads keywords: transparent is 0, a named or system color is opaque", () => {
		expect(colorAlpha("transparent")).toBe(0);
		expect(colorAlpha("red")).toBe(1);
		expect(colorAlpha("Canvas")).toBe(1);
	});

	it("throws on what it cannot resolve instead of guessing opaque", () => {
		const read = (c: string) => {
			try {
				return colorAlpha(c);
			} catch (e) {
				return e instanceof TypeError ? "TypeError" : e;
			}
		};
		const bad = [
			"",
			"currentcolor",
			"inherit",
			"var(--ca-sheet-bg)",
			"color-mix(in srgb, currentcolor 50%, red)",
			"rgb(0 0 0 / calc(0.5))",
			"rgb(0 0 0 / half)",
			"#12",
			"not a color",
			"linear-gradient(red, blue)",
		];
		expect(bad.map((c) => [c, read(c)])).toEqual(bad.map((c) => [c, "TypeError"]));
	});
});
