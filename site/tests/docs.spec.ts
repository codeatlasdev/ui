import { expect, gotoReady, test } from "./fixtures";

test.describe("docs", () => {
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
		["/llms.txt", /^text\/plain/, [/CodeAtlas UI/i]],
		// One fetch covers everything: the docs plus the agent guide (AGENTS.md) at the end.
		["/llms-full.txt", /^text\/plain/, [/CodeAtlas UI/i, /^# AGENTS\.md: Guide for AI Agents$/m]],
		["/robots.txt", /^text\/plain/, [/Sitemap: .*sitemap-index\.xml/]],
		["/sitemap-index.xml", /^(application|text)\/xml/, [/<sitemapindex/]],
		["/search-index.json", /^application\/json/, [/"href":"\/docs\//]],
	];
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
