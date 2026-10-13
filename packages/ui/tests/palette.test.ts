import { describe, expect, it } from "bun:test";
import {
	generatePreset,
	hexToOklch,
	type PresetTokens,
	tokensToCSS,
} from "../src/lib/utils/palette-generator.js";
import {
	DEFAULT_CONFIG,
	editorPreviewCSS,
	editorTokensToCSS,
	type ThemeConfig,
} from "../src/lib/utils/theme-editor.js";

/** Parse `oklch(L C H [/ A])` → numbers. */
function parseOklch(s: string): { l: number; c: number; h: number } {
	const m = s.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)/);
	if (!m) throw new Error(`not oklch: ${s}`);
	return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}

/** WCAG relative luminance of an OKLCH colour (independent re-implementation). */
function luminance({ l, c, h }: { l: number; c: number; h: number }): number {
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);
	const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const lin = [
		4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
		-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
		-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
	].map((v) => Math.min(1, Math.max(0, v)));
	return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(fill: string, text: string): number {
	const [hi, lo] = [luminance(parseOklch(fill)), luminance(parseOklch(text))].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe("hexToOklch", () => {
	it("white and black are achromatic with hue 0", () => {
		expect(hexToOklch("#ffffff")).toMatchObject({ l: 1, c: 0, h: 0 });
		expect(hexToOklch("#000000")).toMatchObject({ l: 0, c: 0, h: 0 });
	});

	it("pure red lands in the OKLCH red region", () => {
		const { l, c, h } = hexToOklch("#ff0000");
		expect(l).toBeCloseTo(0.628, 2);
		expect(c).toBeCloseTo(0.258, 2);
		expect(h).toBeGreaterThan(25);
		expect(h).toBeLessThan(33);
	});

	it("pure blue hue sits near 264°", () => {
		expect(hexToOklch("#0000ff").h).toBeCloseTo(264, 0);
	});
});

describe("generatePreset", () => {
	it("is deterministic", () => {
		expect(generatePreset(260, 0.22, 0.5)).toEqual(generatePreset(260, 0.22, 0.5));
	});

	it("embeds the requested hue/chroma/lightness in brandMain", () => {
		const t = generatePreset(260, 0.22, 0.5);
		expect(t.brandMain).toBe("oklch(0.5 0.22 260)");
	});

	it("dark brand is brighter than light brand", () => {
		const t = generatePreset(55);
		expect(parseOklch(t.dark.brandMain).l).toBeGreaterThan(parseOklch(t.brandMain).l);
	});

	it("wraps hue modulo 360 and clamps chroma/lightness", () => {
		const t = generatePreset(415, 9, 7);
		const { l, c, h } = parseOklch(t.brandMain);
		expect(h).toBe(55);
		expect(c).toBe(1);
		expect(l).toBe(1);
	});

	it.each([
		["amber", 55, 0.21, 0.54],
		["ocean", 260, 0.22, 0.5],
		["crimson", 26, 0.23, 0.44],
		["violet", 295, 0.2, 0.5],
		["yellow-ish", 100, 0.18, 0.8],
	])("%s: brand fill reaches WCAG AA against its contrast text in both modes", (_n, h, c, l) => {
		const t = generatePreset(h, c, l);
		expect(contrast(t.brandFill, t.brandContrast)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(t.brandFillHover, t.brandContrast)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(t.dark.brandFill, t.dark.brandContrast)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(t.dark.brandFillHover, t.dark.brandContrast)).toBeGreaterThanOrEqual(4.5);
	});

	it("text is readable on surfaces in light and dark", () => {
		const t = generatePreset(55);
		expect(contrast(t.surfaceBase, t.textPrimary)).toBeGreaterThan(7);
		expect(contrast(t.dark.surfaceBase, t.dark.textPrimary)).toBeGreaterThan(7);
	});
});

describe("tokensToCSS", () => {
	const tokens: PresetTokens = generatePreset(260, 0.22, 0.5);

	it("anonymous output targets :root and .dark", () => {
		const css = tokensToCSS(tokens, null);
		expect(css).toContain(":root {");
		expect(css).toContain(".dark {");
		expect(css).toContain(`--ca-brand-main: ${tokens.brandMain};`);
		expect(css).toContain(`--ca-brand-main: ${tokens.dark.brandMain};`);
	});

	it("named output scopes by data-preset", () => {
		const css = tokensToCSS(tokens, "ocean");
		expect(css).toContain('[data-preset="ocean"] {');
		expect(css).toContain('.dark[data-preset="ocean"] {');
	});

	it("custom selectors win over name", () => {
		const css = tokensToCSS(tokens, "ocean", ".x", ".dark .x");
		expect(css.startsWith(".x {")).toBe(true);
		expect(css).toContain(".dark .x {");
		expect(css).not.toContain("data-preset");
	});

	it("dark block re-declares the neutral dark tokens so light values never cascade in", () => {
		const dark = tokensToCSS(tokens, "ocean").split('.dark[data-preset="ocean"] {')[1];
		for (const v of [
			"--ca-outline-subtle",
			"--ca-outline-default",
			"--ca-outline-strong",
			"--ca-glass-tint-ultra-thin",
			"--ca-glass-tint-thin",
			"--ca-glass-tint",
			"--ca-glass-tint-thick",
			"--ca-glass-tint-chrome",
			"--ca-glass-tint-solid",
			"--ca-glass-border",
			"--ca-glass-shadow",
			"--ca-scrim-color",
		]) {
			expect(dark, v).toContain(`${v}:`);
		}
	});

	it("never emits an `undefined` token", () => {
		expect(tokensToCSS(tokens, null)).not.toMatch(/undefined|NaN/);
	});
});

describe("theme-editor", () => {
	const cfg = (over: Partial<ThemeConfig> = {}): ThemeConfig => ({ ...DEFAULT_CONFIG, ...over });

	it("editorTokensToCSS includes palette + structural tokens", () => {
		const css = editorTokensToCSS(cfg());
		expect(css).toContain("Generated by Theme Editor");
		expect(css).toContain("--ca-brand-main:");
		expect(css).toContain("--ca-shadow-xl:");
		expect(css).not.toMatch(/undefined|NaN/);
	});

	it("glass surface style emits no surface override", () => {
		expect(editorTokensToCSS(cfg({ surfaceStyle: "glass" }))).not.toContain("Surface style:");
	});

	it("solid removes blur and flattens overlays", () => {
		const css = editorTokensToCSS(cfg({ surfaceStyle: "solid" }));
		expect(css).toContain("Surface style: solid");
		expect(css).toContain("--ca-blur-regular:    none;");
		expect(css).toContain("--ca-overlay-bg:   var(--ca-surface-overlay);");
	});

	it("frosted keeps a blur but with saturation", () => {
		const css = editorTokensToCSS(cfg({ surfaceStyle: "frosted" }));
		expect(css).toContain("blur(12px) saturate(165%)");
		expect(css).not.toContain("--ca-overlay-bg:   var(--ca-surface-overlay);");
	});

	it("flat drops shadows to outlines", () => {
		const css = editorTokensToCSS(cfg({ surfaceStyle: "flat" }));
		expect(css).toContain("--ca-shadow-xs: none;");
		expect(css).toContain("--ca-shadow-md: 0 0 0 1px var(--ca-outline-subtle);");
	});

	it("radiusBase scales radii proportionally", () => {
		const base = editorTokensToCSS(cfg({ radiusBase: 10 }));
		const big = editorTokensToCSS(cfg({ radiusBase: 20 }));
		expect(base).toContain("--ca-radius-md:");
		expect(big).not.toBe(base);
		const md = (s: string) => Number(s.match(/--ca-radius-md:\s*(\d+)px/)?.[1]);
		expect(md(big)).toBe(md(base) * 2);
	});

	it("editorPreviewCSS is scoped to .te__preview-body and never touches :root", () => {
		const css = editorPreviewCSS(cfg({ surfaceStyle: "solid" }));
		expect(css).toContain(".te__preview-body {");
		expect(css).toContain(".dark .te__preview-body {");
		expect(css).not.toMatch(/(^|\n):root\s*\{/);
		expect(css).not.toMatch(/(^|\n)\.dark\s*\{/);
	});
});
