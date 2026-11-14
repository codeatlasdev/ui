import { afterEach, describe, expect, it } from "vitest";
import { colorAlpha, expectOpaqueSurface, surfaceAlpha } from "./index";

const mounted: HTMLElement[] = [];
function box(style: string): HTMLElement {
	const el = Object.assign(document.createElement("div"), { className: "probe" });
	el.setAttribute("style", `width:40px;height:40px;${style}`);
	document.body.append(el);
	mounted.push(el);
	return el;
}
afterEach(() => {
	for (const el of mounted.splice(0)) el.remove();
});

/** Rejects or resolves: the error message, or the alpha it resolved with. */
const outcome = (p: Promise<number>): Promise<{ alpha?: number; error?: string }> =>
	p.then(
		(alpha) => ({ alpha }),
		(e: Error) => ({ error: e.message })
	);

// What Chromium serializes for each authored syntax is the parser's real input: color-mix in
// oklab comes back as oklab(), in srgb as color(srgb), a relative color as color(srgb) (#1158).
// Titles are labels, not the CSS: a slash or a percent sign in a title ends up in a trace file name.
const AUTHORED: [label: string, css: string, alpha: number][] = [
	["rgb", "rgb(10 20 30)", 1],
	["rgba legacy", "rgba(10, 20, 30, 0.5)", 0.5],
	// Chromium serializes an 8-bit alpha with the shortest decimal that rounds back (0x80 is 0.5).
	["hex alpha", "#0a141ecc", 0.8],
	["hsl percent", "hsl(0 100% 50% / 40%)", 0.4],
	["color srgb", "color(srgb 0.1 0.2 0.3 / 0.25)", 0.25],
	["oklch", "oklch(0.5 0.1 200 / 0.8)", 0.8],
	["oklab", "oklab(0.5 0.01 0.02 / 0.7)", 0.7],
	["lab", "lab(50 10 20 / 0.3)", 0.3],
	["mix oklab", "color-mix(in oklab, oklch(0.99 0 0) 94%, transparent)", 0.94],
	["mix srgb", "color-mix(in srgb, red 50%, transparent)", 0.5],
	["relative", "rgb(from red r g b / 0.6)", 0.6],
	["transparent", "transparent", 0],
];

describe("colorAlpha on Chromium's computed colors", () => {
	for (const [label, css, alpha] of AUTHORED)
		it(label, () => {
			const computed = getComputedStyle(box(`background-color:${css}`)).backgroundColor;
			expect(colorAlpha(computed), computed).toBeCloseTo(alpha, 3);
		});
});

describe("expectOpaqueSurface", () => {
	it("fails a fill whose token is at alpha 0.8", async () => {
		const el = box(
			"--ca-sheet-bg:color-mix(in oklab, oklch(0.99 0 0) 80%, transparent);background:var(--ca-sheet-bg)"
		);
		const r = await outcome(expectOpaqueSurface(el));
		expect(r).toHaveProperty("error");
		expect(r.error).toMatch(/div\.probe/);
		expect(r.error).toMatch(/alpha 0\.8\b/);
		expect(r.error).toMatch(/below 0\.9/);
	});

	it("passes at exactly the floor and returns the alpha", async () => {
		const el = box("background:color-mix(in oklab, oklch(0.99 0 0) 90%, transparent)");
		expect(await outcome(expectOpaqueSurface(el))).toEqual({ alpha: 0.9 });
	});

	it("takes a stricter floor", async () => {
		const el = box("background:color-mix(in oklab, oklch(0.99 0 0) 94%, transparent)");
		expect(await outcome(expectOpaqueSurface(el))).toEqual({ alpha: 0.94 });
		expect(await outcome(expectOpaqueSurface(el, { min: 0.95 }))).toHaveProperty("error");
	});

	it("counts the element's own opacity", async () => {
		const el = box("background:rgb(255 255 255);opacity:0.5");
		expect(surfaceAlpha(el)).toBe(0.5);
		expect(await outcome(expectOpaqueSurface(el))).toHaveProperty("error");
	});

	it("names a gradient that the color does not measure", async () => {
		const el = box("background:linear-gradient(white, white)");
		const r = await outcome(expectOpaqueSurface(el));
		expect(r).toHaveProperty("error");
		expect(r.error).toMatch(/background-image/);
	});
});
