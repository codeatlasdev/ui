import { once } from "node:events";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, gotoReady, test } from "./fixtures";
import { DIST } from "./routes";

// Zero flash of the wrong theme. The owner's two reports, measured on a slow device and a slow link:
//  1. `/theme/#t=v1.<state>` painted the default theme, then the shared one.
//  2. After "Apply to site" every page painted the original theme, then the visitor's.
// A frame counts once the browser has painted something (first-paint); from then on, every frame must
// already wear the target theme. The recorder runs in the page (rAF), so it sees what the compositor sees.

const KEY = "ca-site-studio";
/** 6x CPU slowdown and "Slow 3G" (400 kbit/s, 400 ms RTT): where a late script shows as a visible flash. */
const SLOW_3G = {
	latency: 400,
	downloadThroughput: (400 * 1024) / 8,
	uploadThroughput: (400 * 1024) / 8,
};
const SHARE = "#t=v1.eyJicmFuZCI6IiNlODU5MGMiLCJyYWRpdXMiOjEuNH0";
const FRAMES = join(process.cwd(), "..", ".cache", "noflash");

interface Frame {
	t: number;
	brand: string;
	island: string | null;
	skeleton: boolean;
}

/** What the recorder (an init script) keeps on the page. */
interface Recorder {
	__f: Frame[];
	__cls: number;
	/** What shifted, kept so a failing CLS assertion names the elements instead of a bare number. */
	__shifts: string[];
	__painted: boolean;
}
interface ShiftSource {
	node?: Element;
	previousRect: DOMRect;
	currentRect: DOMRect;
}
interface ShiftEntry extends PerformanceEntry {
	value: number;
	hadRecentInput: boolean;
	sources: ShiftSource[];
}

async function throttle(page: Page) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
	await cdp.send("Network.enable");
	await cdp.send("Network.emulateNetworkConditions", { offline: false, ...SLOW_3G });
}

/** Records, every animation frame, the page's and the preview island's brand colour and the layout shifts. */
async function record(page: Page) {
	await page.addInitScript(() => {
		const w: Window & Partial<Recorder> = window;
		w.__f = [];
		w.__cls = 0;
		w.__shifts = [];
		w.__painted = false;
		new PerformanceObserver((l) => {
			for (const e of l.getEntries()) if (e.name === "first-paint") w.__painted = true;
		}).observe({ type: "paint", buffered: true });
		new PerformanceObserver((l) => {
			for (const e of l.getEntries() as ShiftEntry[]) {
				// Until the document is parsed, the page is still arriving (780 KB at 6x CPU lays out as it
				// streams in): that is loading, not a flash. What hydration or a late script does after it is.
				const nav = performance.getEntriesByType("navigation")[0] as
					| PerformanceNavigationTiming
					| undefined;
				const parsedAt = nav?.domContentLoadedEventStart ?? 0;
				if (e.hadRecentInput || parsedAt === 0 || e.startTime < parsedAt) continue;
				w.__cls = (w.__cls ?? 0) + e.value;
				const rect = (r: DOMRect) =>
					`${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
				for (const x of e.sources)
					w.__shifts?.push(
						`${e.value.toFixed(4)} @${Math.round(e.startTime)}ms ${x.node?.nodeName}.${String(x.node?.className).slice(0, 30)} ${rect(x.previousRect)} -> ${rect(x.currentRect)}`
					);
			}
		}).observe({ type: "layout-shift", buffered: true });
		const tick = () => {
			if (w.__painted && w.__f) {
				const brand = (el: Element) =>
					getComputedStyle(el).getPropertyValue("--ca-brand-main").trim();
				const el = document.querySelector('[data-testid="te-island"]');
				// A hidden preview paints nothing: it is not a frame of the wrong theme.
				const island = el && getComputedStyle(el).visibility !== "hidden" ? el : null;
				w.__f.push({
					t: Math.round(performance.now()),
					brand: brand(document.documentElement),
					island: island ? brand(island) : null,
					skeleton: !!document.querySelector("[aria-busy='true'], .ca-skeleton"),
				});
			}
			if ((w.__f?.length ?? 0) < 600) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}

const frames = (page: Page): Promise<Frame[]> =>
	page.evaluate(() => {
		const w: Window & Partial<Recorder> = window;
		return w.__f ?? [];
	});
const shifts = (page: Page): Promise<string[]> =>
	page.evaluate(() => {
		const w: Window & Partial<Recorder> = window;
		return w.__shifts ?? [];
	});
const cls = (page: Page): Promise<number> =>
	page.evaluate(() => {
		const w: Window & Partial<Recorder> = window;
		return w.__cls ?? 0;
	});

/** The distinct (page brand, island brand) pairs in order, so a failure reads as the sequence of looks. */
const looks = (f: Frame[]) =>
	f.map((x) => `${x.brand} | ${x.island ?? "-"}`).filter((v, i, a) => v !== a[i - 1]);

async function shot(page: Page, name: string) {
	mkdirSync(FRAMES, { recursive: true });
	writeFileSync(join(FRAMES, `${name}.png`), await page.screenshot());
}

test.describe("no flash of the wrong theme", () => {
	test.skip(
		({ isMobile }) => isMobile,
		"one throttled desktop run: the mobile CPU is the 6x already"
	);
	test.setTimeout(180_000);

	/** The record the studio writes on "Apply to site", produced by the real UI once. */
	async function appliedRecord(page: Page) {
		await gotoReady(page, `/theme/${SHARE}`);
		await page.getByRole("switch", { name: "Apply to the whole site" }).click();
		await page.waitForFunction((k) => localStorage.getItem(k), KEY);
		return (await page.evaluate((k) => localStorage.getItem(k), KEY)) as string;
	}

	test("an applied visitor theme is on the first painted frame, with no layout shift", async ({
		page,
		browser,
	}) => {
		const rec = await appliedRecord(page);
		// The brand the page wears once everything settled: read from the page that applied it.
		const target = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--ca-brand-main").trim()
		);
		expect(target).toBeTruthy();

		const ctx = await browser.newContext({ colorScheme: "dark", locale: "pt-BR" });
		await ctx.addInitScript(
			([k, v]) => {
				if (!sessionStorage.getItem("__seeded")) {
					localStorage.setItem(k as string, v as string);
					sessionStorage.setItem("__seeded", "1");
				}
			},
			[KEY, rec]
		);
		const p = await ctx.newPage();
		await record(p);
		await throttle(p);
		await p.goto("/docs/inputs/color-field/", { waitUntil: "load" });
		await shot(p, "visitor-final");
		const f = await frames(p);
		expect(f.length, "the recorder saw painted frames").toBeGreaterThan(0);
		expect(looks(f), "every painted frame wears the visitor theme").toEqual([`${target} | -`]);
		expect(await cls(p), `layout shift after parse:\n${(await shifts(p)).join("\n")}`).toBeLessThan(
			0.001
		);
		await ctx.close();
	});

	test("the order matters: the same built page with its theme scripts late paints the wrong theme first", async ({
		page,
		browser,
	}) => {
		const rec = await appliedRecord(page);
		const target = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--ca-brand-main").trim()
		);
		// The reordered copy is served by a real server: `route.fulfill` bypasses the network throttle, so the
		// page would arrive whole and unthrottled and the order would not matter.
		const html = readFileSync(join(DIST, "docs/inputs/color-field/index.html"), "utf8");
		const moved = [
			...html.matchAll(
				/<script\b(?![^>]*\bsrc=)[^>]*>(?:(?!<\/script>)[\s\S])*?(__caTheme|__caSiteBoot|__caThemePersist)[\s\S]*?<\/script>/g
			),
		].map((m) => m[0]);
		expect(moved, "the build carries the three theme scripts").toHaveLength(3);
		const late = moved
			.reduce((h, m) => h.replace(m, ""), html)
			.replace("</body>", `${moved.join("")}</body>`);
		const origin = new URL(page.url()).origin;
		const server = createServer(async (req, res) => {
			if (req.url === "/docs/inputs/color-field/") {
				res.writeHead(200, { "content-type": "text/html" }).end(late);
				return;
			}
			const upstream = await fetch(origin + req.url);
			res.writeHead(upstream.status, {
				"content-type": upstream.headers.get("content-type") ?? "",
			});
			res.end(Buffer.from(await upstream.arrayBuffer()));
		}).listen(0);
		await once(server, "listening");
		const base = `http://localhost:${(server.address() as AddressInfo).port}`;
		const paint = async (url: string) => {
			const ctx = await browser.newContext({ colorScheme: "dark", locale: "pt-BR" });
			await ctx.addInitScript(
				([k, v]) => {
					if (!sessionStorage.getItem("__seeded")) {
						localStorage.setItem(k as string, v as string);
						sessionStorage.setItem("__seeded", "1");
					}
				},
				[KEY, rec]
			);
			const p = await ctx.newPage();
			await record(p);
			await throttle(p);
			await p.goto(url, { waitUntil: "load" });
			const seen = looks(await frames(p));
			await ctx.close();
			return seen;
		};
		const path = "/docs/inputs/color-field/";
		expect(await paint(path), "as built: one look, the visitor's").toEqual([`${target} | -`]);
		const seenLate = await paint(`${base}${path}`);
		server.close();
		expect(
			seenLate.length,
			`scripts late: the frames differ (${seenLate.join(" ; ")})`
		).toBeGreaterThan(1);
		expect(seenLate[0]).not.toBe(`${target} | -`);
	});

	/** Brand of the shared code, as the preview compiles it: read once from a settled load. */
	async function sharedBrand(page: Page) {
		await gotoReady(page, `/theme/${SHARE}`);
		return page
			.locator('[data-testid="te-island"]')
			.evaluate((e) => getComputedStyle(e).getPropertyValue("--ca-brand-main").trim());
	}

	test("a share URL never paints the preview in the default theme, cold or warm", async ({
		page,
		browser,
	}) => {
		const shared = await sharedBrand(page);
		expect(shared).toBeTruthy();

		// Cold: a browser that never saw this code has no compiled CSS for it; the preview must wait for
		// the studio (hidden, space reserved) instead of painting a look that is not the shared one.
		// Warm: the second visit replays the compiled CSS, so the preview is themed from the first frame.
		const ctx = await browser.newContext({ colorScheme: "dark", locale: "pt-BR" });
		for (const visit of ["cold", "warm"]) {
			const p = await ctx.newPage();
			await record(p);
			await throttle(p);
			await p.goto(`/theme/${SHARE}`, { waitUntil: "load" });
			await expect(p.locator('[data-testid="te-island"]')).toBeVisible();
			await expect(p.locator("html")).not.toHaveAttribute("data-ts-code", /.+/);
			await p.waitForTimeout(500);
			const f = await frames(p);
			expect(f.length, `${visit}: the recorder saw painted frames`).toBeGreaterThan(0);
			const seen = looks(f)
				.filter((l) => !l.endsWith("| -"))
				.map((l) => l.split(" | ")[1]);
			expect(seen, `${visit}: every visible preview frame is the shared theme`).toEqual([shared]);
			expect(
				f.some((x) => x.skeleton),
				`${visit}: no skeleton`
			).toBe(false);
			// Chrome reports sub-pixel width changes (the header's "Ctrl K" hint swaps its label by platform)
			// as 0.0000x; the budget is a thousandth, a hundred times under what a visible jump scores.
			expect(
				await cls(p),
				`${visit}: no layout shift after parse:\n${(await shifts(p)).join("\n")}`
			).toBeLessThan(0.001);
			await shot(p, `share-${visit}`);
			await p.close();
		}
		await ctx.close();
	});
});
