/**
 * Heading ids of a docs page are unique (#548): the markdown body, `<Demo>` and `<Props>` share one
 * registry. `site/tests/dist-html.spec.ts` proves it on the built pages; this proves the rules.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { demoTitles, headingId, slugOf, startPage } from "../../../site/src/lib/heading-ids.ts";

describe("heading ids", () => {
	it("numbers the repeated <Props> titles of one page", () => {
		startPage("/a/", [], "");
		expect([1, 2, 3].map(() => headingId("/a/", "Props"))).toEqual(["props", "props-1", "props-2"]);
	});

	it("gives a body heading precedence and numbers the component twin", () => {
		startPage("/b/", ["props"], "");
		expect(headingId("/b/", "Props")).toBe("props-1");
	});

	it("numbers a repeated demo title and keeps the first on the catalog slug", () => {
		startPage("/c/", [], '<Demo title="Autoplay" src={x}>');
		expect(headingId("/c/", "Autoplay", true)).toBe("autoplay");
		expect(headingId("/c/", "Autoplay")).toBe("autoplay-1");
	});

	it("reserves a demo slug so a <Props> title cannot take it", () => {
		startPage("/d/", [], '<Demo title="Props" src={x}>');
		expect(headingId("/d/", "Props")).toBe("props-1");
		expect(headingId("/d/", "Props", true)).toBe("props");
	});

	it("is independent per page", () => {
		startPage("/e/", [], "");
		startPage("/f/", [], "");
		expect(headingId("/e/", "Props")).toBe("props");
		expect(headingId("/f/", "Props")).toBe("props");
	});

	it("slugs like the catalog", () => {
		expect(slugOf("Dense, pinned and grouped")).toBe("dense-pinned-and-grouped");
		expect(demoTitles('<Demo title="A b" x /><Demo\n title="C">')).toEqual(["A b", "C"]);
	});
});

describe("docs sources", () => {
	it("never title a body heading like a <Demo> of the same page", () => {
		const walk = (d: string): string[] =>
			readdirSync(d).flatMap((f) => {
				const p = join(d, f);
				return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
			});
		const root = join(import.meta.dir, "../../../site/src/content/docs");
		const clashes: string[] = [];
		for (const f of walk(root)) {
			const src = readFileSync(f, "utf8").replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, "");
			const demos = new Set(demoTitles(src).map(slugOf));
			for (const m of src.matchAll(/^#{2,4}\s+(.+)$/gm))
				if (demos.has(slugOf(m[1].replace(/[`*]/g, ""))))
					clashes.push(`${f.slice(root.length)}: ${m[1]}`);
		}
		expect(clashes).toEqual([]);
	});
});
