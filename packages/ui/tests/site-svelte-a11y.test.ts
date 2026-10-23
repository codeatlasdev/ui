import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "svelte/compiler";

// The site build turns every `a11y_*` Svelte warning into an error (site/svelte.config.js onwarn),
// but `astro check` does not, so a demo with an a11y warning passed `validate` and then broke the
// build on main (#438, StatusTokens `<canvas role="img">`). Compile every site .svelte here with the
// same rule, so the same warning fails `validate` instead.
const SITE = new URL("../../../site/src/", import.meta.url).pathname;

function svelteFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		return e.isDirectory() ? svelteFiles(p) : e.name.endsWith(".svelte") ? [p] : [];
	});
}

describe("site .svelte files compile without a11y warnings (#438)", () => {
	it("no demo, template or component raises an a11y_* warning", () => {
		const found: string[] = [];
		for (const file of svelteFiles(SITE)) {
			const { warnings } = compile(readFileSync(file, "utf8"), {
				filename: file,
				generate: "client",
				experimental: { async: true },
			});
			for (const w of warnings)
				if (w.code.startsWith("a11y_"))
					found.push(`${file.slice(SITE.length)}:${w.start?.line} ${w.code}`);
		}
		expect(found).toEqual([]);
	});
});
