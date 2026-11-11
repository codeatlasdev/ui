import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { defineTheme, STYLES, themeCSS } from "../src/lib/theme/define.js";
import { DESIGN_STYLES, designStyle, mergeTheme } from "../src/lib/theme/styles.js";
import { themeScript } from "../src/lib/theme-script.js";

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
					displayTracking: "-0.055em",
					displayLeading: 0.84,
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
			"--ca-display-tracking: -0.055em;",
			"--ca-display-leading: 0.84;",
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

	it("components.button.<size>.gap emits --ca-btn-<size>-gap (#697)", () => {
		const css = themeCSS(
			defineTheme({ components: { button: { gap: "8px", sm: { gap: "6px" } } } })
		);
		expect(css).toContain("--ca-btn-gap: 8px;");
		expect(css).toContain("--ca-btn-sm-gap: 6px;");
	});

	it("components.emptyState emits the icon, title, description and actions tokens (#707)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					emptyState: {
						iconBg: "var(--ca-field-bg)",
						iconBorder: "1px solid var(--ca-outline-subtle)",
						iconRadius: "12px",
						titleGap: "4px",
						titleLeading: "1.3",
						titleTracking: "-0.01em",
						descriptionSize: "14px",
						descriptionLeading: "1.5",
						descriptionMaxWidth: "none",
						actionsMargin: "8px",
					},
				},
			})
		);
		for (const decl of [
			"--ca-empty-icon-bg: var(--ca-field-bg);",
			"--ca-empty-icon-border: 1px solid var(--ca-outline-subtle);",
			"--ca-empty-icon-radius: 12px;",
			"--ca-empty-title-gap: 4px;",
			"--ca-empty-title-leading: 1.3;",
			"--ca-empty-title-tracking: -0.01em;",
			"--ca-empty-description-size: 14px;",
			"--ca-empty-description-leading: 1.5;",
			"--ca-empty-description-max-width: none;",
			"--ca-empty-actions-margin: 8px;",
		])
			expect(css).toContain(decl);
	});

	it("components.popover emits the --ca-popover-* tokens (#698)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					popover: {
						padding: "var(--ca-space-2)",
						radius: "6px",
						maxWidth: "280px",
						bg: "var(--ca-surface-raised)",
					},
				},
			})
		);
		for (const decl of [
			"--ca-popover-padding: var(--ca-space-2);",
			"--ca-popover-radius: 6px;",
			"--ca-popover-max-width: 280px;",
			"--ca-popover-bg: var(--ca-surface-raised);",
		])
			expect(css).toContain(decl);
		expect(themeCSS(defineTheme({ components: { popover: {} } }))).toBe("");
	});

	it("components.button/iconButton/kbd emit the --ca-btn-*, --ca-icon-btn-* and --ca-kbd-* tokens (#373)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					button: {
						weight: 600,
						tracking: "-0.006em",
						leading: 1.25,
						gap: "var(--ca-space-2)",
						ghostBorderWidth: "0px",
						disabledBg: "var(--ca-brand-fill)",
						sm: { paddingX: "var(--ca-space-3)", fontSize: "0.8125rem", weight: 500 },
						lg: { fontSize: "var(--ca-font-size-button)", weight: 400, tracking: "-0.006em" },
					},
					iconButton: { weight: 500, size: { sm: "36px" } },
					kbd: { size: "var(--ca-space-5)", fontSize: "0.75rem", leading: 1 },
				},
			})
		);
		for (const decl of [
			"--ca-btn-font-weight: 600;",
			"--ca-btn-letter-spacing: -0.006em;",
			"--ca-btn-line-height: 1.25;",
			"--ca-btn-gap: var(--ca-space-2);",
			"--ca-btn-ghost-border-width: 0px;",
			"--ca-btn-disabled-bg: var(--ca-brand-fill);",
			"--ca-btn-sm-padding-x: var(--ca-space-3);",
			"--ca-btn-sm-font-size: 0.8125rem;",
			"--ca-btn-sm-font-weight: 500;",
			"--ca-btn-lg-font-size: var(--ca-font-size-button);",
			"--ca-btn-lg-font-weight: 400;",
			"--ca-btn-lg-letter-spacing: -0.006em;",
			"--ca-icon-btn-font-weight: 500;",
			"--ca-icon-btn-size-sm: 36px;",
			"--ca-kbd-size: var(--ca-space-5);",
			"--ca-kbd-font-size: 0.75rem;",
			"--ca-kbd-line-height: 1;",
		])
			expect(css).toContain(decl);
		expect(css).not.toContain("--ca-btn-md-");
		expect(themeCSS(defineTheme({ components: {} }))).toBe("");
	});

	it("components.avatar/field/card/segmented/emptyState emit their tokens (#376)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					avatar: {
						fallbackBg: "var(--ca-surface-overlay)",
						fallbackColor: "var(--ca-text-secondary)",
						fallbackSize: "0.75rem",
						fallbackWeight: 500,
						size: { sm: { fallbackSize: "10px" } },
					},
					field: { gap: "var(--ca-space-1-5)", labelLeading: 1.2 },
					textField: { gap: "2px", labelLeading: 1.1 },
					textArea: { gap: "3px", labelLeading: 1.3, minHeight: "var(--ca-space-16)" },
					card: {
						bg: "var(--ca-surface-raised)",
						radius: "var(--ca-radius-md)",
						border: "1px solid var(--ca-outline-subtle)",
						shadow: "none",
					},
					segmented: {
						itemPaddingX: "var(--ca-space-3)",
						itemFontSize: "0.8125rem",
						itemLeading: 1,
						sm: { itemPaddingX: "8px" },
					},
					emptyState: { padding: "0", titleSize: "1rem", titleWeight: 500 },
				},
			})
		);
		for (const decl of [
			"--ca-avatar-fallback-bg: var(--ca-surface-overlay);",
			"--ca-avatar-fallback-color: var(--ca-text-secondary);",
			"--ca-avatar-fallback-size: 0.75rem;",
			"--ca-avatar-fallback-weight: 500;",
			"--ca-avatar-sm-fallback-size: 10px;",
			"--ca-field-gap: var(--ca-space-1-5);",
			"--ca-field-label-leading: 1.2;",
			"--ca-tf-gap: 2px;",
			"--ca-tf-label-line-height: 1.1;",
			"--ca-ta-gap: 3px;",
			"--ca-ta-label-line-height: 1.3;",
			"--ca-ta-min-height: var(--ca-space-16);",
			"--ca-card-bg: var(--ca-surface-raised);",
			"--ca-card-radius: var(--ca-radius-md);",
			"--ca-card-border: 1px solid var(--ca-outline-subtle);",
			"--ca-card-shadow: none;",
			"--ca-seg-item-padding-x: var(--ca-space-3);",
			"--ca-seg-item-font-size: 0.8125rem;",
			"--ca-seg-item-line-height: 1;",
			"--ca-seg-sm-item-padding-x: 8px;",
			"--ca-empty-padding: 0;",
			"--ca-empty-title-size: 1rem;",
			"--ca-empty-title-weight: 500;",
		])
			expect(css).toContain(decl);
	});

	it("components.field/select/combobox/numberField/textField/progress/iconButton emit the field token family (#709 #705 #713 #702 #717)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					field: {
						gap: "8px",
						labelLeading: 1.25,
						labelTracking: "0",
						hintLeading: 1.4,
						hintTracking: "0.005em",
						letterSpacing: "-0.006em",
						lineHeight: 1.5,
					},
					select: { gap: "6px", labelLeading: 1.1 },
					combobox: { gap: "5px" },
					numberField: { gap: "7px", letterSpacing: "normal" },
					textField: {
						revealSize: "44px",
						revealRadius: "var(--ca-radius-control)",
						revealIconSize: "20px",
						errorRing: "none",
					},
					progress: { track: "var(--ca-surface-overlay)", bar: "var(--ca-brand-fill)" },
					iconButton: { tracking: "normal" },
				},
			})
		);
		for (const decl of [
			"--ca-field-gap: 8px;",
			"--ca-field-label-leading: 1.25;",
			"--ca-field-label-tracking: 0;",
			"--ca-field-hint-leading: 1.4;",
			"--ca-field-hint-tracking: 0.005em;",
			"--ca-input-letter-spacing: -0.006em;",
			"--ca-input-line-height: 1.5;",
			"--ca-sel-gap: 6px;",
			"--ca-sel-label-line-height: 1.1;",
			"--ca-cb-gap: 5px;",
			"--ca-nf-gap: 7px;",
			"--ca-nf-letter-spacing: normal;",
			"--ca-tf-reveal-size: 44px;",
			"--ca-tf-reveal-radius: var(--ca-radius-control);",
			"--ca-tf-reveal-icon-size: 20px;",
			"--ca-tf-error-ring: none;",
			"--ca-progress-track: var(--ca-surface-overlay);",
			"--ca-progress-bar: var(--ca-brand-fill);",
			"--ca-icon-btn-letter-spacing: normal;",
		])
			expect(css).toContain(decl);
	});

	it("components.passwordStrength emits the --ca-pwstrength-* tokens (#703)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					passwordStrength: {
						gap: "12px",
						emptyBg: "var(--ca-surface-overlay)",
						labelLeading: "1.4",
						labelTracking: "0.01em",
					},
				},
			})
		);
		for (const decl of [
			"--ca-pwstrength-gap: 12px;",
			"--ca-pwstrength-empty-bg: var(--ca-surface-overlay);",
			"--ca-pwstrength-label-leading: 1.4;",
			"--ca-pwstrength-label-tracking: 0.01em;",
		])
			expect(css).toContain(decl);
		expect(themeCSS(defineTheme({ components: { passwordStrength: {} } }))).toBe("");
	});

	it("components.field emits height, radius, border width and the variant (#763)", () => {
		const css = themeCSS(
			defineTheme({
				components: {
					field: { height: "44px", radius: "var(--ca-radius-lg)", borderWidth: "2px" },
				},
			})
		);
		for (const decl of [
			"--ca-control-height: 44px;",
			"--ca-radius-control: var(--ca-radius-lg);",
			"--ca-field-border-width: 2px;",
		])
			expect(css).toContain(decl);
		expect(themeCSS(defineTheme({ components: { field: { variant: "outlined" } } }))).toBe("");
	});

	it("a non-outlined field variant puts data-ca-field on <html> through the init script (#763)", () => {
		const underline = themeScript({ components: { field: { variant: "underline" } } });
		expect(underline).toContain("data-ca-field");
		expect(underline).toContain("underline");
		expect(themeScript({})).not.toContain("data-ca-field");
		expect(themeScript({ components: { field: { variant: "outlined" } } })).not.toContain(
			"data-ca-field"
		);
	});

	it("the variant blocks exist in materials.css with the documented tokens (#763)", () => {
		const css = readFileSync(new URL("../src/lib/styles/materials.css", import.meta.url), "utf8");
		const block = (v: string) =>
			css.match(new RegExp(`\\[data-ca-field="${v}"\\]\\s*\\{([^}]*)\\}`))?.[1] ?? "";
		expect(block("filled")).toContain("--ca-field-border-color: transparent");
		expect(block("underline")).toContain("--ca-field-bg:           transparent");
		expect(block("underline")).toContain("inset 0 calc(-1 *");
		expect(block("underline")).toContain("--ca-field-radius:       0");
	});

	it("mergeTheme merges components per block", () => {
		const merged = mergeTheme(
			{ components: { button: { weight: 600, sm: { paddingX: "8px" } } } },
			{ components: { button: { gap: "4px", sm: { fontSize: "13px" } }, kbd: { size: "20px" } } }
		);
		expect(merged.components?.button).toEqual({
			weight: 600,
			gap: "4px",
			sm: { paddingX: "8px", fontSize: "13px" },
		});
		expect(merged.components?.kbd).toEqual({ size: "20px" });
	});

	it("motion.enter: none zeroes entrances only, motion.scale keeps driving color transitions", () => {
		const css = themeCSS(defineTheme({ motion: { enter: "none" } }));
		expect(css).toContain("--ca-enter-scale: 0;");
		expect(css).not.toContain("--ca-motion-scale");
		expect(themeCSS(defineTheme({ motion: {} }))).not.toContain("--ca-enter-scale");
		expect(themeCSS(defineTheme({ motion: { enter: "default" } }))).not.toContain(
			"--ca-enter-scale"
		);
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
