import { describe, expect, it } from "bun:test";
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
