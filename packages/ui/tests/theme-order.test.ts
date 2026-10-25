import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { build } from "astro";
import { THEME_BOOT_HEAD } from "../../../site/scripts/theme-boot.ts";
import { headFirst } from "../src/lib/head-first.ts";
import { caThemeHandle } from "../src/lib/kit/theme-handle.ts";
import { type ThemeOptions, themeHead } from "../src/lib/theme-script.ts";

// The first paint wears the right theme only if every theme script has RUN before the browser parses
// any CSS: a script after a stylesheet waits for it, and a slow link paints the wrong theme in between.
// This is the deterministic half of that guarantee (no browser, no timing): in the BUILT HTML of every
// consumer path (Kit, Vite, Astro), each theme script comes before the first `<style>` or `<link rel="stylesheet">`.
// The site's own pages are checked with the same rule in `site/tests/dist-html.spec.ts` (every page, after the build).
// `theme-no-flash.e2e.ts` paints the same pages on a slow device to show what a violation looks like.

const PKG = join(import.meta.dir, "..");
const THEME: ThemeOptions = {
	presets: [{ id: "brand", color: "#e8590c" }],
	defaultPreset: "brand",
};

/**
 * Index of the first page stylesheet in `html`, or -1: any `<link rel="stylesheet">` and any `<style>`
 * except the theme's own (`<style id="ca-theme">`, which is part of the theme markup and must come first).
 */
const firstCss = (html: string) =>
	html.search(/<style(?![^>]*\bid=["']ca-)[\s>]|<link\b[^>]*\brel=["']?stylesheet/i);
/** The document up to `<body>`: where every head script and stylesheet lives. */
const headOf = (html: string) => html.slice(0, html.search(/<body[\s>]/i) + 1 || undefined);

/**
 * The theme scripts a page must carry, found by what they do (not by `id`, so a layout that emits them
 * another way is still measured): the init script publishes `__caTheme`, the site's boot `__caSiteBoot`.
 */
const SCRIPTS = (site: boolean) => ["__caTheme", ...(site ? ["__caSiteBoot"] : [])];

/** Every marker in `markers` is inside a `<script>` of `html`'s head that precedes its first stylesheet. */
function orderProblems(html: string, markers: string[]): string[] {
	const head = headOf(html);
	const css = firstCss(head);
	const out: string[] = [];
	for (const marker of markers) {
		const at = [...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find((m) =>
			m[1].includes(marker)
		)?.index;
		if (at === undefined) out.push(`${marker}: no script in <head>`);
		else if (css >= 0 && at > css)
			out.push(`${marker}: script at ${at}, after the first stylesheet at ${css}`);
	}
	const style = head.indexOf('<style id="ca-theme">');
	if (style >= 0 && css >= 0 && style > css)
		out.push(`ca-theme <style>: after the first stylesheet`);
	return out;
}

const BIG = Array.from({ length: 400 }, (_, i) => `.x${i}{margin:${i % 7}px}`).join("");
const doc = (head: string) =>
	`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title><style>${BIG}</style><link rel="stylesheet" href="/a.css">${head}</head><body><h1>x</h1></body></html>`;

describe("helpers", () => {
	it("orderProblems names a script placed after a stylesheet, and passes the right order", () => {
		const late = `<!doctype html><html><head><style>a{}</style><script>window.__caTheme=1</script></head><body></body></html>`;
		expect(orderProblems(late, ["__caTheme"])).toEqual([
			expect.stringContaining("__caTheme: script at"),
		]);
		const linked = `<html><head><link rel="stylesheet" href="/a.css"><script>window.__caTheme=1</script></head><body></body></html>`;
		expect(orderProblems(linked, ["__caTheme"])).toHaveLength(1);
		const ok = `<html><head><script>window.__caTheme=1</script><style>a{}</style></head><body></body></html>`;
		expect(orderProblems(ok, ["__caTheme"])).toEqual([]);
		expect(orderProblems(ok, ["nope"])).toEqual(["nope: no script in <head>"]);
	});

	it("headFirst inserts after `<head>` with or without attributes, once", () => {
		expect(headFirst("<html><head><title>t</title>", "<b>")).toBe(
			"<html><head><b><title>t</title>"
		);
		expect(headFirst('<html><head data-x="1"><title>', "<b>")).toBe(
			'<html><head data-x="1"><b><title>'
		);
		expect(headFirst("<html><head><b>", "<b>")).toBe("<html><head><b>");
	});
});

describe("SvelteKit: caThemeHandle puts the theme before every stylesheet", () => {
	it("on a document with inline and linked CSS", async () => {
		const handle = caThemeHandle(THEME) as unknown as (i: unknown) => Promise<Response>;
		const res = await handle({
			event: { locals: {}, route: { id: "/" } },
			resolve: (
				_e: unknown,
				o: { transformPageChunk: (c: { html: string; done: boolean }) => string }
			) => new Response(o.transformPageChunk({ html: doc(""), done: true })),
		});
		expect(orderProblems(await res.text(), SCRIPTS(false))).toEqual([]);
	});
});

describe("plain Vite: caThemePlugin's head is before every stylesheet", () => {
	it("on an index.html with inline and linked CSS", () => {
		const html = headFirst(doc(""), themeHead(THEME));
		expect(orderProblems(html, SCRIPTS(false))).toEqual([]);
	});
});

describe("Astro: caUI puts the theme before every stylesheet, bundled or inline", () => {
	let root = "";
	const dist = () => join(root, "dist");
	beforeAll(async () => {
		root = mkdtempSync(join(PKG, ".astro-order-"));
		mkdirSync(join(root, "src/pages"), { recursive: true });
		writeFileSync(
			join(root, "astro.config.mjs"),
			`import { defineConfig } from "astro/config";
import { caUI } from ${JSON.stringify(join(PKG, "src/lib/astro.ts"))};
export default defineConfig({ integrations: [caUI(${JSON.stringify(THEME)}, { head: ${JSON.stringify(THEME_BOOT_HEAD)} })], devToolbar: { enabled: false }, build: { inlineStylesheets: "always" } });
`
		);
		writeFileSync(
			join(root, "src/pages/index.astro"),
			`---\nimport { ClientRouter } from "astro:transitions";\n---\n<html lang="en"><head><meta charset="utf-8" /><title>A</title><style is:global>${BIG}</style><ClientRouter /></head><body><h1>A</h1></body></html>\n`
		);
		await build({ root, logLevel: "silent" });
	}, 120_000);
	afterAll(() => root && rmSync(root, { recursive: true, force: true }));

	it("the built page has every theme script ahead of its inlined CSS", () => {
		const html = readFileSync(join(dist(), "index.html"), "utf8");
		expect(firstCss(headOf(html))).toBeGreaterThan(0);
		expect(orderProblems(html, SCRIPTS(true))).toEqual([]);
	});
});
