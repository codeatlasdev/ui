import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const src = (p: string) => readFileSync(new URL(`../src/lib/${p}`, import.meta.url), "utf8");

describe("tooltip blur token", () => {
	it("the tooltip blurs with --ca-tooltip-blur, not the shared ultra-thin tier", () => {
		expect(src("components/Tooltip/Tooltip.svelte")).toMatch(/blur="tooltip"/);
		const surface = src("styles/surface.css");
		const body = surface.slice(surface.indexOf('[data-ca-blur="tooltip"]'));
		expect(body.slice(0, body.indexOf("}"))).toMatch(/--ca-blur-role:\s*var\(--ca-tooltip-blur\)/);
	});

	it("--ca-tooltip-blur defaults to the ultra-thin tier, so the look is unchanged", () => {
		expect(src("styles/materials.css")).toMatch(
			/--ca-tooltip-blur:\s*var\(--ca-blur-ultra-thin\);/
		);
	});
});
