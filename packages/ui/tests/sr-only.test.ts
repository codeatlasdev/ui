import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathOf, relativeTo, toPosix } from "./paths";

// One visually-hidden pattern: `.ca-sr-only` in styles/utilities.css. Components use the class
// (or the shared selector there) instead of re-declaring the 1px clip box.
const lib = pathOf("../src/lib/", import.meta.url);

function* sources(dir: string): Generator<string> {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* sources(path);
		else if (/\.(svelte|css)$/.test(name) && !name.endsWith(".test.svelte")) yield path;
	}
}

const CLIP = /clip-path:\s*inset\(50%\)|clip:\s*rect\(0[ ,]/;

describe("visually-hidden pattern", () => {
	it("utilities.css defines .ca-sr-only and its focusable variant", () => {
		const css = readFileSync(join(lib, "styles/utilities.css"), "utf8");
		expect(css).toContain(".ca-sr-only");
		expect(css).toContain(".ca-sr-only--focusable");
	});

	it("only utilities.css declares the clip pattern", () => {
		const offenders = [...sources(lib)]
			.filter((p) => !toPosix(p).endsWith("styles/utilities.css"))
			.filter((p) => CLIP.test(readFileSync(p, "utf8")))
			.map((p) => relativeTo(lib, p));
		expect(offenders).toEqual([]);
	});
});
