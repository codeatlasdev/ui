import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "astro";
import { chromium, type Page } from "playwright";

// #265: with <ClientRouter /> (View Transitions) Astro swaps <head> and the <html> attributes with
// the ones of the next document. The theme (<style id="ca-theme">, data-preset, tokens) is created
// by an inline head script at load, so the new document does not have it and the page fell back to
// the package defaults after the first client navigation.

const PKG = join(import.meta.dir, "..");
const ASTRO_ENTRY = join(PKG, "src/lib/astro.ts");
const THEME_OPTIONS = `{ presets: [{ id: "brand", color: "#2563eb" }], defaultPreset: "brand", radius: 0 }`;

const page = (title: string, href: string, label: string) => `---
import { ClientRouter } from "astro:transitions";
---
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>${title}</title>
		<ClientRouter />
	</head>
	<body>
		<h1>${title}</h1>
		<a id="go" href="${href}">${label}</a>
	</body>
</html>
`;

let root = "";
let server: ReturnType<typeof Bun.serve>;
let url = "";

beforeAll(async () => {
	root = mkdtempSync(join(PKG, ".astro-fixture-"));
	mkdirSync(join(root, "src/pages"), { recursive: true });
	writeFileSync(
		join(root, "astro.config.mjs"),
		`import { defineConfig } from "astro/config";
import { caUI } from ${JSON.stringify(ASTRO_ENTRY)};
export default defineConfig({ integrations: [caUI(${THEME_OPTIONS})], devToolbar: { enabled: false } });
`
	);
	writeFileSync(join(root, "src/pages/index.astro"), page("A", "/b/", "to b"));
	writeFileSync(join(root, "src/pages/b.astro"), page("B", "/", "to a"));
	await build({ root, logLevel: "silent" });
	const dist = join(root, "dist");
	server = Bun.serve({
		port: 0,
		async fetch(req) {
			let p = new URL(req.url).pathname;
			if (p.endsWith("/")) p += "index.html";
			const f = Bun.file(join(dist, p));
			return (await f.exists()) ? new Response(f) : new Response("not found", { status: 404 });
		},
	});
	url = `http://localhost:${server.port}`;
}, 120_000);

afterAll(() => {
	server?.stop(true);
	if (root) rmSync(root, { recursive: true, force: true });
});

interface ThemeSnapshot {
	style: number;
	preset: string | null;
	scheme: string | null;
	radiusScale: string;
	title: string;
}

/** What a user sees as "the theme": the injected style, the <html> attributes and a token it sets. */
function snapshot(pg: Page): Promise<ThemeSnapshot> {
	return pg.evaluate(() => ({
		style: document.querySelectorAll("#ca-theme").length,
		preset: document.documentElement.getAttribute("data-preset"),
		scheme: document.documentElement.getAttribute("data-ca-scheme"),
		radiusScale: getComputedStyle(document.documentElement)
			.getPropertyValue("--ca-radius-scale")
			.trim(),
		title: document.title,
	}));
}

async function navigate(pg: Page, title: string): Promise<void> {
	await pg.click("#go");
	await pg.waitForFunction((t) => document.title === t, title);
	await pg.waitForLoadState("networkidle");
}

describe("caUI with <ClientRouter /> (#265)", () => {
	it("keeps the theme after a client-side navigation, and back", async () => {
		const browser = await chromium.launch();
		try {
			const pg = await browser.newPage();
			await pg.goto(`${url}/`);
			const before = await snapshot(pg);
			expect(before).toEqual({
				style: 1,
				preset: "brand",
				scheme: "dark",
				radiusScale: "0",
				title: "A",
			});

			await navigate(pg, "B");
			// Same document: the swap was a client navigation, not a reload.
			expect(await pg.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(1);
			expect(await snapshot(pg)).toEqual({ ...before, title: "B" });

			await navigate(pg, "A");
			expect(await snapshot(pg)).toEqual(before);
		} finally {
			await browser.close();
		}
	}, 60_000);
});
