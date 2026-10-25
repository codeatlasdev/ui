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

	// #568: a fixed `setTimeout` sleep in a component test costs wall time on every run and flakes under
	// load. Await a condition (`expect.poll`, `settled()`), or install a fake clock BEFORE render. A
	// sleep that is truly needed carries `real-time:` and the reason on the line above it.
	it("no component test sleeps on a real timer", () => {
		const root = join(import.meta.dir, "../src");
		const offenders: string[] = [];
		for (const file of new Bun.Glob("**/*.svelte.test.ts").scanSync(root)) {
			const lines = readFileSync(join(root, file), "utf8").split("\n");
			lines.forEach((line, i) => {
				if (
					/new Promise\(\(?\w*\)? => setTimeout\(/.test(line) &&
					!/real-time:/.test(lines[i - 1] ?? "")
				)
					offenders.push(`${file}:${i + 1}`);
			});
		}
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
