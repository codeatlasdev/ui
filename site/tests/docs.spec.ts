import { expect, gotoReady, test } from "./fixtures";

test.describe("docs", () => {
	test("the sidebar keeps its place across page loads", async ({ page, isMobile }) => {
		test.skip(isMobile, "the sidebar lives in a Sheet on phones");
		// Sidebar scroll as soon as the parser reaches the content after it, before the island
		// hydrates: what the reader sees on the first frame, not after a visible jump.
		await page.addInitScript(() => {
			new MutationObserver((_, observer) => {
				const aside = document.querySelector(".ca-docs-sidebar");
				if (!aside || !document.querySelector(".ca-docs-main")) return;
				observer.disconnect();
				(window as unknown as { parsedScroll: number }).parsedScroll = aside.scrollTop;
			}).observe(document, { childList: true, subtree: true });
		});
		await gotoReady(page, "/docs/getting-started/theming/");
		const sidebar = page.locator(".ca-docs-sidebar");
		await sidebar.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
		});
		const link = sidebar.locator("a.ca-docs-nav__link").last();
		const href = (await link.getAttribute("href")) as string;
		const scrolled = await sidebar.evaluate((el) => el.scrollTop);
		expect(scrolled).toBeGreaterThan(0);
		await link.click();
		await expect(page).toHaveURL(new RegExp(`${href}$`));
		const current = sidebar.locator(`a[href="${href}"]`);
		await expect(current).toHaveAttribute("aria-current", "page");
		await expect(current).toBeInViewport();
		expect(
			await page.evaluate(() => (window as unknown as { parsedScroll: number }).parsedScroll)
		).toBe(scrolled);
	});

	test("demo blocks carry their catalog number", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/button/");
		const demo = page.locator("section.demo", {
			has: page.getByRole("heading", { name: "Full width" }),
		});
		await expect(demo.locator(".sk-page__num")).toHaveText("#001");
		await expect(page.getByRole("link", { name: "Reference #001" })).toHaveAttribute(
			"href",
			"/api/v1/en/e/001.txt"
		);
	});

	test("every sidebar link resolves with 200", async ({ page, request }) => {
		await gotoReady(page, "/docs/inputs/button/");
		const hrefs = await page
			.locator(".ca-docs-nav a[href]")
			.evaluateAll((els) => [
				...new Set(els.map((a) => (a as HTMLAnchorElement).getAttribute("href") as string)),
			]);
		expect(hrefs.length).toBeGreaterThan(50);
		for (const href of hrefs) {
			const res = await request.get(href);
			expect(res.status(), href).toBe(200);
		}
	});

	test("InstallPrompt demos hydrate and show their banner", async ({ page }) => {
		// Both render nothing on the server: without a box of their own the client:visible
		// islands never intersected and the demos stayed empty.
		await gotoReady(page, "/docs/feedback/install-prompt/");
		const banners = page.locator("main .ca-install");
		await expect(banners).toHaveCount(2);
		await expect(page.getByRole("button", { name: "Install", exact: true })).toBeVisible();
		await expect(page.getByText('Choose "Add to Home Screen".')).toBeVisible();
	});

	test("search: opens, finds Button, Enter navigates", async ({ page, isMobile }) => {
		await gotoReady(page, "/docs/");
		if (isMobile) {
			// Touch has no Mod+K; the header search button is the real entry point. The field is only
			// auto-focused when the keyboard was primed by the tap (a deliberate iOS/Android guard).
			await page
				.getByRole("button", { name: /search/i })
				.first()
				.click();
		} else {
			await page.keyboard.press("ControlOrMeta+k");
		}
		const input = page.getByRole("combobox", { name: /search/i });
		await expect(input).toBeVisible();
		if (isMobile) await input.click();
		else await expect(input).toBeFocused();
		await page.keyboard.type("Button");
		const first = page.getByRole("option").first();
		await expect(first).toBeVisible();
		await expect(first).toContainText(/button/i);
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/\/docs\/[a-z-]+\/[a-z-]+\/?(#.*)?$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("pages link to previous and next", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/button/");
		const pager = page.getByRole("navigation", { name: "Pagination" });
		await expect(pager.locator('a[rel="prev"]')).toHaveCount(1);
		await expect(pager.locator('a[rel="next"]')).toHaveCount(1);
		const next = await pager.locator('a[rel="next"]').getAttribute("href");
		await pager.locator('a[rel="next"]').click();
		await expect(page).toHaveURL(new RegExp(`${next}$`));
		await expect(
			page.getByRole("navigation", { name: "Pagination" }).locator('a[rel="prev"]')
		).toHaveCount(1);
	});

	test("first page has next only, the last page has previous only", async ({ page }) => {
		await page.goto("/docs/");
		const pager = page.getByRole("navigation", { name: "Pagination" });
		await expect(pager.locator('a[rel="prev"]')).toHaveCount(0);
		await expect(pager.locator('a[rel="next"]')).toHaveCount(1);
	});

	const endpoints: [string, RegExp, RegExp[]][] = [
		[
			"/llms.txt",
			/^text\/plain/,
			[
				/CodeAtlas UI/i,
				/^## Start here: build a screen$/m,
				/\/docs\/getting-started\/recipes\/#list-page/,
			],
		],
		// One fetch covers every page; the demo sources live in /llms/<slug>.txt, linked from each page.
		[
			"/llms-full.txt",
			/^text\/plain/,
			[
				/^# CodeAtlas UI: full documentation$/m,
				/Index: https:\/\/ui\.codeatlas\.com\.br\/llms\.txt/,
				/^Complete page with demo sources: https:\/\/ui\.codeatlas\.com\.br\/llms\/layout\/form-page\.txt$/m,
				/^# Using @codeatlasdev\/ui in this app$/m,
			],
		],
		[
			"/llms/layout/form-page.txt",
			/^text\/plain/,
			[/^# AppForm$/m, /```svelte\n<script lang="ts">/],
		],
		[
			"/api/v1/index.json",
			/^application\/json/,
			[/"entry": "https:\/\/ui\.codeatlas\.com\.br\/llms\.txt"/],
		],
		["/robots.txt", /^text\/plain/, [/Sitemap: .*sitemap-index\.xml/]],
		["/sitemap-index.xml", /^(application|text)\/xml/, [/<sitemapindex/]],
		["/search-index.json", /^application\/json/, [/"href":"\/docs\//]],
	];
	test("a page listed in llms-full.txt has its own file with the demo source", async ({
		request,
	}) => {
		const full = await (await request.get("/llms-full.txt")).text();
		const links = [...full.matchAll(/^Complete page with demo sources: (\S+)$/gm)].map((m) => m[1]);
		expect(links.length).toBeGreaterThan(100);
		for (const url of [links[0], links[links.length >> 1], links.at(-1) as string]) {
			const res = await request.get(new URL(url).pathname);
			expect(res.status(), url).toBe(200);
		}
	});

	test("an unknown path under /api/v1/ is a 404, not the home page", async ({ request }) => {
		const res = await request.get("/api/v1/components.json");
		expect(res.status()).toBe(404);
	});

	for (const [path, type, bodies] of endpoints) {
		test(`${path} is served`, async ({ request }) => {
			const res = await request.get(path);
			expect(res.status()).toBe(200);
			expect(res.headers()["content-type"]).toMatch(type);
			const text = await res.text();
			for (const body of bodies) expect(text).toMatch(body);
		});
	}
});
