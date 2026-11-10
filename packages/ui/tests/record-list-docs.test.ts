import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * #731: `2.75rem` is "44px" only at a 16px root. This library's root is 15px, so a RecordList actions
 * track written in rem is 41.25px, narrower than the 44px cell it holds. A docs or JSDoc example spells
 * the actions track `var(--ca-touch-target)` (or leaves it out and passes `actions`), never a touch size
 * in rem.
 */
const ROOT = join(import.meta.dir, "../../..");

function* files(dir: string): Generator<string> {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			if (!["node_modules", "dist", ".astro"].includes(e.name)) yield* files(p);
		} else if (/\.(mdx|svelte|json|ts)$/.test(e.name) && !e.name.endsWith(".test.ts")) yield p;
	}
}

/** A `columns="..."` value (or a `columns: '...'` default) of a RecordList whose last track is a rem touch size. */
const REM_TOUCH_TRACK = /columns[=:]\s*\\?["'][^"'\\]*\s(2\.75|2\.8|2\.9|2\.934|3)rem\\?["']/g;

describe("RecordList actions track spelling (#731)", () => {
	it("no docs, demo or JSDoc example ends `columns` with a touch size in rem", () => {
		const hits: string[] = [];
		for (const root of [
			"packages/ui/src/lib/components/RecordList",
			"site/src/content/docs",
			"site/src/demos",
			"site/src/templates",
		])
			for (const f of files(join(ROOT, root)))
				readFileSync(f, "utf8")
					.split("\n")
					.forEach((l, i) => {
						REM_TOUCH_TRACK.lastIndex = 0;
						if (l.includes("RecordList") || f.includes("record-list") || f.includes("RecordList")) {
							if (REM_TOUCH_TRACK.test(l)) hits.push(`${relative(ROOT, f)}:${i + 1}`);
						}
					});
		expect(hits).toEqual([]);
	});

	it("the pattern catches the documented example it replaces", () => {
		REM_TOUCH_TRACK.lastIndex = 0;
		expect(REM_TOUCH_TRACK.test('columns="minmax(0,1.2fr) minmax(0,1.6fr) 5rem 2.75rem"')).toBe(
			true
		);
	});
});
