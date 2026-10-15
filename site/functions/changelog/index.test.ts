import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { onRequestGet, onRequestHead } from "./index";

const SHELL = "<html><body><!--CHANGELOG--><p>BUILD COPY</p><!--/CHANGELOG--></body></html>";
const store = new Map<string, Response>();
const cache = {
	match: async (k: Request | string) => store.get(typeof k === "string" ? k : k.url)?.clone(),
	put: async (k: Request | string, v: Response) =>
		void store.set(typeof k === "string" ? k : k.url, v.clone()),
};
const realFetch = globalThis.fetch;
let down = false;

const run = (url = "https://ui.codeatlas.com.br/changelog/", shell = SHELL) =>
	onRequestGet({
		request: new Request(url),
		next: async () => new Response(shell),
		env: {},
	} as unknown as Parameters<typeof onRequestGet>[0]);

beforeEach(() => {
	store.clear();
	down = false;
	(globalThis as unknown as { caches: unknown }).caches = { open: async () => cache };
	globalThis.fetch = (async () => {
		if (down) throw new Error("GitHub is down");
		return Response.json([
			{ tag_name: "@codeatlasdev/ui@9.9.9", body: "- shiny", published_at: "2026-10-15T00:00:00Z" },
		]);
	}) as unknown as typeof fetch;
});
afterEach(() => {
	globalThis.fetch = realFetch;
});

describe("GET /changelog/", () => {
	test("swaps the build copy for the releases GitHub lists, keeping the shell around it", async () => {
		const res = await run();
		const html = await res.text();
		expect(html).toContain('id="v9-9-9"');
		expect(html).not.toContain("BUILD COPY");
		expect(html.startsWith("<html><body>")).toBe(true);
		expect(res.headers.get("x-changelog-latest")).toBe("9.9.9");
		expect(res.headers.get("x-changelog-source")).toBe("github-releases");
	});
	test("GitHub down and nothing cached: the build copy is served untouched", async () => {
		down = true;
		const res = await run();
		expect(await res.text()).toBe(SHELL);
		expect(res.headers.get("x-changelog-source")).toBe("stale-last-good");
	});
	test("GitHub down after a good fetch: the last good releases, with the stale notice", async () => {
		await run();
		store.delete("https://cache.invalid/releases");
		down = true;
		const html = await (await run()).text();
		expect(html).toContain('id="v9-9-9"');
		expect(html).toContain("last copy we fetched");
	});
	test("a shell without the markers is served as is", async () => {
		expect(await (await run(undefined, "<p>x</p>")).text()).toBe("<p>x</p>");
	});
});

describe("HEAD /changelog/", () => {
	test("reports the live source like GET (the asset is read as GET, not as an empty HEAD body)", async () => {
		const res = await onRequestHead({
			request: new Request("https://ui.codeatlas.com.br/changelog/", { method: "HEAD" }),
			next: async (input?: Request) => new Response(input?.method === "GET" ? SHELL : ""),
			env: {},
		} as unknown as Parameters<typeof onRequestHead>[0]);
		expect(res.headers.get("x-changelog-source")).toBe("github-releases");
	});
});
