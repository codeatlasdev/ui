import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #462: MDX JSX attributes have no escapes, so `description="… \"x\" …"` ends the string early and
 * the site build fails (`Unexpected character after <`). `astro check` in validate does not compile
 * MDX the way the build does, so this guard runs in the unit suite.
 */
const DOCS = new URL("../../../site/src/content/docs/", import.meta.url).pathname;
const files = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith(".mdx") ? [join(dir, e.name)] : []
	);

describe("MDX JSX attributes (#462)", () => {
	it("never use a backslash-escaped quote inside a double-quoted attribute", () => {
		const bad: string[] = [];
		for (const f of files(DOCS)) {
			let fence = false;
			readFileSync(f, "utf8")
				.split("\n")
				.forEach((line, i) => {
					if (line.trimStart().startsWith("```")) fence = !fence;
					if (!fence && /^\s*</.test(line) && /\w+="(?:[^"\\]|\\.)*\\"/.test(line))
						bad.push(`${f.slice(DOCS.length)}:${i + 1}`);
				});
		}
		expect(bad).toEqual([]);
	});
});
