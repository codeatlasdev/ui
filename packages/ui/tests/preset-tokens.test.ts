import { describe, expect, it, spyOn } from "bun:test";
import { presetContrastIssues } from "../src/lib/theme/contrast.js";
import { defineTheme, presetCSS, themeCSS } from "../src/lib/theme/define.js";
import { evalColor as parseCssColor } from "../src/lib/utils/css-color-mix.js";
import { caThemePlugin } from "../src/lib/vite-plugin.js";

// #374: preset role colors accept alpha / oklch / color-mix, and a preset carries domain tokens
// (status, tier, channel...) that follow the scheme and the preset.
const preset = (extra: object) =>
	defineTheme({ presets: [{ id: "app", color: "#3b82f6", ...extra }], defaultPreset: "app" });

/** Declarations of the rule at `index` (0 = light, 1 = dark), as a map. */
function block(css: string, index: number): Record<string, string> {
	const rule = css.split("\n}")[index] ?? "";
	const out: Record<string, string> = {};
	for (const m of rule.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
	return out;
}

describe("role colors with alpha (#374)", () => {
	it("passes oklch() with alpha and color-mix() through untouched", () => {
		const css = themeCSS(
			preset({
				colors: {
					dark: {
						textSecondary: "oklch(1 0 0 / 0.62)",
						borderSubtle: "color-mix(in oklab, white 10%, transparent)",
					},
				},
			})
		);
		const dark = block(css, 1);
		expect(dark["--ca-text-secondary"]).toBe("oklch(1 0 0 / 0.62)");
		expect(dark["--ca-outline-subtle"]).toBe("color-mix(in oklab, white 10%, transparent)");
	});

	it("accepts { color, alpha } and emits that color at that alpha", () => {
		const css = themeCSS(
			preset({ colors: { dark: { borderSubtle: { color: "#fff", alpha: 0.1 } } } })
		);
		expect(block(css, 1)["--ca-outline-subtle"]).toBe("color-mix(in oklab, #fff 10%, transparent)");
	});

	it("keeps an opaque #rrggbb role exactly as in 4.5.0", () => {
		const css = themeCSS(preset({ colors: { dark: { text: "#f1f4f7" } } }));
		expect(block(css, 1)["--ca-text-primary"]).toBe("#f1f4f7");
	});

	it("rejects a role value that is not a single CSS color", () => {
		expect(() => preset({ colors: { dark: { text: "red; --x: 1" } } })).toThrow(
			/colors\.dark\.text/
		);
		expect(() => preset({ colors: { dark: { text: "not a color" } } })).toThrow(
			/colors\.dark\.text/
		);
		expect(() =>
			preset({ colors: { dark: { borderSubtle: { color: "#fff", alpha: 2 } } } })
		).toThrow(/alpha/);
	});
});

describe("domain tokens per preset and scheme (#374)", () => {
	const t = preset({
		tokens: {
			status: {
				new: { dark: "oklch(0.76 0.11 245)", light: "oklch(0.55 0.14 245)" },
				won: "oklch(0.7 0.13 155)",
			},
			channel: { whatsapp: "#25d366" },
		},
	});
	const css = themeCSS(t);

	it("emits --ca-token-<group>-<name> in the light and dark rules of the preset", () => {
		expect(block(css, 0)["--ca-token-status-new"]).toBe("oklch(0.55 0.14 245)");
		expect(block(css, 1)["--ca-token-status-new"]).toBe("oklch(0.76 0.11 245)");
	});

	it("a single value serves both schemes", () => {
		expect(block(css, 0)["--ca-token-status-won"]).toBe("oklch(0.7 0.13 155)");
		expect(block(css, 1)["--ca-token-status-won"]).toBe("oklch(0.7 0.13 155)");
		expect(block(css, 0)["--ca-token-channel-whatsapp"]).toBe("#25d366");
	});

	it("derives -subtle (a tint) and -contrast (readable text on the token) per scheme", () => {
		const light = block(css, 0);
		expect(light["--ca-token-status-new-subtle"]).toMatch(
			/^color-mix\(in oklab, var\(--ca-token-status-new\) \d+%, transparent\)$/
		);
		// 0.55 L fill: white reads best; 0.76 L fill (dark scheme): ink reads best.
		expect(light["--ca-token-status-new-contrast"]).toBe("oklch(1 0 0)");
		expect(block(css, 1)["--ca-token-status-new-contrast"]).toBe("oklch(0.10 0 0)");
	});

	it("is scoped to the preset: another preset does not get the tokens", () => {
		const other = themeCSS(
			defineTheme({
				presets: [
					{ id: "app", color: "#3b82f6", tokens: { status: { new: "#fff" } } },
					{ id: "plain", color: "#ef4444" },
				],
			})
		);
		expect(presetCSS({ id: "plain", color: "#ef4444" }, "brand")).not.toContain("--ca-token-");
		expect(other).toContain('[data-preset="app"]');
	});

	it("rejects names and values that would break out of a declaration", () => {
		expect(() => preset({ tokens: { "bad group": { a: "#fff" } } })).toThrow(/tokens/);
		expect(() => preset({ tokens: { status: { "a;b": "#fff" } } })).toThrow(/tokens/);
		expect(() => preset({ tokens: { status: { a: "red; --x: 1" } } })).toThrow(/tokens\.status\.a/);
	});

	it("a theme without tokens emits no --ca-token-* declaration", () => {
		expect(themeCSS(preset({}))).not.toContain("--ca-token-");
	});
});

describe("contrast warnings composite alpha (#374)", () => {
	const issues = (colors: object) => presetContrastIssues(preset({ colors }));

	it("flags a translucent secondary text under 4.5:1 after compositing on its surface", () => {
		const found = issues({ dark: { textSecondary: "oklch(1 0 0 / 0.3)" } });
		expect(found.length).toBeGreaterThan(0);
		expect(found[0]).toMatchObject({ preset: "app", scheme: "dark", role: "textSecondary" });
		expect(found[0]?.ratio).toBeLessThan(4.5);
		expect(found[0]?.message).toMatch(/app.*dark.*textSecondary.*4\.5:1/);
	});

	it("is silent when the composited text holds 4.5:1", () => {
		expect(issues({ dark: { textSecondary: "oklch(1 0 0 / 0.8)" } })).toEqual([]);
		expect(issues({ dark: { textSecondary: { color: "#fff", alpha: 0.8 } } })).toEqual([]);
	});

	it("composites the alpha over the role's own surface, not over white or black", () => {
		// The same translucent white passes on a dark page and fails on a light one.
		expect(issues({ dark: { background: "#0b0d10", text: "oklch(1 0 0 / 0.7)" } })).toEqual([]);
		expect(
			issues({ light: { background: "#f6f6f6", text: "oklch(1 0 0 / 0.7)" } }).length
		).toBeGreaterThan(0);
	});

	it("skips colors it cannot evaluate (var(), named keywords it does not know)", () => {
		expect(issues({ dark: { textSecondary: "var(--x)" } })).toEqual([]);
	});

	it("caThemePlugin prints one warning for it", () => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		try {
			caThemePlugin({
				presets: [
					{
						id: "app",
						color: "#3b82f6",
						colors: { dark: { textSecondary: "oklch(1 0 0 / 0.3)" } },
					},
				],
			});
			expect(warn).toHaveBeenCalledTimes(1);
			expect(String(warn.mock.calls[0]?.[0])).toContain("textSecondary");
		} finally {
			warn.mockRestore();
		}
	});
});

describe("parseCssColor (#374)", () => {
	it("reads hex, rgb, oklch and color-mix with alpha to sRGB + alpha", () => {
		expect(parseCssColor("#ff8000")).toEqual({ rgb: [1, 128 / 255, 0], alpha: 1 });
		expect(parseCssColor("#ffffff80")?.alpha).toBeCloseTo(0.502, 2);
		expect(parseCssColor("rgb(0 0 255 / 50%)")).toEqual({ rgb: [0, 0, 1], alpha: 0.5 });
		const white = parseCssColor("oklch(1 0 0 / 0.62)");
		expect(white?.alpha).toBe(0.62);
		for (const v of white?.rgb ?? []) expect(v).toBeCloseTo(1, 6);
		const mix = parseCssColor("color-mix(in oklab, white 10%, transparent)");
		expect(mix?.alpha).toBeCloseTo(0.1, 3);
		expect(mix?.rgb[0]).toBeCloseTo(1, 2);
	});

	it("is null for syntax it cannot evaluate", () => {
		expect(parseCssColor("var(--x)")).toBeNull();
		expect(parseCssColor("hotpink; --x: 1")).toBeNull();
	});
});
