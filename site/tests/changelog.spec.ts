import { expect, gotoReady, test } from "./fixtures";

// `astro preview` serves the static build, so this is the build-time fallback body (packages/ui/CHANGELOG.md).
// The edge function that swaps it for live GitHub Releases is covered by site/functions/**/*.test.ts and wrangler.
test.describe("changelog", () => {
	test("lists every released version with its anchor, newest first", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();
		const ids = await page.locator("section.ca-release").evaluateAll((els) => els.map((e) => e.id));
		expect(ids.slice(0, 2)).toEqual(["v3-0-0", "v2-3-2"]);
		expect(ids).toContain("v2-3-1");
		for (const id of ["v3-0-0", "v2-3-2"]) {
			await expect(page.locator(`#${id} > h2 a`)).toHaveAttribute("href", `#${id}`);
			await expect(page.locator(`.ca-release-jump a[href="#${id}"]`)).toBeVisible();
		}
	});

	test("each release shows its channel and links to npm and GitHub", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		const release = page.locator("#v3-0-0");
		await expect(release.locator(".ca-chip")).toHaveText("latest");
		await expect(release.getByRole("link", { name: "npm" })).toHaveAttribute(
			"href",
			"https://www.npmjs.com/package/@codeatlasdev/ui/v/3.0.0"
		);
		await expect(release.getByRole("link", { name: "GitHub release" })).toHaveAttribute(
			"href",
			/github\.com\/codeatlasdev\/ui\/releases\/tag\//
		);
	});

	test("jumping to a version lands on its section", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		await page.locator('.ca-release-jump a[href="#v2-3-2"]').click();
		await expect(page).toHaveURL(/#v2-3-2$/);
		await expect(page.locator("#v2-3-2")).toBeInViewport();
	});

	test("closes with the special thanks, once", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		await expect(page.getByRole("heading", { name: "Special thanks" })).toHaveCount(1);
		await expect(page.locator(".ca-release-thanks")).toContainText("Fábio Henrique Araújo");
	});

	test("is discoverable: nav link, canonical, feed and structured data", async ({ page }) => {
		await gotoReady(page, "/changelog/");
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ui.codeatlas.com.br/changelog/"
		);
		await expect(page.locator('link[type="application/atom+xml"]')).toHaveAttribute(
			"href",
			"/changelog/feed.xml"
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			/\/brand\/og\/changelog\.[0-9a-f]+\.png$/
		);
		expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
			"BreadcrumbList"
		);
		await expect(page.locator(".ca-docs-sections a[aria-current=page]")).toHaveText("Changelog");
	});
});
