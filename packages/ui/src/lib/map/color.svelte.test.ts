import { afterEach, describe, expect, it } from "vitest";
import { colorScheme } from "../stores/color-scheme.svelte.js";
import { mapColors, tokenColor } from "./index.js";

const root = document.documentElement;
afterEach(() => {
	root.style.removeProperty("--t-test");
	colorScheme.setPreference("light");
});

describe("tokenColor", () => {
	it("reads a hex token as [r,g,b,a] with a 0-1 alpha", () => {
		root.style.setProperty("--t-test", "#ff8000");
		expect(tokenColor("--t-test")).toEqual([255, 128, 0, 1]);
	});

	it("resolves oklch() through the canvas", () => {
		root.style.setProperty("--t-test", "oklch(0.7 0.2 30)");
		const [r, g, b, a] = tokenColor("--t-test");
		expect(r).toBeGreaterThan(200);
		expect(r).toBeGreaterThan(g);
		expect(r).toBeGreaterThan(b);
		expect(a).toBe(1);
	});

	it("resolves color-mix() and keeps its alpha", () => {
		root.style.setProperty("--t-test", "color-mix(in srgb, #ff0000 50%, transparent)");
		const [r, , , a] = tokenColor("--t-test");
		expect(r).toBe(255);
		expect(a).toBeCloseTo(0.5, 1);
	});

	it("multiplies the token alpha by the alpha argument", () => {
		root.style.setProperty("--t-test", "rgba(0, 0, 255, 0.5)");
		expect(tokenColor("--t-test", 0.5)[3]).toBeCloseTo(0.25, 1);
	});

	it("accepts a raw CSS color instead of a token name", () => {
		expect(tokenColor("#00ff00")).toEqual([0, 255, 0, 1]);
	});

	it("is transparent black for an unset token", () => {
		expect(tokenColor("--t-nope")).toEqual([0, 0, 0, 0]);
	});

	it("re-reads a token when the same name changes value", () => {
		root.style.setProperty("--t-test", "#ff0000");
		expect(tokenColor("--t-test")[0]).toBe(255);
		root.style.setProperty("--t-test", "#0000ff");
		expect(tokenColor("--t-test")).toEqual([0, 0, 255, 1]);
	});
});

describe("mapColors", () => {
	it("follows the color scheme without a manual reset", () => {
		colorScheme.setPreference("light");
		const light = [...mapColors().surface];
		colorScheme.setPreference("dark");
		const dark = mapColors().surface;
		expect(dark).not.toEqual(light);
	});

	it("exposes brand and text as 4-number arrays", () => {
		const c = mapColors();
		for (const k of [
			"brand",
			"brandMuted",
			"surface",
			"text",
			"success",
			"error",
			"warning",
			"info",
		] as const) {
			expect(c[k]).toHaveLength(4);
		}
	});
});
