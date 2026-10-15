import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CACHE_CONTROL, loadReleases, TTL } from "./edge";

// In-memory Cache API + scripted GitHub, so the freshness and outage rules are tested without a network.
const store = new Map<string, Response>();
const fakeCache = {
	match: async (k: Request | string) => store.get(typeof k === "string" ? k : k.url)?.clone(),
	put: async (k: Request | string, v: Response) =>
		void store.set(typeof k === "string" ? k : k.url, v.clone()),
};
const realFetch = globalThis.fetch;
let down = false;
let calls = 0;
let seen: Request[] = [];
let payload: unknown[] = [];

const rel = (v: string, extra: Record<string, unknown> = {}) => ({
	tag_name: `@codeatlasdev/ui@${v}`,
	body: `- ${v}`,
	draft: false,
	prerelease: v.includes("-"),
	published_at: "2026-10-12T10:00:00Z",
	...extra,
});

beforeEach(() => {
	store.clear();
	down = false;
	calls = 0;
	seen = [];
	payload = [rel("3.0.0"), rel("2.3.2")];
	(globalThis as unknown as { caches: unknown }).caches = { open: async () => fakeCache };
	globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
		calls++;
		seen.push(new Request(String(url instanceof Request ? url.url : url), init));
		if (down) throw new Error("GitHub is down");
		return Response.json(payload);
	}) as unknown as typeof fetch;
});
afterEach(() => {
	globalThis.fetch = realFetch;
});

describe("loadReleases", () => {
	test("reads the releases of codeatlasdev/ui and keeps only @codeatlasdev/ui@ tags", async () => {
		payload = [rel("3.0.0"), { ...rel("1.0.0"), tag_name: "v1.0.0" }];
		const r = await loadReleases();
		expect(r.stale).toBe(false);
		expect(r.releases.map((x) => x.version)).toEqual(["3.0.0"]);
		expect(seen[0].url).toContain(
			"https://api.github.com/repos/codeatlasdev/ui/releases?per_page=100"
		);
	});
	test("a cached answer is reused inside the TTL (no extra GitHub calls)", async () => {
		await loadReleases();
		const before = calls;
		await loadReleases();
		expect(calls).toBe(before);
	});
	test("?fresh skips the cache: a new release shows immediately", async () => {
		await loadReleases();
		payload = [rel("3.1.0"), ...payload];
		expect((await loadReleases()).releases[0].version).toBe("3.0.0");
		expect((await loadReleases({ fresh: true })).releases[0].version).toBe("3.1.0");
	});
	test("GitHub down: serves the last good copy, flagged stale", async () => {
		await loadReleases();
		store.delete("https://cache.invalid/releases");
		down = true;
		const r = await loadReleases();
		expect(r.stale).toBe(true);
		expect(r.releases[0].version).toBe("3.0.0");
	});
	test("GitHub down and nothing cached: the error surfaces (the page falls back to its built body)", async () => {
		down = true;
		await expect(loadReleases()).rejects.toThrow();
	});
	test("a non-200 answer (rate limit) counts as down", async () => {
		await loadReleases();
		store.delete("https://cache.invalid/releases");
		globalThis.fetch = (async () =>
			new Response("rate limited", { status: 403 })) as unknown as typeof fetch;
		expect((await loadReleases()).stale).toBe(true);
	});
	test("a token, when configured, is sent as a bearer", async () => {
		await loadReleases({ token: "t0k" });
		expect(seen[0].headers.get("authorization")).toBe("Bearer t0k");
		store.clear();
		await loadReleases();
		expect(seen.at(-1)?.headers.get("authorization")).toBeNull();
	});
	test("an empty list is an error, never an empty page", async () => {
		payload = [];
		await expect(loadReleases()).rejects.toThrow("no published release");
	});
});

describe("CACHE_CONTROL", () => {
	test("a minute fresh, long stale-while-revalidate", () => {
		expect(TTL).toBe(60);
		expect(CACHE_CONTROL).toContain("s-maxage=60");
		expect(CACHE_CONTROL).toContain("stale-while-revalidate");
	});
});
