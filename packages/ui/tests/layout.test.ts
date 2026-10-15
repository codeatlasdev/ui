import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { layoutCSS } from "../scripts/build-layout.ts";
import { layoutAttrs } from "../src/lib/components/Layout/layout.ts";

describe("layoutAttrs", () => {
	it("maps token props to data-* attributes", () => {
		expect(
			layoutAttrs({ gap: "4", p: "2", px: "3", py: "1.5", align: "center", justify: "between" })
		).toEqual({
			"data-gap": "4",
			"data-p": "2",
			"data-px": "3",
			"data-py": "1.5",
			"data-align": "center",
			"data-justify": "between",
		});
	});

	it("accepts numbers as scale keys", () => {
		expect(layoutAttrs({ gap: 4, p: 0 })).toEqual({ "data-gap": "4", "data-p": "0" });
	});

	it("renders responsive objects as data-<bp>-<prop>, base without prefix", () => {
		expect(
			layoutAttrs({ gap: { base: "2", md: "4", xl: "8" }, columns: { base: 1, lg: 3 } })
		).toEqual({
			"data-gap": "2",
			"data-md-gap": "4",
			"data-xl-gap": "8",
			"data-columns": "1",
			"data-lg-columns": "3",
		});
	});

	it("wrap=true is data-wrap, false/undefined are omitted", () => {
		expect(layoutAttrs({ wrap: true })).toEqual({ "data-wrap": "true" });
		expect(layoutAttrs({ wrap: false })).toEqual({});
		expect(layoutAttrs({})).toEqual({});
	});

	it("never produces a style entry", () => {
		const attrs = layoutAttrs({ gap: "4", direction: "row", columns: 3 });
		expect(Object.keys(attrs).some((k) => k === "style")).toBe(false);
	});
});

describe("styles/layout.css", () => {
	const file = join(import.meta.dir, "../src/lib/styles/layout.css");
	const css = readFileSync(file, "utf8");

	it("is up to date with scripts/build-layout.ts (run: bun scripts/build-layout.ts)", () => {
		expect(css).toBe(layoutCSS());
	});

	it("styles every scale step of every spacing prop, base and responsive", () => {
		expect(css).toContain('[data-gap="4"]{gap:var(--ca-space-4)}');
		expect(css).toContain('[data-gap="0.5"]{gap:var(--ca-space-0-5)}');
		expect(css).toContain('[data-p="6"]{padding:var(--ca-space-6)}');
		expect(css).toContain('[data-px="2"]{padding-inline:var(--ca-space-2)}');
		expect(css).toContain("@media (min-width:900px){");
		expect(css).toContain('[data-md-gap="4"]{gap:var(--ca-space-4)}');
	});

	it("uses only the shared breakpoint scale", () => {
		const widths = [...css.matchAll(/min-width:(\d+)px/g)].map((m) => Number(m[1]));
		expect(widths.filter((w, i) => widths.indexOf(w) === i).sort((a, b) => a - b)).toEqual([
			600, 900, 1200, 1536,
		]);
	});
});
