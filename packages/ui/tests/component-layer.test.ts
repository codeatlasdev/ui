import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Component CSS lives in `@layer ca.components` (declared last) so unlayered app CSS wins with a
// single class. Each sheet also repeats the full layer order: a bundler may emit a component
// chunk BEFORE core.css, and the first mention of a layer name fixes its priority, which would
// otherwise rank ca.components lowest. Lightning CSS (Vite 8) hoists the order correctly only when
// the first sheet carries it.
const lib = new URL("../src/lib/", import.meta.url).pathname;
const order = readFileSync(join(lib, "styles/core.css"), "utf8").match(/^@layer [^;]+;/m)?.[0];

function* sheets(dir: string): Generator<string> {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* sheets(path);
		else if (name.endsWith(".svelte") && !name.endsWith(".test.svelte")) yield path;
		else if (name.endsWith(".css") && path.includes("/components/")) yield path;
	}
}

describe("component stylesheets are layered", () => {
	it("core.css declares ca.components last", () => {
		expect(order).toMatch(/, ca\.components;$/);
	});

	for (const file of sheets(join(lib, "components"))) {
		const src = readFileSync(file, "utf8");
		const css = file.endsWith(".css") ? src : src.match(/<style>\n([\s\S]*?)\n<\/style>/)?.[1];
		if (css === undefined) continue;
		it(file.slice(lib.length), () => {
			expect(css).toContain(order as string);
			expect(css).toContain("@layer ca.components {");
			// Nothing may sit outside the layer except the order statement and comments.
			const outside = css
				.replace(/\/\*[\s\S]*?\*\//g, "")
				.replace(order as string, "")
				.replace(/@layer ca\.components \{[\s\S]*\}\s*$/, "")
				.trim();
			expect(outside).toBe("");
		});
	}
});
