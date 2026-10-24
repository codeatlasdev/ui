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

	// #529: raw `mkdtempSync(join(tmpdir(), …))` left 51k directories in $TMPDIR. Use `tmpDir()` and
	// `afterAll(cleanTmp)` from ./tmp, or remove the directory yourself with `rmSync`.
	it("every test file that makes a temp directory removes it", () => {
		const offenders = [...new Bun.Glob("*.{test,e2e}.ts").scanSync(import.meta.dir)].filter(
			(file) => {
				const src = readFileSync(join(import.meta.dir, file), "utf8");
				if (file === import.meta.file || file === "tmp.ts") return false;
				if (/\btmpDir\(/.test(src)) return !/\bafterAll\(cleanTmp\)/.test(src);
				return /\bmkdtemp(?:Sync)?\(/.test(src) && !/\brmSync\(/.test(src);
			}
		);
		expect(offenders).toEqual([]);
	});
});
