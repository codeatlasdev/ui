import { expect, gotoReady, test } from "./fixtures";

test.describe("DataTable groups, resize and reorder", () => {
	test("keyboard moves a row to another group, resizes a column and collapses a group", async ({
		page,
	}) => {
		await gotoReady(page, "/docs/display/data-table/");
		const demo = page.locator("section.demo", {
			has: page.getByRole("heading", { name: "Groups", exact: true }),
		});
		const sprint = demo.locator('tbody[data-group="Sprint 12"]');
		const backlog = demo.locator('tbody[data-group="Backlog"]');

		const grip = demo.getByRole("button", { name: "Move Audit contrast tokens" });
		await grip.scrollIntoViewIfNeeded();
		await grip.focus();
		await page.keyboard.press("Space");
		await page.keyboard.press("ArrowRight");
		await page.keyboard.press("Enter");
		await expect(
			sprint.getByRole("cell", { name: "Audit contrast tokens", exact: true })
		).toBeVisible();
		await expect(
			backlog.getByRole("cell", { name: "Audit contrast tokens", exact: true })
		).toHaveCount(0);

		const handle = demo.getByRole("separator", { name: "Resize Task" });
		await handle.focus();
		const before = Number(await handle.getAttribute("aria-valuenow"));
		await page.keyboard.press("ArrowRight");
		await expect(handle).toHaveAttribute("aria-valuenow", String(before + 10));

		const toggle = demo.getByRole("button", { name: /Backlog/ });
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-expanded", "false");
		await expect(backlog.locator("tr[data-row]")).toHaveCount(0);
	});

	test("a button in a cell does not select the row", async ({ page }) => {
		await gotoReady(page, "/docs/display/data-table/");
		const demo = page.locator("section.demo", {
			has: page.getByRole("heading", { name: "Groups", exact: true }),
		});
		await demo.getByRole("button", { name: "Open Write the export guide" }).click();
		await expect(demo.getByText("Opened Write the export guide")).toBeVisible();
		await demo.getByRole("cell", { name: "Bruno" }).click();
		await expect(demo.getByText("Selected Write the export guide")).toBeVisible();
	});
});
