import { describe, expect, it, spyOn } from "bun:test";
import { presetContrastIssues } from "../src/lib/theme/contrast.js";
import { defineTheme, presetTokens, themeCSS } from "../src/lib/theme/define.js";
import { contrastRatio, hexToOklch } from "../src/lib/utils/palette-generator.js";
import { caThemePlugin } from "../src/lib/vite-plugin.js";

// #354: a preset owns the primary-button roles and the field font size, emitted with the same
// selectors as every other role (no app CSS has to repeat the generated selector list).
const preset = (extra: object) =>
	defineTheme({
		presets: [{ id: "night", color: "#f27636", ...extra }],
		defaultPreset: "night",
	});

/** Selector list of the nth generated rule that declares `decl`. */
function selectorOf(css: string, decl: string, nth = 0) {
	const rule = css.split("\n}").filter((r) => r.includes(decl))[nth];
	return rule?.slice(0, rule.indexOf("{")).trim();
}

describe("preset button and field roles (#354)", () => {
	const t = preset({
		colors: {
			dark: {
				brand: "#f27636",
				brandFill: "#f27636",
				brandFillHover: "#f5934f",
				brandContrast: "#1a1208",
			},
		},
		sizes: { inputFontSize: "0.875rem" },
	});
	const css = themeCSS(t);

	it("emits the three roles after the regenerated brand ramp, in the dark scheme only", () => {
		const darkRule = css.split("\n}")[1] ?? "";
		expect(darkRule).toContain("--ca-brand-fill: #f27636;");
		expect(darkRule).toContain("--ca-brand-fill-hover: #f5934f;");
		expect(darkRule).toContain("--ca-brand-contrast: #1a1208;");
		expect(darkRule.lastIndexOf("--ca-brand-fill:")).toBeGreaterThan(
			darkRule.indexOf("--ca-brand-main:")
		);
		expect(css.split("\n}")[0]).not.toContain("#1a1208");
	});

	it("uses the selector list of the other roles, so no app rule has to out-rank it", () => {
		const roles = selectorOf(css, "--ca-brand-contrast: #1a1208");
		expect(roles).toBeDefined();
		expect(roles).toBe(selectorOf(css, "--ca-brand-main:", 1));
	});

	it("emits inputFontSize for both schemes and keeps the 16px floor on coarse pointers", () => {
		expect(css.split("\n}")[0]).toContain("--ca-input-font-size: 0.875rem;");
		expect(css.split("\n}")[1]).toContain("--ca-input-font-size: 0.875rem;");
		const coarse = css.slice(css.indexOf("@media (pointer: coarse), (max-width: 899.98px)"));
		expect(coarse).toContain("--ca-input-font-size: max(16px, 0.875rem);");
		expect(coarse).toContain('[data-preset="night"]');
	});

	it("rejects values that are not CSS declarations", () => {
		expect(() => preset({ sizes: { inputFontSize: "1rem; color: red" } })).toThrow(/inputFontSize/);
	});
});

describe("brandContrast on brandFill warns under 4.5:1 (#354)", () => {
	it("reports the pair, the scheme and the ratio", () => {
		const issues = presetContrastIssues(
			preset({ colors: { dark: { brandFill: "#f27636", brandContrast: "#ffffff" } } })
		);
		expect(issues).toHaveLength(1);
		expect(issues[0]).toMatchObject({ preset: "night", scheme: "dark" });
		expect(issues[0]?.ratio).toBeLessThan(4.5);
		expect(issues[0]?.message).toMatch(/night.*dark.*brandContrast.*brandFill.*4\.5:1/);
	});

	it("is silent for an AA pair and for presets that set no role", () => {
		expect(
			presetContrastIssues(
				preset({ colors: { dark: { brandFill: "#f27636", brandContrast: "#1a1208" } } })
			)
		).toEqual([]);
		expect(presetContrastIssues(preset({}))).toEqual([]);
	});

	it("measures a lone brandContrast against the generated fill", () => {
		const lone = (c: string) =>
			presetContrastIssues(preset({ colors: { dark: { brandContrast: c } } }));
		expect(lone("#ffffff").length + lone("#000000").length).toBe(1);
	});

	it("caThemePlugin prints the issue once at startup", () => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		try {
			caThemePlugin({
				presets: [
					{
						id: "night",
						color: "#f27636",
						colors: { dark: { brandFill: "#f27636", brandContrast: "#ffffff" } },
					},
				],
			});
			expect(warn).toHaveBeenCalledTimes(1);
			expect(String(warn.mock.calls[0]?.[0])).toContain("brandContrast");
		} finally {
			warn.mockRestore();
		}
	});
});

// #687: `colors.<scheme>.brand` regenerates the brand ramp for THAT scheme. The dark scheme used to
// receive the light ramp (dark text shades meant for a light surface, ~2:1 on a near-black page).
describe("colors.<scheme>.brand regenerates the ramp for its own scheme (#687)", () => {
	const base = { id: "acme", color: "#EA6F2F" as const };
	const surfaces = [
		"--ca-surface-sunken",
		"--ca-surface-base",
		"--ca-surface-raised",
		"--ca-surface-overlay",
	];
	const L = (v: string) => Number(v.match(/oklch\(([\d.]+)/)?.[1]);

	for (const scheme of ["light", "dark"] as const) {
		it(`${scheme}: --ca-brand-text clears 4.5:1 on every surface with a pinned brand`, () => {
			const t = presetTokens({ ...base, colors: { [scheme]: { brand: "#f27636" } } })[scheme];
			const text = t["--ca-brand-text"] as string;
			for (const s of surfaces) {
				const ratio = contrastRatio(text, t[s] as string);
				expect(ratio, `${s}`).not.toBeNull();
				expect(ratio as number, `${s}`).toBeGreaterThanOrEqual(4.5);
			}
		});
	}

	it("dark: the brand text is lighter than the dark surfaces, as without the pin", () => {
		const free = presetTokens(base).dark;
		const pinned = presetTokens({ ...base, colors: { dark: { brand: "#f27636" } } }).dark;
		expect(L(pinned["--ca-brand-text"] as string)).toBeGreaterThan(
			L(pinned["--ca-surface-overlay"] as string)
		);
		expect(L(pinned["--ca-brand-text"] as string)).toBeGreaterThan(0.7);
		expect(L(free["--ca-brand-text"] as string)).toBeGreaterThan(0.7);
	});

	it("dark: the pinned colour is the dark brand main, glows follow it", () => {
		const pinned = presetTokens({ ...base, colors: { dark: { brand: "#f27636" } } }).dark;
		const { l, h } = hexToOklch("#f27636");
		expect(Math.abs(L(pinned["--ca-brand-main"] as string) - l)).toBeLessThan(0.01);
		expect(pinned["--ca-glow-primary"]).toContain(String(Math.round(l * 100) / 100).slice(0, 4));
		expect(h).toBeGreaterThan(0);
	});

	it("pinning the dark brand leaves the light scheme untouched, and the other way round", () => {
		const free = presetTokens(base);
		expect(presetTokens({ ...base, colors: { dark: { brand: "#f27636" } } }).light).toEqual(
			free.light
		);
		const lightPinned = presetTokens({ ...base, colors: { light: { brand: "#f27636" } } });
		expect(lightPinned.dark).toEqual(free.dark);
	});
});

// #706: the solid destructive fill and its label are presets roles of their own: `error` stays the
// light feedback colour (text, borders) in dark, so one value cannot serve both.
describe("errorFill / errorContrast are preset roles (#706)", () => {
	const dark = { errorFill: "oklch(0.6 0.19 25)", errorContrast: "oklch(0.985 0.005 25)" };

	it("emits the pair for the scheme that sets it, next to a lighter error text colour", () => {
		const t = presetTokens({
			id: "x",
			color: "#f27636",
			colors: { dark: { error: "oklch(0.72 0.16 25)", ...dark } },
		});
		expect(t.dark["--ca-semantic-error-fill"]).toBe(dark.errorFill);
		expect(t.dark["--ca-semantic-error-contrast"]).toBe(dark.errorContrast);
		expect(t.dark["--ca-semantic-error"]).toBe("oklch(0.72 0.16 25)");
		expect(t.light["--ca-semantic-error-fill"]).toBeUndefined();
	});

	it("errorFill alone derives the label from it; errorContrast alone keeps the fill", () => {
		const fillOnly = presetTokens({
			id: "x",
			color: "#f27636",
			colors: { dark: { errorFill: dark.errorFill } },
		});
		expect(fillOnly.dark["--ca-semantic-error-fill"]).toBe(dark.errorFill);
		expect(fillOnly.dark["--ca-semantic-error-contrast"]).toMatch(/^oklch\(/);
		const labelOnly = presetTokens({
			id: "x",
			color: "#f27636",
			colors: { dark: { errorContrast: "#ffffff" } },
		});
		expect(labelOnly.dark["--ca-semantic-error-fill"]).toBeUndefined();
		expect(labelOnly.dark["--ca-semantic-error-contrast"]).toBe("#ffffff");
	});

	it("reaches themeCSS in the dark rule, so a portaled Dialog inherits it", () => {
		const css = themeCSS(preset({ colors: { dark: dark } }));
		expect(selectorOf(css, "--ca-semantic-error-fill: oklch(0.6 0.19 25)")).toContain(".dark");
		expect(css).toContain("--ca-semantic-error-contrast: oklch(0.985 0.005 25)");
	});

	it("presetContrastIssues reports a label under 4.5:1 on the fill", () => {
		const issues = presetContrastIssues(
			preset({
				colors: { dark: { errorFill: "oklch(0.6 0.19 25)", errorContrast: "oklch(0.7 0.1 25)" } },
			})
		);
		expect(issues).toHaveLength(1);
		expect(issues[0]?.scheme).toBe("dark");
		expect(issues[0]?.message).toContain("errorContrast");
		// The issue's own pair is 4.13:1: reported, not corrected.
		expect(presetContrastIssues(preset({ colors: { dark } }))).toHaveLength(1);
		expect(
			presetContrastIssues(
				preset({
					colors: {
						dark: { errorFill: "oklch(0.5 0.19 25)", errorContrast: "oklch(0.985 0.005 25)" },
					},
				})
			)
		).toEqual([]);
	});

	it("a lone errorContrast is measured against the generated fill", () => {
		const lone = (c: string) =>
			presetContrastIssues(preset({ colors: { dark: { errorContrast: c } } }));
		expect(lone("#ffffff").length + lone("#000000").length).toBe(1);
	});
});
