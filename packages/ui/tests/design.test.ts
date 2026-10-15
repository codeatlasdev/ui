import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { defineTheme, STYLES, themeCSS } from "../src/lib/theme/define.js";
import { DESIGN_STYLES, designStyle, mergeTheme } from "../src/lib/theme/styles.js";

describe("design knobs → tokens", () => {
	it("defaults emit nothing", () => {
		expect(themeCSS(defineTheme())).toBe("");
	});

	it("maps every knob to its custom property", () => {
		const css = themeCSS(
			defineTheme({
				radius: 0,
				controlRadius: "pill",
				density: "airy",
				border: { width: 3, strong: 4 },
				typography: {
					scale: 1.1,
					weights: { heading: 900 },
					headingCase: "uppercase",
					headingTracking: "0.02em",
					lineHeight: 1.7,
					measure: "60ch",
				},
				motion: { scale: 0, easing: "steps" },
				iconStroke: 1.5,
				noise: 0.5,
			})
		);
		for (const decl of [
			"--ca-radius-scale: 0;",
			"--ca-radius-control: var(--ca-radius-pill);",
			"--ca-density: 1.25;",
			"--ca-border-width: 3px;",
			"--ca-border-width-strong: 4px;",
			"--ca-font-scale: 1.1;",
			"--ca-font-weight-heading: 900;",
			"--ca-heading-case: uppercase;",
			"--ca-heading-tracking: 0.02em;",
			"--ca-line-height-body: 1.7;",
			"--ca-measure: 60ch;",
			"--ca-motion-scale: 0;",
			"--ca-ease-standard: steps(4, end);",
			"--ca-icon-stroke: 1.5;",
			// noise is clamped to a readable maximum
			"--ca-noise-opacity: 0.12;",
		])
			expect(css).toContain(decl);
	});

	it("hard elevation draws offset shadows with no blur from the border color", () => {
		const css = themeCSS(defineTheme({ elevation: "hard" }));
		expect(css).toContain("--ca-shadow-md: 6px 6px 0 0 var(--ca-border-color);");
		expect(css).toContain("--ca-mat-regular-shadow: 6px 6px 0 0 var(--ca-border-color);");
	});

	it("no elevation removes every shadow", () => {
		const css = themeCSS(defineTheme({ elevation: "none" }));
		expect(css).toContain("--ca-shadow-xl: none;");
		expect(css).toContain("--ca-mat-thick-shadow: 0 0 #0000;");
	});

	it("paper: mesh keeps the glass gradients, plain switches them off there, flat patterns use outline ink", () => {
		expect(themeCSS(defineTheme({ paper: "mesh", defaultStyle: "glass" }))).toBe("");
		// plain is already the stylesheet default under solid; under glass it must say so
		expect(themeCSS(defineTheme({ paper: "plain" }))).toBe("");
		expect(themeCSS(defineTheme({ paper: "plain", defaultStyle: "glass" }))).toContain(
			"--ca-page-mesh: none;"
		);
		const grid = themeCSS(defineTheme({ paper: "grid" }));
		expect(grid).toMatch(/--ca-page-mesh: linear-gradient\(var\(--ca-outline-subtle\)/);
	});
});

describe("preset role colors", () => {
	const preset = (colors: object) =>
		themeCSS(
			defineTheme({ presets: [{ id: "tn", color: "#7aa2f7", colors }], defaultPreset: "tn" })
		);
	const block = (css: string, scheme: "light" | "dark") =>
		css.split("\n}")[scheme === "light" ? 0 : 1] ?? "";

	it("maps roles to tokens in their scheme only", () => {
		const css = preset({ dark: { background: "#1a1b26", text: "#c0caf5", error: "#f7768e" } });
		const dark = block(css, "dark");
		expect(dark).toContain("--ca-surface-base: #1a1b26;");
		expect(dark).toContain("--ca-text-primary: #c0caf5;");
		expect(dark).toContain("--ca-semantic-error: #f7768e;");
		expect(block(css, "light")).not.toContain("#1a1b26");
	});

	it("a per-scheme brand regenerates that scheme's brand ramp", () => {
		const base = block(preset({}), "light");
		const light = block(preset({ light: { brand: "#34548a" } }), "light");
		const main = (s: string) => s.match(/--ca-brand-main: ([^;]+);/)?.[1];
		expect(main(light)).not.toBe(main(base));
		expect(light).toContain("--ca-chart-brand: #34548a;");
	});

	it("the background role drives the browser theme-color", () => {
		const t = defineTheme({
			presets: [{ id: "tn", color: "#7aa2f7", colors: { dark: { background: "#1a1b26" } } }],
			defaultPreset: "tn",
		});
		expect(t.themeColor.tn.dark).toBe("#1a1b26");
	});

	it("rejects a non-hex brand", () => {
		expect(() => preset({ light: { brand: "blue" } })).toThrow(
			/colors\.light\.brand must be #rrggbb/
		);
	});
});

describe("design styles", () => {
	it.each(Object.values(DESIGN_STYLES))("$id compiles to a valid theme", (style) => {
		const t = defineTheme(style.theme);
		expect(STYLES).toContain(t.defaultStyle);
		expect(() => themeCSS(t)).not.toThrow();
		expect(style.taxonomy.every((id) => /^DS\d{3}$/.test(id))).toBe(true);
	});

	it("designStyle layers overrides on the recipe, merging nested groups", () => {
		const t = designStyle("brutalism", {
			presets: [{ id: "acme", color: "#ff5c00" }],
			defaultPreset: "acme",
			typography: { weights: { heading: 800 } },
		});
		expect(t.radius).toBe(0);
		expect(t.defaultPreset).toBe("acme");
		expect(t.typography?.weights?.heading).toBe(800);
		// untouched recipe fields survive the merge
		expect(t.typography?.headingCase).toBe("uppercase");
		expect(t.typography?.weights?.bold).toBe(800);
	});

	it("mergeTheme lets the right side win", () => {
		expect(mergeTheme({ radius: 0, density: "compact" }, { radius: 2 })).toMatchObject({
			radius: 2,
			density: "compact",
		});
	});
});

// The package default is a sober, solid UI; the liquid-glass look is an opt-in recipe (#111).
describe("default theme", () => {
	const LIB = new URL("../src/lib/", import.meta.url);
	const css = (f: string) =>
		readFileSync(new URL(`styles/${f}`, LIB), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
	/** Declarations of the first rule whose selector list contains `selector` exactly. */
	const rule = (source: string, selector: string) => {
		for (const m of source.matchAll(/([^{}@]+)\{([^{}]*)\}/g))
			if (m[1].split(",").some((s) => s.trim() === selector)) return m[2].replace(/:[ \t]+/g, ": ");
		throw new Error(`rule ${selector} missing`);
	};

	it("resolves to solid, plain paper, 8px controls, thin icons and 600 headings", () => {
		const t = defineTheme();
		expect(t.defaultStyle).toBe("solid");
		expect(t.paper).toBe("plain");
		expect(t.radius).toBe(0.8);
		expect(t.iconStroke).toBe(1.75);
		expect(t.typography.weights?.heading).toBe(600);
	});

	it("the stylesheet defaults match the resolved defaults, so a default theme emits nothing", () => {
		const tokens = css("tokens.css");
		expect(rule(tokens, ":root")).toContain("--ca-radius-scale: 0.8;");
		expect(rule(tokens, ":root")).toContain("--ca-icon-stroke: 1.75;");
		expect(rule(tokens, ":root")).toContain("--ca-font-weight-heading: 600;");
		expect(rule(css("base.css"), "html")).toContain("--ca-page-mesh: none;");
	});

	it("solid draws no glow and no white rim", () => {
		const solid = rule(css("materials.css"), '[data-style="solid"]');
		expect(solid).toContain("--ca-glow-primary: transparent;");
		expect(solid).toContain("--ca-glow-primary-strong: transparent;");
		expect(solid).toMatch(
			/--ca-mat-edge:\s*inset 0 0 0 var\(--ca-border-width\) var\(--ca-outline-subtle\)/
		);
	});

	it("shadows are neutral: no warm hue in light, soft neutral black in dark", () => {
		const tokens = css("tokens.css");
		for (const sel of [':root,\n[data-theme-scope="light"]', '.dark,\n[data-theme-scope="dark"]']) {
			const block = tokens.slice(tokens.indexOf(sel));
			const shadows = block.slice(0, block.indexOf("}")).match(/--ca-shadow-[a-z]+:[^;]+;/g) ?? [];
			expect(shadows).toHaveLength(5);
			for (const s of shadows) expect(s).toContain("oklch(0 0 0 /");
		}
	});

	it("liquid restores the former default: glass, mesh, round corners, bold headings", () => {
		const t = defineTheme(designStyle("liquid"));
		expect(t.defaultStyle).toBe("glass");
		expect(t.paper).toBe("mesh");
		expect(t.radius).toBe(1);
		expect(t.iconStroke).toBe(2);
		expect(t.typography.weights?.heading).toBe(700);
		const out = themeCSS(t);
		expect(out).toContain("--ca-radius-scale: 1;");
		expect(out).toContain("--ca-glass-shadow: 0 4px 24px");
		expect(out).toContain("--ca-shadow-md: 0 4px 16px oklch(0.25 0.008 70 / 0.12);");
	});

	it("a default theme and a liquid theme differ only by the recipe", () => {
		expect(themeCSS(defineTheme())).toBe("");
		expect(themeCSS(defineTheme(designStyle("liquid")))).not.toBe("");
	});
});
