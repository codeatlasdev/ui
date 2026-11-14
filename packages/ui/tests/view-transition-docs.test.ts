import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

// #1070: a route-level `document.startViewTransition` over an app shell cross-fades two frozen images of every
// persistent bar (measured: ~30 frames per navigation on an iPhone), so the bars look recreated. Any docs page that
// recommends the API must say to keep the persistent chrome out of it.
const DOCS = join(import.meta.dir, "../../../site/src/content/docs");

function mdx(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? mdx(join(dir, e.name)) : e.name.endsWith(".mdx") ? [join(dir, e.name)] : []
	);
}

describe("view transitions in the docs (#1070)", () => {
	it("every page that shows startViewTransition keeps persistent bars out of it", () => {
		const missing = mdx(DOCS)
			.filter((f) => readFileSync(f, "utf8").includes("startViewTransition"))
			.filter((f) => {
				const text = readFileSync(f, "utf8");
				return !(/persistent bar/i.test(text) && text.includes("view-transition-name"));
			})
			.map((f) => relative(DOCS, f).split(sep).join("/"));
		expect(missing).toEqual([]);
	});
});
