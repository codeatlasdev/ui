import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { Window } from "happy-dom";
import { DIST, ROUTES } from "./routes";

/**
 * Page rules that are pure functions of the prerendered HTML, checked on `site/dist` with a DOM
 * parser and no browser (32 ms a page, the whole site in about a second). It adds to the axe project
 * and replaces none of it: axe checks what the browser renders; this checks what the server sent.
 * Rules that depend on client rendering are NOT here (`page-has-heading-one` is false on the app
 * templates, whose `<h1>` renders in the island).
 */
const PAGES = ROUTES.filter(
	(r) => !readFileSync(join(DIST, r, "index.html"), "utf8").includes('http-equiv="refresh"')
);

// happy-dom's nodes are not the DOM lib's `Element`: type only what is read.
type Named = {
	textContent: string | null;
	getAttribute(name: string): string | null;
	querySelector(selector: string): unknown;
};
const named = (e: Named) =>
	(e.textContent ?? "").trim() ||
	e.getAttribute("aria-label") ||
	e.getAttribute("aria-labelledby") ||
	e.getAttribute("title") ||
	e.querySelector("img[alt]:not([alt=''])") ||
	e.querySelector("svg title");

function problems(html: string): { problems: string[]; duplicateIds: string[] } {
	const window = new Window({
		settings: {
			disableJavaScriptEvaluation: true,
			disableJavaScriptFileLoading: true,
			disableCSSFileLoading: true,
		},
	});
	window.document.write(html);
	const d = window.document;
	const out: string[] = [];
	if (!d.title.trim()) out.push("document-title: empty <title>");
	if (!d.documentElement.getAttribute("lang")) out.push("html-has-lang: <html> has no lang");
	if (!d.querySelector('meta[name="viewport"]')) out.push("meta-viewport: no viewport meta");
	const main = d.querySelectorAll("main").length;
	if (main !== 1) out.push(`landmark-one-main: ${main} <main> elements`);
	for (const img of d.querySelectorAll("img"))
		if (!img.hasAttribute("alt") && img.getAttribute("role") !== "presentation")
			out.push(`image-alt: <img src="${img.getAttribute("src")}"> has no alt`);
	for (const a of d.querySelectorAll("a[href]"))
		if (!named(a)) out.push(`link-name: <a href="${a.getAttribute("href")}"> has no name`);

	const seen = new Map<string, number>();
	for (const e of d.querySelectorAll("[id]")) seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
	const duplicateIds = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
	window.close();
	return { problems: out.slice(0, 10), duplicateIds };
}

test.describe("prerendered HTML", () => {
	for (const route of PAGES) {
		test(route, () => {
			const { problems: found, duplicateIds } = problems(
				readFileSync(join(DIST, route, "index.html"), "utf8")
			);
			expect(found).toEqual([]);
			// Heading ids come from one per-page registry (src/lib/heading-ids.ts, #548).
			expect(duplicateIds, "duplicate ids").toEqual([]);
		});
	}
});
