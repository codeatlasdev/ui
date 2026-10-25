import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { INPUTS } from "../scripts/build-inputs";

// The package build skips itself when the bytes of its inputs are the ones the last finished build had. A release is
// never built from that skip, and INPUTS must cover everything the build steps import: a directory missing from it
// leaves a stale `dist` current after an edit there (an atlas data edit, a changelog parser change), every test green.
const ROOT = join(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("release builds cold", () => {
	it("the release script and the release gate both set CA_BUILD_COLD", () => {
		expect(read("scripts/release.js")).toContain('CA_BUILD_COLD = "1"');
		expect(read("scripts/test-full.ts")).toContain('CA_BUILD_COLD: "1"');
	});
});

/** Every local file the build entry scripts import, transitively (static `from` and dynamic `import()`). */
function importClosure(entries: string[]): string[] {
	const seen = new Set<string>();
	const queue = entries.map((e) => join(ROOT, e));
	const resolveSpec = (from: string, spec: string) =>
		[
			resolve(dirname(from), spec),
			`${resolve(dirname(from), spec)}.ts`,
			join(resolve(dirname(from), spec), "index.ts"),
		].find((c) => existsSync(c) && statSync(c).isFile());
	for (let file = queue.pop(); file; file = queue.pop()) {
		if (seen.has(file)) continue;
		seen.add(file);
		for (const m of readFileSync(file, "utf8").matchAll(
			/(?:from|import\()\s*["'](\.[^"']+)["']/g
		)) {
			const target = resolveSpec(file, m[1]);
			if (target && !target.includes("node_modules")) queue.push(target);
		}
	}
	return [...seen].map((f) => relative(ROOT, f));
}

describe("build inputs", () => {
	it("cover every file the build steps import", () => {
		const closure = importClosure([
			"packages/ui/scripts/build-manifest.ts",
			"packages/ui/scripts/build-equivalents.ts",
			"packages/ui/scripts/build-bin.ts",
		]);
		expect(closure.length).toBeGreaterThan(20);
		const missing = closure.filter((f) => !INPUTS.some((i) => f === i || f.startsWith(`${i}/`)));
		expect(missing).toEqual([]);
	});
});
