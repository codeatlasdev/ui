import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * #650: `--ca-touch-target` (tokens.css) is the one definition of the minimum hit area, but 26 assertions
 * repeated `44` by hand, so changing the token would have left tests asserting the old size. A test that
 * checks a hit area reads the token (`touchTarget()` in tests/touch-target.ts, `touchTarget(page)` in
 * site/tests/touch-target.ts) instead of a literal.
 */
const ROOT = join(import.meta.dir, "../../..");
const TESTS = /(\.svelte\.test\.ts|\.spec\.ts|layout-audit\.ts)$/;

function* files(dir: string): Generator<string> {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			if (
				!["node_modules", "dist", "__screenshots__", "__traces__", ".svelte-kit"].includes(e.name)
			)
				yield* files(p);
		} else if (TESTS.test(e.name)) yield p;
	}
}

/** A hit-area size compared against a bare 44 (or the 43.5 tolerance the audit used). */
const LITERAL =
	/(toBeGreaterThanOrEqual|toBeGreaterThan|toBeLessThan)\(\s*(44|43\.5)\s*\)|<\s*43\.5|touch target < 44px/;

describe("hit-area tests read --ca-touch-target (#650)", () => {
	it("no test compares a size with a literal 44", () => {
		const hits: string[] = [];
		for (const root of ["packages/ui/src", "site/tests"])
			for (const f of files(join(ROOT, root)))
				readFileSync(f, "utf8")
					.split("\n")
					.forEach((l, i) => {
						if (LITERAL.test(l)) hits.push(`${relative(ROOT, f)}:${i + 1}`);
					});
		expect(hits).toEqual([]);
	});

	it("the token the tests read is 44px today", () => {
		const css = readFileSync(join(ROOT, "packages/ui/src/lib/styles/tokens.css"), "utf8");
		expect(css).toMatch(/--ca-touch-target:\s*44px;/);
	});
});
