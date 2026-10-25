import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "astro";
import type { Server } from "bun";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { caThemeHandle } from "../src/lib/kit/theme-handle.ts";
import { THEME_SCRIPT, themeHead, themeScript } from "../src/lib/theme-script.ts";

// The zero-flash guarantee of the theme engine, for every way a consumer ships it, measured in a real
// browser on a slow device and a slow link (6x CPU, Slow 3G). A frame is "painted" once the browser
// reported first-paint; from then on EVERY frame must already wear the target theme: its brand token,
// its surface (the canvas colour), its `dark` class and `data-preset`/`data-style`.
//
// Every document here pulls a large stylesheet (~600 KB) before `</head>`, the shape that exposed the
// site bug (a theme script placed after the bundler's CSS ran only after that download, and the page
// painted the wrong theme in between).

const PKG = join(import.meta.dir, "..");
const ASTRO_ENTRY = join(PKG, "src/lib/astro.ts");
const THEME = {
	presets: [{ id: "brand", color: "#e8590c" }],
	defaultPreset: "brand",
	defaultScheme: "dark",
} as const;
const THEME_OPTIONS = JSON.stringify(THEME);

/** 6x CPU and Slow 3G (400 kbit/s, 400 ms RTT). */
const SLOW = {
	latency: 400,
	downloadThroughput: (400 * 1024) / 8,
	uploadThroughput: (400 * 1024) / 8,
};

/** ~600 KB of rules the page needs before it can paint, so a late script is visible. */
const BIG_CSS = Array.from(
	{ length: 9000 },
	(_, i) => `.x${i}{margin:${i % 7}px;padding:${i % 5}px}`
).join("");
const TOKENS_CSS = `html{background:var(--ca-surface-base,#fff);color:var(--ca-text-primary,#000)}`;

interface Frame {
	brand: string;
	canvas: string;
	dark: boolean;
	preset: string | null;
	style: string | null;
}

interface Recorder {
	__f: Frame[];
	__cls: number;
	__painted: boolean;
}
interface ShiftEntry extends PerformanceEntry {
	value: number;
	hadRecentInput: boolean;
}

let browser: Browser;
let root = "";
let astroDist = "";
const servers: Server<unknown>[] = [];

/** `<head>` extras and body of a document; the CSS link is deliberately slow and large. */
const doc = (head: string, body = "<h1>hello</h1>") =>
	`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${head}<link rel="stylesheet" href="/big.css"></head><body>${body}</body></html>`;

function serve(handler: (path: string) => string | undefined) {
	const s = Bun.serve({
		port: 0,
		fetch(req) {
			const p = new URL(req.url).pathname;
			if (p === "/big.css")
				return new Response(`${TOKENS_CSS}${BIG_CSS}`, { headers: { "content-type": "text/css" } });
			const html = handler(p);
			return html === undefined
				? new Response("nf", { status: 404 })
				: new Response(html, { headers: { "content-type": "text/html" } });
		},
	});
	servers.push(s);
	return `http://localhost:${s.port}`;
}

/** What `caThemeHandle` does to a SvelteKit response, with the real handle. */
async function kitHtml(html: string, opts = THEME): Promise<string> {
	let out = "";
	const handle = caThemeHandle(opts) as unknown as (a: {
		event: unknown;
		resolve: (
			e: unknown,
			o: { transformPageChunk: (c: { html: string; done: boolean }) => string }
		) => unknown;
	}) => unknown;
	await handle({
		event: {},
		resolve: (_e, o) => {
			out = o.transformPageChunk({ html, done: true });
			return new Response();
		},
	});
	return out;
}

async function context(opts: { storage?: Record<string, string>; scheme?: "dark" | "light" } = {}) {
	const ctx = await browser.newContext({ colorScheme: opts.scheme ?? "dark" });
	if (opts.storage)
		await ctx.addInitScript((kv: Record<string, string>) => {
			if (sessionStorage.getItem("__seeded")) return;
			sessionStorage.setItem("__seeded", "1");
			for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v);
		}, opts.storage);
	return ctx;
}

async function recorded(ctx: BrowserContext): Promise<Page> {
	const page = await ctx.newPage();
	await page.addInitScript(() => {
		const w: Window & Partial<Recorder> = window;
		w.__f = [];
		w.__cls = 0;
		w.__painted = false;
		new PerformanceObserver((l) => {
			for (const e of l.getEntries()) if (e.name === "first-paint") w.__painted = true;
		}).observe({ type: "paint", buffered: true });
		new PerformanceObserver((l) => {
			for (const e of l.getEntries() as ShiftEntry[])
				if (!e.hadRecentInput) w.__cls = (w.__cls ?? 0) + e.value;
		}).observe({ type: "layout-shift", buffered: true });
		const tick = () => {
			if (w.__painted && w.__f) {
				const h = document.documentElement;
				const cs = getComputedStyle(h);
				w.__f.push({
					brand: cs.getPropertyValue("--ca-brand-main").trim(),
					canvas: cs.backgroundColor,
					dark: h.classList.contains("dark"),
					preset: h.getAttribute("data-preset"),
					style: h.getAttribute("data-style"),
				});
			}
			if ((w.__f?.length ?? 0) < 800) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
	const cdp = await ctx.newCDPSession(page);
	await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
	await cdp.send("Network.enable");
	await cdp.send("Network.emulateNetworkConditions", { offline: false, ...SLOW });
	return page;
}

const frames = (p: Page): Promise<Frame[]> =>
	p.evaluate(() => {
		const w: Window & Partial<Recorder> = window;
		return w.__f ?? [];
	});
const cls = (p: Page): Promise<number> =>
	p.evaluate(() => {
		const w: Window & Partial<Recorder> = window;
		return w.__cls ?? 0;
	});

/** The distinct looks in paint order: a failure reads as the sequence the visitor saw. */
const looks = (f: Frame[]) =>
	f
		.map((x) => `${x.preset}/${x.style}/${x.dark ? "dark" : "light"} ${x.brand} ${x.canvas}`)
		.filter((v, i, a) => v !== a[i - 1]);

/** Loads `url`, waits for `load`, and returns the distinct looks that were painted. */
async function firstFrames(ctx: BrowserContext, url: string) {
	const p = await recorded(ctx);
	await p.goto(url, { waitUntil: "load" });
	await p.waitForTimeout(300);
	const f = await frames(p);
	expect(f.length, "the recorder saw painted frames").toBeGreaterThan(0);
	return { page: p, frames: f, looks: looks(f) };
}

beforeAll(async () => {
	browser = await chromium.launch();
	root = mkdtempSync(join(PKG, ".astro-fixture-"));
	mkdirSync(join(root, "src/pages"), { recursive: true });
	writeFileSync(
		join(root, "astro.config.mjs"),
		`import { defineConfig } from "astro/config";
import { caUI } from ${JSON.stringify(ASTRO_ENTRY)};
export default defineConfig({ integrations: [caUI(${THEME_OPTIONS})], devToolbar: { enabled: false }, build: { inlineStylesheets: "always" } });
`
	);
	const bigRules = Array.from({ length: 9000 }, (_, i) => `.x${i}{margin:${i % 7}px}`).join("");
	const page = (title: string, href: string) => `---
import { ClientRouter } from "astro:transitions";
---
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>${title}</title>
		<style is:global>${TOKENS_CSS}${bigRules}</style>
		<ClientRouter />
	</head>
	<body><h1>${title}</h1><a id="go" href="${href}">go</a></body>
</html>
`;
	writeFileSync(join(root, "src/pages/index.astro"), page("A", "/b/"));
	writeFileSync(join(root, "src/pages/b.astro"), page("B", "/"));
	await build({ root, logLevel: "silent" });
	astroDist = join(root, "dist");
}, 180_000);

afterAll(async () => {
	await browser?.close();
	for (const s of servers) s.stop(true);
	if (root) rmSync(root, { recursive: true, force: true });
});

describe("zero flash of the wrong theme, every consumer path (6x CPU, Slow 3G)", () => {
	it("SvelteKit: caThemeHandle (SSR/prerender) paints the stored theme from the first frame", async () => {
		const html = await kitHtml(doc(""));
		const base = serve(() => html);
		const ctx = await context({
			storage: { "ca-scheme": '"light"', "ca-style": '"flat"' },
			scheme: "dark",
		});
		const r = await firstFrames(ctx, `${base}/`);
		expect(r.looks).toHaveLength(1);
		expect(r.looks[0]).toContain("brand/flat/light");
		expect(await cls(r.page)).toBe(0);
		await ctx.close();
	}, 90_000);

	it("SPA with no SSR: caThemePlugin's head in index.html paints the stored theme from the first frame", async () => {
		const base = serve(() => doc(themeHead(THEME)));
		const ctx = await context({ storage: { "ca-scheme": '"light"' } });
		const r = await firstFrames(ctx, `${base}/`);
		expect(r.looks).toHaveLength(1);
		expect(r.looks[0]).toContain("brand/solid/light");
		await ctx.close();
	}, 90_000);

	it("system scheme follows the OS on the first frame, dark and light", async () => {
		const base = serve(() => doc(themeHead(THEME)));
		for (const os of ["dark", "light"] as const) {
			const ctx = await context({ storage: { "ca-scheme": '"system"' }, scheme: os });
			const r = await firstFrames(ctx, `${base}/`);
			expect(r.looks, `OS ${os}`).toHaveLength(1);
			expect(r.looks[0]).toContain(`/${os} `);
			await ctx.close();
		}
	}, 90_000);

	it("persisted runtime tokens (colorScheme.setTokens) are on the first frame", async () => {
		const base = serve(() => doc(themeHead(THEME)));
		const ctx = await context({
			storage: { "ca-runtime-tokens": JSON.stringify({ "--ca-brand-main": "rgb(1, 2, 3)" }) },
		});
		const r = await firstFrames(ctx, `${base}/`);
		expect(r.looks).toHaveLength(1);
		expect(r.looks[0]).toContain("rgb(1, 2, 3)");
		await ctx.close();
	}, 90_000);

	it("old, corrupt or blocked storage falls back to the default silently, on the first frame", async () => {
		const base = serve(() => doc(themeHead(THEME)));
		const ctx = await context({
			storage: {
				"ca-scheme": "{not json",
				"ca-preset": '"amber-from-v1"',
				"ca-style": '"neon"',
				"ca-runtime-tokens": "[[[",
			},
		});
		const r = await firstFrames(ctx, `${base}/`);
		expect(r.looks).toHaveLength(1);
		expect(r.looks[0]).toContain("brand/");
		expect(r.looks[0]).toContain("/dark ");
		await ctx.close();

		// Storage that throws on access (private mode, cookies off): the default theme still paints.
		const blocked = await browser.newContext({ colorScheme: "dark" });
		await blocked.addInitScript(() => {
			Object.defineProperty(window, "localStorage", {
				get() {
					throw new DOMException("denied", "SecurityError");
				},
			});
		});
		const b = await firstFrames(blocked, `${base}/`);
		expect(b.looks).toHaveLength(1);
		expect(b.looks[0]).toContain("brand/solid/dark");
		await blocked.close();
	}, 90_000);

	it("the init script is synchronous, first in <head>, tiny and CSP-nonce friendly", async () => {
		const head = themeHead(THEME);
		expect(head).not.toMatch(/\b(async|defer)\b|type="module"/);
		expect(head.indexOf('<script id="ca-theme-init">')).toBeGreaterThan(head.indexOf("<style"));
		// Nothing in it needs `eval` or an inline event handler, so a nonce/hash on the one tag is enough.
		expect(THEME_SCRIPT).not.toMatch(/\beval\(|new Function|onload=|javascript:/);
		const html = await kitHtml(doc(""));
		expect(html.indexOf("ca-theme-init")).toBeLessThan(html.indexOf('rel="stylesheet"'));
		// Same body whatever the options: the scripts differ only by their JSON data.
		expect(themeScript(THEME).length).toBeLessThan(2200);
	});

	it("Astro caUI + <ClientRouter />: the first frame and every navigated frame wear the theme", async () => {
		const s = Bun.serve({
			port: 0,
			async fetch(req) {
				let p = new URL(req.url).pathname;
				if (p.endsWith("/")) p += "index.html";
				const f = Bun.file(join(astroDist, p));
				return (await f.exists()) ? new Response(f) : new Response("nf", { status: 404 });
			},
		});
		servers.push(s);
		const url = `http://localhost:${s.port}`;
		const ctx = await context({ storage: { "ca-scheme": '"light"', "ca-style": '"flat"' } });
		const r = await firstFrames(ctx, `${url}/`);
		expect(r.looks).toHaveLength(1);
		expect(r.looks[0]).toContain("brand/flat/light");

		// A client-side navigation swaps <head> and <html>: no frame of it may drop the theme.
		await r.page.evaluate(() => {
			const w: Window & Partial<Recorder> = window;
			w.__f = [];
		});
		await r.page.click("#go");
		await r.page.waitForFunction(() => document.title === "B");
		await r.page.waitForTimeout(300);
		const after = looks(await frames(r.page));
		expect(after).toHaveLength(1);
		expect(after[0]).toContain("brand/flat/light");
		await ctx.close();
	}, 120_000);

	it("a runtime switch changes preset, style and scheme in one frame, never a mixed state", async () => {
		const base = serve(() => doc(themeHead(THEME)));
		const ctx = await browser.newContext({ colorScheme: "dark" });
		const p = await ctx.newPage();
		await p.goto(`${base}/`, { waitUntil: "load" });
		const seen = await p.evaluate(async () => {
			const h = document.documentElement;
			const snap = () =>
				`${h.getAttribute("data-preset")}/${h.getAttribute("data-style")}/${h.classList.contains("dark")}`;
			const frames: string[] = [];
			let go = true;
			const tick = () => {
				frames.push(snap());
				if (go) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
			const frame = () => {
				const { promise, resolve } = Promise.withResolvers<void>();
				requestAnimationFrame(() => resolve());
				return promise;
			};
			await frame();
			// What `colorScheme.setPreset/setStyle/setPreference` do together: one synchronous write.
			h.setAttribute("data-preset", "ocean");
			h.setAttribute("data-style", "flat");
			h.classList.toggle("dark", false);
			await frame();
			await frame();
			go = false;
			return [...new Set(frames)];
		});
		expect(seen).toEqual(["brand/solid/true", "ocean/flat/false"]);
		await ctx.close();
	}, 60_000);

	it("no transition plays on load: transitions are off until the first frames are painted", async () => {
		const base = serve(() =>
			doc(
				`${themeHead(THEME)}<style>@layer x{} .ca-init,.ca-init *{transition:none!important}body{transition:background 2s}</style>`
			)
		);
		const ctx = await context();
		const p = await ctx.newPage();
		await p.goto(`${base}/`, { waitUntil: "commit" });
		await p.waitForLoadState("load");
		await p.waitForFunction(() => !document.documentElement.classList.contains("ca-init"));
		expect(await p.evaluate(() => document.getAnimations().length)).toBe(0);
		await ctx.close();
	}, 60_000);
});
