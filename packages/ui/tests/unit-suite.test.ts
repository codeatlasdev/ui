import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// `bun run validate` runs this suite everywhere, including the release job that installs no
// Playwright browsers (#331: the 4.4.0 release failed in Verify on a chromium.launch() here).
// Tests that need a real browser are named `*.e2e.ts` and run with `bun run test:browser`.
describe("unit suite", () => {
	it("no test file launches a browser", () => {
		const self = import.meta.file;
		const offenders = [...new Bun.Glob("*.test.ts").scanSync(import.meta.dir)].filter(
			(file) =>
				file !== self &&
				/from\s+["'](?:playwright|@playwright\/test)["']|\b(?:chromium|webkit|firefox)\.launch\(/.test(
					readFileSync(join(import.meta.dir, file), "utf8")
				)
		);
		expect(offenders).toEqual([]);
	});
});
