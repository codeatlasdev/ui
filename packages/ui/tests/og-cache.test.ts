import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evict, STORES, type Store } from "../../../scripts/caches";
import { cardKey, placeCard } from "../../../site/scripts/og-cache";
import { cleanTmp, tmpDir } from "./tmp";

// The site build renders ~880 social cards (63 s of a 135 s build). The land gate rebuilds the site after every
// rebase, so the cards are cached outside `dist` by what they are made of: a hit must be byte-identical to a
// render, and nothing that changes a pixel may hit.
afterAll(cleanTmp);

const render = (calls: string[]) => async (html: string) => {
	calls.push(html);
	return new TextEncoder().encode(`png:${html}`);
};

describe("og card cache", () => {
	it("renders a card once, then serves the same bytes from the cache", async () => {
		const dir = tmpDir("ca-og-");
		const calls: string[] = [];
		const first = join(dir, "dist-1/a.png");
		const second = join(dir, "dist-2/a.png");

		expect(
			await placeCard(join(dir, "cache"), "chromium-1", "<h1>A</h1>", first, render(calls))
		).toBe(false);
		// the next build starts from an empty dist
		expect(
			await placeCard(join(dir, "cache"), "chromium-1", "<h1>A</h1>", second, render(calls))
		).toBe(true);

		expect(calls).toEqual(["<h1>A</h1>"]);
		expect(readFileSync(second, "utf8")).toBe(readFileSync(first, "utf8"));
	});

	it("a changed card or a new browser renders again", async () => {
		const dir = tmpDir("ca-og-");
		const cache = join(dir, "cache");
		const calls: string[] = [];
		await placeCard(cache, "chromium-1", "<h1>A</h1>", join(dir, "a.png"), render(calls));
		await placeCard(cache, "chromium-1", "<h1>B</h1>", join(dir, "b.png"), render(calls));
		await placeCard(cache, "chromium-2", "<h1>A</h1>", join(dir, "c.png"), render(calls));
		expect(calls).toEqual(["<h1>A</h1>", "<h1>B</h1>", "<h1>A</h1>"]);
		expect(readFileSync(join(dir, "b.png"), "utf8")).toBe("png:<h1>B</h1>");
	});

	it("a render that throws leaves nothing in the cache and nothing in dist", async () => {
		const dir = tmpDir("ca-og-");
		const cache = join(dir, "cache");
		const target = join(dir, "dist/a.png");
		await expect(
			placeCard(cache, "chromium-1", "<h1>A</h1>", target, async () => {
				throw new Error("browser died");
			})
		).rejects.toThrow("browser died");
		expect(existsSync(target)).toBe(false);
		expect(existsSync(join(cache, `${cardKey("chromium-1", "<h1>A</h1>")}.png`))).toBe(false);
	});

	it("the key separates the browser from the markup", () => {
		expect(cardKey("ab", "c")).not.toBe(cardKey("a", "bc"));
	});
});

describe("og card cache pruning", () => {
	const DAY = 86_400_000;
	const age = (path: string, days: number) => {
		const t = new Date(Date.now() - days * DAY);
		utimesSync(path, t, t);
	};
	// the store the build prunes with (scripts/caches.ts), pointed at a scratch directory
	const store = (dir: string): Store => ({
		...(STORES.find((s) => s.name === "og cards") as Store),
		dir,
	});

	it("drops cards unused for longer than the limit and keeps the rest", async () => {
		const dir = tmpDir("ca-og-");
		const cache = join(dir, "cache");
		const png = async () => new Uint8Array([1]);
		await placeCard(cache, "v", "old", join(dir, "o.png"), png);
		await placeCard(cache, "v", "new", join(dir, "n.png"), png);
		age(join(cache, `${cardKey("v", "old")}.png`), 40);

		expect(evict(store(cache)).removed).toBe(1);
		expect(readdirSync(cache)).toEqual([`${cardKey("v", "new")}.png`]);
	});

	it("a card served again counts as used, however old it was made", async () => {
		const dir = tmpDir("ca-og-");
		const cache = join(dir, "cache");
		const png = async () => new Uint8Array([1]);
		await placeCard(cache, "v", "card", join(dir, "a.png"), png);
		age(join(cache, `${cardKey("v", "card")}.png`), 40);
		await placeCard(cache, "v", "card", join(dir, "b.png"), png);

		expect(evict(store(cache)).removed).toBe(0);
	});

	it("leaves files that are not cards alone, and a missing directory is fine", () => {
		const dir = tmpDir("ca-og-");
		writeFileSync(join(dir, "notes.txt"), "x");
		age(join(dir, "notes.txt"), 400);
		expect(evict(store(dir)).removed).toBe(0);
		expect(existsSync(join(dir, "notes.txt"))).toBe(true);
		expect(evict(store(join(dir, "missing"))).removed).toBe(0);
	});
});
