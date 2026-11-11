import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BREAKPOINTS } from "../src/lib/components/Layout/layout.ts";

// #916: the scale in CSS, from the same source as the TypeScript constant.
describe("styles/breakpoints.css (#916)", () => {
	const css = readFileSync(join(import.meta.dir, "../src/lib/styles/breakpoints.css"), "utf8");
	it("declares one custom media per breakpoint, from layout.ts", () => {
		for (const [name, px] of Object.entries(BREAKPOINTS)) {
			expect(css).toContain(`@custom-media --ca-${name} (min-width: ${px}px);`);
			expect(css).toContain(`@custom-media --ca-below-${name} (max-width: ${px - 0.02}px);`);
		}
	});
});
