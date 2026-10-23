import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineTheme, themeCSS } from "../theme/define.js";
import { onTokensChange, tokenRgba } from "./rgba.js";

// #374: a domain token declared on a preset resolves to the same color in CSS and as [r,g,b,a],
// and the answer follows the scheme and the preset.
const theme = defineTheme({
	presets: [
		{
			id: "app",
			color: "#3b82f6",
			tokens: {
				status: { new: { dark: "oklch(0.76 0.11 245)", light: "oklch(0.45 0.14 245)" } },
				glass: { veil: "oklch(1 0 0 / 0.5)" },
			},
		},
		{ id: "other", color: "#ef4444", tokens: { status: { new: "#ff0000" } } },
	],
});

let style: HTMLStyleElement;
const html = document.documentElement;
const setMode = (scheme: "light" | "dark", preset = "app") => {
	html.classList.toggle("dark", scheme === "dark");
	html.setAttribute("data-preset", preset);
};

/** What the browser itself computes for a token, as bytes, through a throwaway element. */
function cssBytes(token: string): [number, number, number] {
	const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
	if (!probe) throw new Error("no canvas");
	probe.fillStyle = "#000";
	probe.fillStyle = getComputedStyle(html).getPropertyValue(token).trim();
	probe.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
	return [r, g, b];
}

beforeEach(() => {
	style = document.createElement("style");
	style.textContent = themeCSS(theme);
	document.head.appendChild(style);
});
afterEach(() => {
	style.remove();
	html.classList.remove("dark");
	html.removeAttribute("data-preset");
});

describe("tokenRgba", () => {
	it("matches the CSS value within 1/255, by dotted name or custom property", () => {
		setMode("dark");
		const [r, g, b, a] = tokenRgba("status.new");
		const css = cssBytes("--ca-token-status-new");
		expect(Math.abs(r - css[0])).toBeLessThanOrEqual(1);
		expect(Math.abs(g - css[1])).toBeLessThanOrEqual(1);
		expect(Math.abs(b - css[2])).toBeLessThanOrEqual(1);
		expect(a).toBe(1);
		expect(tokenRgba("--ca-token-status-new")).toEqual([r, g, b, a]);
	});

	it("keeps alpha: a translucent token is [r,g,b,0.5]", () => {
		setMode("dark");
		const [r, g, b, a] = tokenRgba("glass.veil");
		// 8-bit rounding of a half-transparent pixel is inherent: the criterion is within 1/255.
		for (const ch of [r, g, b]) expect(Math.abs(ch - 255)).toBeLessThanOrEqual(1);
		expect(a).toBeCloseTo(0.5, 1);
	});

	it("updates when the scheme changes", () => {
		setMode("dark");
		const dark = tokenRgba("status.new");
		setMode("light");
		const light = tokenRgba("status.new");
		expect(light).not.toEqual(dark);
		expect(light[0]).toBeLessThan(dark[0]);
	});

	it("updates when the preset changes", () => {
		setMode("dark", "app");
		const app = tokenRgba("status.new");
		setMode("dark", "other");
		expect(tokenRgba("status.new")).toEqual([255, 0, 0, 1]);
		expect(app).not.toEqual([255, 0, 0, 1]);
	});

	it("is transparent black for a token that is not declared", () => {
		setMode("dark");
		expect(tokenRgba("status.nope")).toEqual([0, 0, 0, 0]);
	});

	it("resolves the derived -subtle and -contrast names", () => {
		setMode("dark");
		expect(tokenRgba("status.new-contrast")[3]).toBe(1);
		expect(tokenRgba("status.new-subtle")[3]).toBeGreaterThan(0);
		expect(tokenRgba("status.new-subtle")[3]).toBeLessThan(0.5);
	});
});

describe("onTokensChange", () => {
	it("calls back when the scheme or preset attribute flips, and stops after unsubscribe", async () => {
		setMode("light");
		const fn = vi.fn();
		const off = onTokensChange(fn);
		setMode("dark");
		await vi.waitFor(() => expect(fn).toHaveBeenCalled());
		fn.mockClear();
		off();
		// A subscriber added after `off()` is notified by the same change as the removed one would
		// have been: once it fires, the removed callback has had its chance and must not have run.
		const after = vi.fn();
		const offAfter = onTokensChange(after);
		setMode("light");
		await vi.waitFor(() => expect(after).toHaveBeenCalled());
		offAfter();
		expect(fn).not.toHaveBeenCalled();
	});
});
