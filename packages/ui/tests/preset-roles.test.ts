import { describe, expect, it, spyOn } from "bun:test";
import { defineTheme, presetContrastIssues, themeCSS } from "../src/lib/theme/define.js";
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
