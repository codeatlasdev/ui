import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// theme.ts is loaded by vite.config / astro.config in Node. The package root re-exports `.svelte`
// files that Node cannot evaluate, so the type must come from `/vite` (SvelteKit, plain Vite) or
// `/astro`. A root import in a guide sends agents and users down the broken path (#153).
const ROOT = join(import.meta.dir, "../../..");
const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : /\.(mdx?|md)$/.test(p) ? [p] : [];
	});
const files = [
	join(ROOT, "AGENTS.md"),
	...walk(join(ROOT, ".agents/skills")).filter((f) => !f.endsWith("API.md")),
	...walk(join(ROOT, "site/src/content/docs")),
];

describe("ThemeOptions import path in docs and skills (#153)", () => {
	it("never imports ThemeOptions from the package root", () => {
		const bad = files.filter((f) =>
			/import\s+(?:type\s+)?\{[^}]*\bThemeOptions\b[^}]*\}\s+from\s+["']@codeatlasdev\/ui["']/.test(
				readFileSync(f, "utf8")
			)
		);
		expect(bad.map((f) => f.slice(ROOT.length + 1))).toEqual([]);
	});
});
