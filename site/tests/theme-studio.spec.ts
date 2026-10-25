import { expect, gotoReady, test } from "./fixtures";

// One route, one scheme, desktop only: the studio's behavior, not the whole screen matrix.
test.describe("theme studio", () => {
	test.skip(({ isMobile }) => isMobile, "desktop layout; the mobile sheet has its own check");

	const brandField = (page: import("@playwright/test").Page) =>
		page.getByRole("textbox", { name: "Brand color", exact: true });
	const cssVar = (page: import("@playwright/test").Page, selector: string, name: string) =>
		page.locator(selector).evaluate((e, n) => getComputedStyle(e).getPropertyValue(n).trim(), name);

	test("a brand change shows in the preview and the code, never on the page", async ({ page }) => {
		await gotoReady(page, "/theme/");
		const island = '[data-testid="te-island"]';
		const before = await cssVar(page, island, "--ca-brand-main");
		const pageBefore = await cssVar(page, "html", "--ca-brand-main");

		await brandField(page).fill("#e8590c");
		await brandField(page).press("Enter");

		await expect.poll(() => cssVar(page, island, "--ca-brand-main")).not.toBe(before);
		await expect(page.getByRole("region", { name: "Code" })).toContainText("#e8590c");
		expect(await cssVar(page, "html", "--ca-brand-main")).toBe(pageBefore);
	});

	test("the share URL restores the editor", async ({ page, context }) => {
		await gotoReady(page, "/theme/");
		await brandField(page).fill("#16a34a");
		await brandField(page).press("Enter");
		await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#t=v1\./);
		const url = page.url();

		// A fresh context has no stored editor state: only the URL can restore the brand.
		const fresh = await context.browser()?.newContext({ colorScheme: "dark" });
		if (!fresh) throw new Error("no browser");
		const other = await fresh.newPage();
		await gotoReady(other, new URL(url).pathname + new URL(url).hash);
		await expect(brandField(other)).toHaveValue("#16a34a");
		await fresh.close();
	});

	test("apply to site persists across navigation and resets to sketchbook", async ({ page }) => {
		await gotoReady(page, "/theme/#t=v1.eyJicmFuZCI6IiNlODU5MGMiLCJyYWRpdXMiOjEuNH0");
		const siteBrand = () => cssVar(page, "html", "--ca-brand-main");
		const original = await siteBrand();

		await page.getByRole("switch", { name: "Apply to the whole site" }).click();
		await expect.poll(siteBrand).not.toBe(original);
		const applied = await siteBrand();

		await gotoReady(page, "/docs/inputs/color-field/");
		expect(await siteBrand()).toBe(applied);

		await gotoReady(page, "/theme/");
		await page.getByRole("button", { name: "Reset to sketchbook" }).click();
		await expect.poll(siteBrand).toBe(original);
		expect(await page.evaluate(() => localStorage.getItem("ca-site-studio"))).toBeNull();
	});

	test("a slider moves from the keyboard, lands in the code, and undo reverts it", async ({
		page,
	}) => {
		await gotoReady(page, "/theme/");
		await page.getByRole("button", { name: "Shape" }).click();
		const radius = page.getByRole("slider", { name: "Corner radius" });
		await radius.focus();
		for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");

		const code = page.getByRole("region", { name: "Code" });
		await expect(code).toContainText("radius: 1");
		await page.getByRole("button", { name: "Undo" }).click();
		await expect(code).not.toContainText("radius: 1");
		await page.getByRole("button", { name: "Redo" }).click();
		await expect(code).toContainText("radius: 1");
	});

	test("the landing hero fits a 390px frame and charts use the island's brand", async ({
		page,
	}) => {
		await gotoReady(page, "/theme/#t=v1.eyJicmFuZCI6IiM3YzNhZWQifQ");
		const island = page.locator('[data-testid="te-island"]');
		// Dashboard charts are canvas: they must read the island's violet, not the page's blue.
		await expect(island.locator("canvas").first()).toBeVisible();
		const brand = await island.evaluate((e) =>
			getComputedStyle(e).getPropertyValue("--ca-brand-main").trim()
		);
		const pageBrand = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue("--ca-brand-main").trim()
		);
		expect(brand).not.toBe(pageBrand);

		await page.getByRole("button", { name: /Preview screen/ }).click();
		await page.getByRole("option", { name: "Landing" }).click();
		await page.getByRole("radio", { name: "390" }).click();
		const heading = island.locator(".ca-heading--display");
		await expect(heading).toBeVisible();
		const fits = await island.evaluate((e) => e.scrollWidth <= e.clientWidth);
		expect(fits).toBe(true);
		const box = await heading.boundingBox();
		expect(box?.width ?? 999).toBeLessThanOrEqual(390);
	});
});
