import { expect, gotoReady, test } from "./fixtures";

test.describe("responsive (mobile)", () => {
	test.skip(({ isMobile }) => !isMobile, "mobile-only");

	test("admin template: BottomNav visible, rail hidden", async ({ page }) => {
		await gotoReady(page, "/templates/admin/dashboard/");
		await expect(page.locator(".ca-bottom-nav, nav[aria-label*='ottom' i]").first()).toBeVisible();
		await expect(page.locator(".ca-rail").first()).toBeHidden();
	});

	test("SimpleTable cards: rows are grids with data-label content", async ({ page }) => {
		await gotoReady(page, "/docs/display/table/");
		const row = page.locator("table.ca-table--cards tbody tr, .ca-table--cards tbody tr").first();
		await expect(row).toBeVisible();
		expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe("grid");
		const cell = row.locator("td[data-label]").first();
		const label = await cell.getAttribute("data-label");
		expect(label).toBeTruthy();
		expect(await cell.evaluate((el) => getComputedStyle(el, "::before").content)).toContain(
			label as string
		);
	});

	test("Dialog size=split is a single column", async ({ page }) => {
		await gotoReady(page, "/docs/feedback/dialog/");
		await page.getByRole("button", { name: "Open split" }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		const grid = dialog.locator(".ca-dialog__body").first();
		const cols = await grid.evaluate(
			(el) => getComputedStyle(el).gridTemplateColumns.split(" ").length
		);
		expect(cols).toBe(1);
	});

	test("touch targets are at least 44px", async ({ page }) => {
		await gotoReady(page, "/docs/inputs/button/");
		const lg = page.locator(".ca-btn--lg").first();
		await expect(lg).toBeVisible();
		expect((await lg.boundingBox())?.height).toBeGreaterThanOrEqual(44);

		const icon = page.locator(".ca-icon-btn, .ca-btn--icon").first();
		if (await icon.count()) expect((await icon.boundingBox())?.height).toBeGreaterThanOrEqual(44);

		await gotoReady(page, "/docs/navigation/tabs/");
		const tab = page.getByRole("tab").first();
		await expect(tab).toBeVisible();
		expect((await tab.boundingBox())?.height).toBeGreaterThanOrEqual(44);
	});

	test("TabsList scrolls on its own with the active tab in view", async ({ page }) => {
		await gotoReady(page, "/docs/navigation/tabs/");
		const list = page.getByRole("tablist").filter({ hasText: "Danger zone" });
		await list.scrollIntoViewIfNeeded();
		const m = await list.evaluate((el) => {
			const box = el.getBoundingClientRect();
			const tab = el.querySelector<HTMLElement>("[aria-selected='true']")?.getBoundingClientRect();
			const de = document.documentElement;
			return {
				overflows: el.scrollWidth > el.clientWidth,
				fits: box.right <= window.innerWidth,
				pageScrolls: de.scrollWidth > de.clientWidth,
				tabInView: !!tab && tab.left >= box.left - 1 && tab.right <= box.right + 1,
			};
		});
		expect(m).toEqual({ overflows: true, fits: true, pageScrolls: false, tabInView: true });
	});
});
