import { afterEach, beforeEach, describe, expect, it, jest, mock, spyOn } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createErrorHandler } from "../src/lib/kit/create-error-handler.js";
import { caThemeHandle } from "../src/lib/kit/theme-handle.js";
import {
	brandPresetCSS,
	CA_THEME_MARKER,
	THEME_SCRIPT,
	themeHead,
	themeScript,
} from "../src/lib/theme-script.js";
import { CA_THEME_SCRIPT_TAG, caErrorPlugin, caThemePlugin } from "../src/lib/vite-plugin.js";

/** A new instance of theme-handle.ts (its own once-per-process `warned` set); Bun keys modules by URL. */
const freshThemeHandle = (n: number): Promise<{ caThemeHandle: typeof caThemeHandle }> =>
	import(`../src/lib/kit/theme-handle.js?fresh=${n}`);

// ── theme-script ─────────────────────────────────────────────────────────────

describe("themeScript", () => {
	it("defaults to amber/dark/glass", () => {
		expect(THEME_SCRIPT).toBe(themeScript());
		expect(themeScript({ defaultPreset: "ocean" })).not.toBe(THEME_SCRIPT);
	});
});

describe("brandPresetCSS / themeHead", () => {
	it("rejects non #rrggbb colors", () => {
		expect(() => brandPresetCSS({ id: "x", color: "blue" })).toThrow(/#rrggbb/);
		expect(() => brandPresetCSS({ id: "x", color: "#fff" })).toThrow(/#rrggbb/);
	});

	it("publishes the canvas-safe chart color", () => {
		expect(brandPresetCSS({ id: "brand", color: "#2563eb" })).toContain(
			"--ca-chart-brand: #2563eb;"
		);
	});

	it("without customization emits only the marked script", () => {
		expect(themeHead()).toBe(`<script id="${CA_THEME_MARKER}">${THEME_SCRIPT}</script>`);
	});

	it("puts theme styles before the script", () => {
		const head = themeHead({ presets: [{ id: "brand", color: "#2563eb" }] });
		expect(head.startsWith('<style id="ca-theme">')).toBe(true);
		expect(head.indexOf("</style>")).toBeLessThan(head.indexOf("<script"));
	});

	it("rejects presets that clash with built-ins and unknown defaults", () => {
		expect(() => themeHead({ presets: [{ id: "ocean", color: "#2563eb" }] })).toThrow(/built-in/);
		expect(() => themeHead({ defaultPreset: "nope" })).toThrow(/not a known preset/);
	});
});

// ── caThemeHandle ────────────────────────────────────────────────────────────

describe("caThemeHandle", () => {
	async function run(html: string, opts?: Parameters<typeof caThemeHandle>[0], done = true) {
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
				out = o.transformPageChunk({ html, done });
				return new Response();
			},
		});
		return out;
	}

	it("injects the theme head right after <head>", async () => {
		const out = await run("<html><head><title>x</title></head></html>");
		expect(out.startsWith(`<html><head><script id="${CA_THEME_MARKER}">`)).toBe(true);
		expect(out).toContain("<title>x</title>");
	});

	it("warns once in dev when viewport-fit=cover or <html lang> is missing", async () => {
		// A query string gives a fresh module instance, hence a fresh once-per-process `warned` set.
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		const { caThemeHandle: fresh } = await freshThemeHandle(1);
		const page = (html: string) =>
			(fresh() as unknown as (a: unknown) => unknown)({
				event: {},
				resolve: (
					_e: unknown,
					o: { transformPageChunk: (c: { html: string; done: boolean }) => string }
				) => {
					o.transformPageChunk({ html, done: true });
					return new Response();
				},
			});
		await page('<html><head><meta name="viewport" content="width=device-width"></head></html>');
		await page('<html><head><meta name="viewport" content="width=device-width"></head></html>');
		expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
			expect.stringContaining("viewport-fit=cover"),
			expect.stringContaining("lang"),
		]);

		warn.mockClear();
		const { caThemeHandle: clean } = await freshThemeHandle(2);
		await (clean() as unknown as (a: unknown) => unknown)({
			event: {},
			resolve: (
				_e: unknown,
				o: { transformPageChunk: (c: { html: string; done: boolean }) => string }
			) => {
				o.transformPageChunk({
					html: '<html lang="en"><head><meta name="viewport" content="width=device-width, viewport-fit=cover"></head></html>',
					done: true,
				});
				return new Response();
			},
		});
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it("is idempotent when the marker is already present", async () => {
		const html = `<head><script id="${CA_THEME_MARKER}"></script></head>`;
		expect(await run(html)).toBe(html);
	});

	it("leaves non-final chunks untouched", async () => {
		const html = "<head>";
		expect(await run(html, {}, false)).toBe(html);
	});

	it("forwards options (default preset + brand presets)", async () => {
		const out = await run("<head></head>", {
			defaultPreset: "brand",
			presets: [{ id: "brand", color: "#2563eb" }],
		});
		expect(out).toContain('"brand"');
		expect(out).toContain('id="ca-theme"');
	});
});

// ── createErrorHandler ───────────────────────────────────────────────────────

describe("createErrorHandler", () => {
	const event = { url: new URL("https://x.test/a"), route: { id: "/a" } };

	it("exposes 4xx messages as CLIENT_ERROR with a unique id", () => {
		const h = createErrorHandler();
		const a = h({ error: new Error("Não encontrado"), event, status: 404 });
		const b = h({ error: "texto", event, status: 400 });
		expect(a).toMatchObject({ message: "Não encontrado", code: "CLIENT_ERROR" });
		expect(b.message).toBe("texto");
		expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
		expect(a.id).not.toBe(b.id);
	});

	it("hides internal messages for 5xx", () => {
		const h = createErrorHandler();
		const r = h({ error: new Error("secret db password"), event, status: 500 });
		expect(r).toMatchObject({ message: "An unexpected error occurred.", code: "INTERNAL_ERROR" });
		expect(JSON.stringify(r)).not.toContain("secret");
	});

	it("uses defaultMessage for unknown thrown values", () => {
		const h = createErrorHandler({ defaultMessage: "Algo deu errado" });
		expect(h({ error: { weird: true }, event, status: 400 }).message).toBe("Algo deu errado");
		expect(h({ error: new Error("x"), event, status: 503 }).message).toBe("Algo deu errado");
	});

	it("reports the sanitized error and the event", () => {
		const report = mock();
		const r = createErrorHandler({ report })({ error: new Error("boom"), event, status: 500 });
		expect(report).toHaveBeenCalledTimes(1);
		expect(report).toHaveBeenCalledWith(r, event);
	});
});

// ── vite plugins ─────────────────────────────────────────────────────────────

type Hook = (...a: unknown[]) => unknown;
function hookHandler(fn: unknown): Hook {
	if (fn && typeof fn === "object" && "handler" in fn && typeof fn.handler === "function") {
		return fn.handler as Hook;
	}
	throw new Error("plugin hook is neither a function nor { handler }");
}
const call = (fn: unknown, ctx: unknown, ...args: unknown[]) =>
	(typeof fn === "function" ? fn : hookHandler(fn)).apply(ctx, args);

describe("caThemePlugin", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "ca-vite-"));
		mkdirSync(join(root, "src"));
	});
	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
		jest.restoreAllMocks();
	});

	it("forces SSR bundling of the ESM-only deps", () => {
		const p = caThemePlugin();
		expect(call(p.config, {})).toEqual({
			ssr: { noExternal: ["@tanstack/svelte-table", "@tanstack/table-core", "shiki"] },
		});
		expect(p.enforce).toBe("pre");
	});

	it("injects the head in plain Vite html, once", () => {
		const p = caThemePlugin({ defaultPreset: "ocean" });
		call(p.configResolved, {}, { root, command: "serve", plugins: [] });
		const out = call(p.transformIndexHtml, {}, "<html><head></head></html>") as string;
		expect(out).toContain(`id="${CA_THEME_MARKER}"`);
		expect(out).toContain('"ocean"');
		expect(call(p.transformIndexHtml, {}, out)).toBe(out);
	});

	it("drops transformIndexHtml inside SvelteKit apps", () => {
		const p = caThemePlugin();
		call(
			p.configResolved,
			{},
			{ root, command: "serve", plugins: [{ name: "vite-plugin-sveltekit-setup" }] }
		);
		expect(p.transformIndexHtml).toBeUndefined();
	});

	it("warns on build when neither hooks.server nor app.html inject the theme", () => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		writeFileSync(join(root, "src", "app.html"), "<html><head></head></html>");
		const p = caThemePlugin();
		call(p.configResolved, {}, { root, command: "build", plugins: [] });
		call(p.buildStart, {});
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain("FOUC warning");
	});

	it.each([
		["hooks.server.ts", "export const handle = sequence(caThemeHandle());"],
		["app.html", `<head><script id="${CA_THEME_MARKER}"></script></head>`],
	])("stays silent when %s already injects the theme", (file, body) => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		writeFileSync(join(root, "src", file), body);
		const p = caThemePlugin();
		call(p.configResolved, {}, { root, command: "build", plugins: [] });
		call(p.buildStart, {});
		expect(warn).not.toHaveBeenCalled();
	});

	it("does not warn in dev", () => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		writeFileSync(join(root, "src", "app.html"), "<head></head>");
		const p = caThemePlugin();
		call(p.configResolved, {}, { root, command: "serve", plugins: [] });
		call(p.buildStart, {});
		expect(warn).not.toHaveBeenCalled();
	});

	it("CA_THEME_SCRIPT_TAG wraps THEME_SCRIPT with the marker id", () => {
		expect(CA_THEME_SCRIPT_TAG).toBe(`<script id="${CA_THEME_MARKER}">${THEME_SCRIPT}</script>`);
	});
});

describe("caErrorPlugin", () => {
	let root: string;
	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "ca-err-"));
		spyOn(console, "info").mockImplementation(() => {});
	});
	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
		jest.restoreAllMocks();
	});

	it("warns (without writing) when +error.svelte is missing", () => {
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		const p = caErrorPlugin({ root });
		call(p.buildStart, {});
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain("No +error.svelte");
		expect(() => readFileSync(join(root, "src/routes/+error.svelte"))).toThrow();
	});

	it("scaffolds +error.svelte and error.html from templates when asked", () => {
		const p = caErrorPlugin({ root, scaffold: true });
		call(p.buildStart, {});
		expect(readFileSync(join(root, "src/error.html"), "utf8").length).toBeGreaterThan(0);
	});

	it("never overwrites an existing +error.svelte", () => {
		mkdirSync(join(root, "src/routes"), { recursive: true });
		writeFileSync(join(root, "src/routes/+error.svelte"), "mine");
		const warn = spyOn(console, "warn").mockImplementation(() => {});
		call(caErrorPlugin({ root, scaffold: true }).buildStart, {});
		expect(readFileSync(join(root, "src/routes/+error.svelte"), "utf8")).toBe("mine");
		expect(warn).not.toHaveBeenCalled();
	});

	it("skips error.html when scaffoldErrorHtml is false", () => {
		call(caErrorPlugin({ root, scaffold: true, scaffoldErrorHtml: false }).buildStart, {});
		expect(() => readFileSync(join(root, "src/error.html"))).toThrow();
	});
});
