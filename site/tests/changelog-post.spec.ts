import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, gotoReady, test } from "./fixtures";
import { DIST } from "./routes";

const POST = "/changelog/4.6.0/";

// Layout, axe, console errors and 44px targets of both pages are audited by routes.spec.ts and routes.axe.spec.ts, which
// load every prerendered page once. This spec holds what is specific to the changelog: the structure, the no-JS render,
// the lazy islands, the before/after control and the agent and feed twins.
test.describe("changelog index", () => {
	test("opens with a card per release: hero, headline, highlights and counts", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		const card = page.locator('.rc[data-version="4.6.0"]');
		await expect(card.getByRole("link", { name: /Interfaces with soul/ })).toHaveAttribute(
			"href",
			POST
		);
		await expect(card.locator("svg[aria-hidden=true]")).toHaveCount(1); // the hero is decorative next to its own text
		await expect(card.locator("svg[role=img], svg title")).toHaveCount(0);
		await expect(card.locator(".rc__hl li")).toHaveCount(3);
		await expect(card.locator(".rc__counts")).toContainText("130");
		await expect(page.locator(".rc")).not.toHaveCount(1); // older releases get cards too
	});

	test("a release with no post still has a card and a page", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		const card = page.locator('.rc[data-version="4.5.0"]');
		await expect(card).toContainText("release notes");
		await card.getByRole("link").click();
		await expect(page).toHaveURL(/\/changelog\/4\.5\.0\/$/);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("@codeatlasdev/ui 4.5.0");
		await expect(page.locator("#changesets")).toBeVisible();
	});
});

test.describe("changelog 4.6.0", () => {
	test("has a hero, a tl;dr, one section per highlight and the upgrade block", async ({ page }) => {
		await gotoReady(page, POST);
		await expect(page.getByRole("heading", { level: 1 })).toContainText("Interfaces with soul");
		await expect(page.locator(".post__hero svg[role=img] title")).toHaveText(/4\.6\.0|release/i);
		const ids = await page.locator("section.post-sec").evaluateAll((els) => els.map((e) => e.id));
		expect(ids).toEqual([
			"theme-studio",
			"ui-index",
			"design-styles",
			"evidence",
			"sound",
			"inline-overlays",
			"modal-hover",
			"components",
			"tests",
			"security",
			"accessibility",
		]);
		await expect(page.locator(".post__tl li")).toHaveCount(ids.length);
		await expect(page.locator(".post__upgrade")).toContainText("bun add @codeatlasdev/ui@4.6.0");
		await expect(page.locator(".post__bh dt").first()).toBeVisible();
		await expect(page.locator(".post__all")).toContainText("130 merged pull requests");
	});

	test("every figure has an accessible name and a description", async ({ page }) => {
		await gotoReady(page, POST);
		const figs = page.locator("figure.fig svg[role=img]");
		expect(await figs.count()).toBeGreaterThanOrEqual(10);
		for (const svg of await figs.all()) {
			await expect(svg.locator("title")).not.toBeEmpty();
			await expect(svg.locator("desc")).not.toBeEmpty();
		}
	});

	test("every benchmark states its conditions", async ({ page }) => {
		await gotoReady(page, POST);
		const benches = page.locator("figure.bench");
		expect(await benches.count()).toBeGreaterThanOrEqual(3);
		for (const b of await benches.all())
			await expect(b.locator(".bench__cond")).toContainText("Conditions.");
	});

	test("the prerendered page is complete with JavaScript off", async ({ browser }) => {
		const ctx = await browser.newContext({ javaScriptEnabled: false });
		const page = await ctx.newPage();
		await page.goto(
			`http://localhost:${new URL(test.info().project.use.baseURL ?? "http://localhost").port}${POST}`
		);
		await expect(page.locator("section.post-sec")).toHaveCount(11);
		await expect(page.locator("figure.fig svg").first()).toBeVisible();
		await expect(page.locator("figure.bench").first()).toBeVisible();
		await expect(page.locator(".post__hero svg")).toBeVisible();
		await ctx.close();
	});

	test("live examples mount when they scroll into view, not before", async ({ page }) => {
		await page.goto(POST);
		const island = page.locator('astro-island[component-url*="InlineOverlay"]');
		await expect(island).toHaveAttribute("client", "visible");
		// Below the fold at load: still server-rendered markup, no JavaScript has run for it.
		await expect(island).toHaveAttribute("ssr", "");
		// The island is `display: contents` (no box of its own): scroll the frame that holds it.
		await page.locator("#inline-overlays .live").first().scrollIntoViewIfNeeded();
		await expect(island).not.toHaveAttribute("ssr", "", { timeout: 20_000 });
	});

	test("hydrating an island does not move the text below it", async ({ page }) => {
		await page.goto(POST);
		const island = page.locator('astro-island[component-url*="InlineOverlay"]');
		const frame = page.locator("#inline-overlays .live").first();
		const next = page.locator("#modal-hover");
		await frame.scrollIntoViewIfNeeded();
		// Measured before hydration (the island still has `ssr`) and after it, relative to the frame itself.
		const y = async (l: typeof next) => (await l.boundingBox())?.y ?? 0;
		const gapNow = async () => (await y(next)) - (await y(frame));
		const before = (await frame.boundingBox())?.height ?? 0;
		const gap = await gapNow();
		await expect(island).not.toHaveAttribute("ssr", "", { timeout: 15_000 });
		await expect(island.locator("button").first()).toBeVisible();
		const after = (await frame.boundingBox())?.height ?? 0;
		expect(Math.abs(after - before), `frame ${before} -> ${after}`).toBeLessThanOrEqual(2);
		expect(Math.abs((await gapNow()) - gap)).toBeLessThanOrEqual(2);
	});

	test("the before/after control switches without moving the page", async ({ page }) => {
		await gotoReady(page, POST);
		const cmp = page.locator('[data-cmp="trend"]');
		await cmp.scrollIntoViewIfNeeded();
		const stage = cmp.locator(".cmp__stage");
		const h1 = (await stage.boundingBox())?.height ?? 0;
		await cmp.locator('label[for="cmp-trend-before"]').click();
		await expect(cmp.locator(".cmp__pane--after")).toBeHidden();
		const h2 = (await stage.boundingBox())?.height ?? 0;
		expect(Math.abs(h2 - h1)).toBeLessThanOrEqual(1);
		await cmp.locator('label[for="cmp-trend-both"]').click();
		await expect(cmp.locator(".cmp__pane--before")).toBeVisible();
		await expect(cmp.locator(".cmp__pane--after")).toBeVisible();
	});

	test("is discoverable: canonical, article data, a card of its own and the agent twin", async ({
		page,
	}) => {
		await gotoReady(page, POST);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ui.codeatlas.com.br/changelog/4.6.0/"
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			/\/brand\/og\/changelog-4-6-0\.[0-9a-f]+\.png$/
		);
		await expect(
			page.locator('link[type="text/plain"][href="/llms/changelog/4.6.0.txt"]')
		).toHaveCount(1);
		const ld = await page.locator('script[type="application/ld+json"]').textContent();
		expect(ld).toContain("TechArticle");
		expect(ld).toContain("BreadcrumbList");
	});
});

test.describe("changelog at 390px", () => {
	test.skip(({ isMobile }) => !isMobile, "mobile-only");
	test("the post has no sideways scroll", async ({ page }) => {
		await gotoReady(page, POST);
		const over = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(over).toBeLessThanOrEqual(0);
	});
});

test.describe("changelog build output", () => {
	const dist = (p: string) => readFileSync(join(DIST, p), "utf8");
	test("posts.json carries the full 4.6.0 article for the feed", () => {
		const posts = JSON.parse(dist("changelog/posts.json")) as Record<
			string,
			{ headline: string; html: string }
		>;
		expect(posts["4.6.0"]?.headline).toContain("Interfaces with soul");
		expect(posts["4.6.0"]?.html).toContain('id="theme-studio"');
		expect(posts["4.6.0"]?.html).not.toContain("astro-island");
		expect(posts["4.5.0"]).toBeUndefined(); // no post, so the feed keeps the GitHub body
	});
	test("the agent twin keeps the numbers with their conditions", () => {
		const md = dist("llms/changelog/4.6.0.txt");
		expect(md).toContain("# @codeatlasdev/ui 4.6.0");
		expect(md).toContain("Conditions:");
		expect(md).toContain("## All changes");
		expect(dist("llms/changelog.txt")).toContain("/llms/changelog/4.6.0.txt");
	});
});
