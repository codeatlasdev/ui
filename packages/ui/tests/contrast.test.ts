import { describe, expect, it } from "bun:test";
import { BUILTIN_PRESETS } from "../src/lib/theme/builtins.js";
import { presetCSS } from "../src/lib/theme/define.js";
import { oklchToHex } from "../src/lib/utils/palette-generator.js";

// WCAG 2 contrast on gamut-clipped sRGB, same conversion the package uses for chrome.
// Colors are kept sRGB-encoded (0..1) so alpha blends the way browsers do it (in encoded space);
// luminance linearizes only when computing the ratio.
const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const linear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: number[]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const ratio = (a: number[], b: number[]) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
/** Composite an `oklch(L C H / a)` over an opaque background (encoded sRGB, like a browser). */
const over = (color: string, bg: number[]) => {
	const alpha = Number(color.match(/\/\s*([\d.]+)\)/)?.[1] ?? 1);
	const fg = rgb(oklchToHex(color));
	return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));
};

/** Token map of the `prefers-contrast: more` block for one scheme (`light` = first rule, `dark` = second). */
function contrastTokens(css: string, scheme: "light" | "dark") {
	const media = css.slice(css.indexOf("@media (prefers-contrast: more)"));
	const rules = [...media.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
	const body = rules[scheme === "light" ? 0 : 1];
	return Object.fromEntries(
		[...body.matchAll(/(--ca-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]])
	);
}

const brand = { id: "acme", color: "#0f766e" as const };
const sources = [...BUILTIN_PRESETS, brand];
// Darkest light surface and lightest dark surface a text token can sit on (generator constants).
const surface = (scheme: "light" | "dark", hue: number) =>
	rgb(oklchToHex(scheme === "light" ? `oklch(0.930 0.006 ${hue})` : `oklch(0.235 0.006 ${hue})`));

describe("prefers-contrast: more tokens", () => {
	for (const src of sources) {
		for (const scheme of ["light", "dark"] as const) {
			it(`${src.id} ${scheme}: secondary/hint text >= 7:1, outlines >= 3:1`, () => {
				const css = presetCSS(src, "hue" in src ? "builtin" : "brand");
				const tokens = contrastTokens(css, scheme);
				const hue = Number(tokens["--ca-text-secondary"].match(/\s([\d.]+)\)$/)?.[1]);
				const bg = surface(scheme, hue);
				for (const name of ["--ca-text-secondary", "--ca-text-hint"]) {
					expect(ratio(over(tokens[name], bg), bg), name).toBeGreaterThanOrEqual(7);
				}
				for (const name of ["--ca-outline-subtle", "--ca-outline-default", "--ca-outline-strong"]) {
					expect(ratio(over(tokens[name], bg), bg), name).toBeGreaterThanOrEqual(3);
				}
				expect(ratio(over(tokens["--ca-outline-strong"], bg), bg)).toBeGreaterThanOrEqual(7);
			});
		}
	}

	it("brand presets get the block too, scoped like the base tokens", () => {
		const css = presetCSS(brand, "brand");
		expect(css).toMatch(/@media \(prefers-contrast: more\) \{\n\[data-preset="acme"\]/);
	});
});
