import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const src = (p: string) => readFileSync(new URL(`../src/lib/${p}`, import.meta.url), "utf8");

/** Body of the first rule whose selector is exactly `selector`. */
const rule = (css: string, selector: string) => {
	const i = css.indexOf(`${selector} {`);
	if (i < 0) return "";
	return css.slice(i, css.indexOf("}", i));
};

describe("--ca-scrim-blur", () => {
	it("is what the modal scrim blurs with", () => {
		const backdrop = rule(src("styles/surface.css"), "dialog.ca-overlay::backdrop");
		expect(backdrop).toMatch(/(?<!-webkit-)backdrop-filter:\s*var\(--ca-scrim-blur\)/);
		expect(backdrop).toMatch(/-webkit-backdrop-filter:\s*var\(--ca-scrim-blur\)/);
		// dialog.css only darkens the scrim: the blur is declared once, in surface.css
		expect(src("components/Dialog/dialog.css")).not.toMatch(/backdrop-filter\s*:/);
	});

	it("is not overridden by a hardcoded blur on the command palette scrim", () => {
		const palette = src("components/CommandPalette/CommandPalette.svelte");
		expect(palette).not.toMatch(/::backdrop\)?\s*\{[^}]*backdrop-filter/);
	});

	it("defaults to the blur the scrim has always had, in CSS and in the token mirror", () => {
		expect(src("styles/tokens.css")).toMatch(/--ca-scrim-blur:\s*blur\(4px\) saturate\(180%\);/);
		expect(src("tokens/materials.ts")).not.toContain('"--ca-scrim-blur": "none"');
	});
});
