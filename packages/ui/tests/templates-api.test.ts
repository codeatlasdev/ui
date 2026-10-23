import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #506: templates are what AIs copy. A tile row that a public component already lays out
 * (`KpiGrid`, `Grid columns`) must not be rebuilt with a `:global(...)` rule on the Grid.
 */
const TEMPLATES = join(import.meta.dir, "../../../site/src/templates");

describe("templates use the public layout API", () => {
	for (const dir of ["app", "admin"]) {
		it(`${dir}/Billing has no :global grid rule`, () => {
			const src = readFileSync(join(TEMPLATES, dir, "Billing.svelte"), "utf8");
			expect(src).not.toMatch(/:global\(\s*\.grid-/);
			expect(src).not.toContain("grid-auto-180");
		});
	}
});
