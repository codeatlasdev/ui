import { describe, expect, it } from "bun:test";
import { STYLE_PAGE_IDS } from "../../../site/src/data/styles/styles.ts";
import {
	AFTER,
	afterCSS,
	BEFORE,
	beforeCSS,
	scopeCSS,
} from "../../../site/src/lib/style-island.ts";
import { defineTheme, designDefaults, themeCSS } from "../src/lib/theme/define.ts";
import { designStyle } from "../src/lib/theme/styles.ts";

// A style page shows a recipe on a subtree while the site around it wears its own theme (sketchbook),
// so the recipe must never leak to :root and the "before" side must hold the package defaults.
describe("style island CSS (#583)", () => {
	it("never writes a recipe on :root or html: the page around it keeps its theme", () => {
		for (const id of STYLE_PAGE_IDS) {
			const css = afterCSS(id);
			expect(css).not.toMatch(/(^|\n):root[\s,{.]/);
			expect(css).not.toMatch(/(^|\n)html[\s,{.[]/);
			expect(css).not.toContain('[data-theme-scope="light"] {');
		}
	});

	it("starts from the package defaults, then the recipe, so nothing of the page leaks in", () => {
		const css = afterCSS("brutalism");
		const defaults = css.indexOf(`.${AFTER}{`);
		const recipe = css.indexOf(`.${AFTER} {`);
		expect(defaults).toBeGreaterThanOrEqual(0);
		expect(recipe).toBeGreaterThan(defaults);
		// Every default knob is reset, and the recipe's own value comes after it.
		for (const name of Object.keys(designDefaults())) expect(css).toContain(`${name}:`);
		expect(css.slice(recipe)).toContain("--ca-border-width: 3px;");
	});

	it("keeps the dark block of a recipe inside the island", () => {
		const css = afterCSS("glassmorphism");
		expect(css).toContain(`.${AFTER}[data-theme-scope="dark"] {`);
		expect(css).toContain("--ca-glass-rim: oklch(1 0 0 / 0.32);");
	});

	it("the before side is the package default and beats the recipe wrapped around it", () => {
		const css = beforeCSS();
		expect(css.startsWith(`.${AFTER} .${BEFORE}[data-theme-scope]{`)).toBe(true);
		for (const [name, value] of Object.entries(designDefaults()))
			expect(css).toContain(`${name}:${value};`);
		expect(css).toContain("--ca-page-mesh:none;");
	});

	it("scopeCSS rewrites exactly the two selectors themeCSS emits for the root", () => {
		const css = themeCSS(defineTheme(designStyle("glassmorphism")));
		const scoped = scopeCSS(css, "x");
		expect(scoped).not.toContain(":root");
		expect(scoped).toContain(".x {");
		expect(scoped).toContain('.x[data-theme-scope="dark"] {');
	});
});
