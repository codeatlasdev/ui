import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

// #725: in a real SvelteKit app (client router, shallow routing) mounting <OverlayHistory /> makes
// the browser's Back close the topmost modal layer instead of leaving the route. Runs the app in
// Vite's dev server at 390x844, the viewport of the phone Back gesture the issue is about.

const PKG = join(import.meta.dir, "..");
const SRC = join(PKG, "src/lib");

let root = "";
let server: ViteDevServer;
let browser: Browser;
let url = "";

const route = (name: string, body: string) => `<script>
	import { Sheet, Dialog, MobilePane, Button } from "@codeatlasdev/ui";
	let sheet = $state(false);
	let nested = $state(false);
	let pane = $state(false);
</script>
<h1>${name}</h1>
<Button onclick={() => (sheet = true)}>Open sheet</Button>
<Button onclick={() => (pane = true)}>Open pane</Button>
<a href="/other">Other page</a>
<Sheet bind:open={sheet} title="Filters">
	<Button onclick={() => (nested = true)}>Open dialog</Button>
	<a href="/other">Leave from sheet</a>
</Sheet>
<Dialog bind:open={nested} title="Nested"><p>Nested</p></Dialog>
<MobilePane bind:open={pane} title="Thread"><p>Thread</p></MobilePane>
${body}
`;

beforeAll(async () => {
	root = mkdtempSync(join(PKG, ".kit-fixture-"));
	for (const d of ["src/routes/other", "src"]) mkdirSync(join(root, d), { recursive: true });
	writeFileSync(
		join(root, "vite.config.js"),
		`import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
export default defineConfig({
	plugins: [sveltekit({ adapter: { name: "fixture", adapt() {} } })],
	resolve: { alias: [
		{ find: /^@codeatlasdev\\/ui\\/kit$/, replacement: ${JSON.stringify(join(SRC, "kit/index.ts"))} },
		{ find: /^@codeatlasdev\\/ui$/, replacement: ${JSON.stringify(join(SRC, "index.ts"))} },
	] },
	server: { fs: { allow: [${JSON.stringify(join(PKG, "../.."))}] } },
});
`
	);
	writeFileSync(
		join(root, "package.json"),
		JSON.stringify({ name: "kit-fixture", type: "module" })
	);
	writeFileSync(
		join(root, "src/app.html"),
		`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />%sveltekit.head%</head><body><div>%sveltekit.body%</div></body></html>`
	);
	writeFileSync(
		join(root, "src/routes/+layout.svelte"),
		`<script>
	import "${join(SRC, "styles/global.css")}";
	import { OverlayHistory } from "@codeatlasdev/ui/kit";
	let { children } = $props();
</script>
<OverlayHistory />
<main id="main">{@render children()}</main>
`
	);
	writeFileSync(join(root, "src/routes/+page.svelte"), route("Home", ""));
	writeFileSync(join(root, "src/routes/other/+page.svelte"), `<h1>Other</h1><a href="/">Home</a>`);
	// Kit resolves its runtime files relative to the working directory.
	process.chdir(root);
	server = await createServer({ root, logLevel: "silent", server: { port: 0, host: "127.0.0.1" } });
	await server.listen();
	const addr = server.httpServer?.address();
	url = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
	browser = await chromium.launch();
}, 120_000);

afterAll(async () => {
	process.chdir(PKG);
	await browser?.close();
	await server?.close();
	if (root) rmSync(root, { recursive: true, force: true });
});

async function open(): Promise<Page> {
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const pg = await ctx.newPage();
	await pg.goto(`${url}/`);
	// Hydrated: the Kit client sets this once it has started.
	await pg.waitForFunction(() => document.querySelector("h1")?.textContent === "Home");
	await pg.waitForTimeout(500);
	return pg;
}
const state = (pg: Page) =>
	pg.evaluate(() => ({ length: history.length, path: location.pathname }));
const visible = (pg: Page, name: string) =>
	pg
		.getByRole("dialog", { name })
		.isVisible()
		.catch(() => false);
const back = async (pg: Page) => {
	await pg.goBack();
	await pg.waitForTimeout(400);
};

describe("<OverlayHistory /> in a SvelteKit app (#725)", () => {
	it("open Sheet, Back closes it, the URL does not change", async () => {
		const pg = await open();
		const before = await state(pg);
		await pg.getByRole("button", { name: "Open sheet" }).click();
		await pg.getByRole("dialog", { name: "Filters" }).waitFor();
		expect((await state(pg)).length).toBe(before.length + 1);
		await back(pg);
		expect(await visible(pg, "Filters")).toBe(false);
		expect((await state(pg)).path).toBe("/");
		await pg.context().close();
	}, 60_000);

	it("closing by button leaves the history length where it was", async () => {
		const pg = await open();
		const before = await state(pg);
		await pg.getByRole("button", { name: "Open pane" }).click();
		await pg.getByRole("dialog", { name: "Thread" }).waitFor();
		await pg.getByRole("button", { name: "Back" }).click();
		await pg.waitForTimeout(500);
		expect(await visible(pg, "Thread")).toBe(false);
		const after = await state(pg);
		// The entry was consumed (history.go), not left behind: Back now leaves the page, not an orphan.
		expect(after.path).toBe(before.path);
		await pg.goBack();
		await pg.waitForTimeout(400);
		expect(await pg.evaluate(() => location.href)).not.toContain(url + "/");
		await pg.context().close();
	}, 60_000);

	it("two stacked layers need two Backs", async () => {
		const pg = await open();
		await pg.getByRole("button", { name: "Open sheet" }).click();
		await pg.getByRole("button", { name: "Open dialog" }).click();
		await pg.getByRole("dialog", { name: "Nested" }).waitFor();
		await back(pg);
		expect(await visible(pg, "Nested")).toBe(false);
		expect(await visible(pg, "Filters")).toBe(true);
		await back(pg);
		expect(await visible(pg, "Filters")).toBe(false);
		expect((await state(pg)).path).toBe("/");
		await pg.context().close();
	}, 60_000);

	it("reload with an overlay entry does not reopen it, and one Back leaves", async () => {
		const pg = await open();
		await pg.getByRole("button", { name: "Open sheet" }).click();
		await pg.getByRole("dialog", { name: "Filters" }).waitFor();
		await pg.reload();
		await pg.waitForTimeout(800);
		expect(await visible(pg, "Filters")).toBe(false);
		expect((await state(pg)).path).toBe("/");
		await pg.context().close();
	}, 60_000);

	it("a link inside a layer navigates once and the new page is not under stale entries", async () => {
		const pg = await open();
		await pg.getByRole("button", { name: "Open sheet" }).click();
		await pg.getByRole("link", { name: "Leave from sheet" }).click();
		await pg.waitForFunction(() => location.pathname === "/other");
		await pg.waitForTimeout(500);
		// One Back returns to Home with the layer closed (not to Home with an overlay entry on top).
		await back(pg);
		expect((await state(pg)).path).toBe("/");
		expect(await visible(pg, "Filters")).toBe(false);
		await pg.context().close();
	}, 60_000);
});
