import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const src = (p: string) => readFileSync(new URL(`../src/lib/${p}`, import.meta.url), "utf8");

describe("tooltip blur token", () => {
	it("the tooltip blurs with --ca-tooltip-blur, not the shared ultra-thin tier", () => {
		const tooltip = src("components/Tooltip/Tooltip.svelte");
		const rule = tooltip.slice(tooltip.indexOf(":global(.ca-tooltip-content) {"));
		const body = rule.slice(0, rule.indexOf("}"));
		expect(body).toMatch(/-webkit-backdrop-filter:\s*var\(--ca-tooltip-blur\)/);
		expect(body).toMatch(/(?<!-webkit-)backdrop-filter:\s*var\(--ca-tooltip-blur\)/);
	});

	it("--ca-tooltip-blur defaults to the ultra-thin tier, so the look is unchanged", () => {
		expect(src("styles/materials.css")).toMatch(
			/--ca-tooltip-blur:\s*var\(--ca-blur-ultra-thin\);/
		);
	});
});
