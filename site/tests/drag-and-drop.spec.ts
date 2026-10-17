import { expect, gotoReady, test } from "./fixtures";

const demo = (page: import("@playwright/test").Page, title: string) =>
	page.locator("section.demo", { has: page.getByRole("heading", { name: title, exact: true }) });

test.describe("drag and drop", () => {
	test("dragging a card to another column moves it", async ({ page, isMobile }) => {
		test.skip(isMobile, "pointer drag; touch is covered by the component tests");
		await gotoReady(page, "/docs/foundation/drag-and-drop/");
		const board = demo(page, "Board");
		const card = board.getByRole("button", { name: "Audit contrast" });
		const target = board.getByRole("list", { name: "In progress" });
		await card.scrollIntoViewIfNeeded();
		const from = (await card.boundingBox()) as {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		const to = (await target.boundingBox()) as {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
		await page.mouse.down();
		await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2, { steps: 3 });
		await page.mouse.move(to.x + to.width / 2, to.y + to.height - 6, { steps: 8 });
		await page.mouse.up();
		await expect(target.getByRole("button", { name: "Audit contrast" })).toBeVisible();
		await expect(board.getByRole("list", { name: "To do" }).getByRole("button")).toHaveCount(1);
	});

	test("keyboard: Space lifts, arrows move, Enter drops; Escape cancels", async ({ page }) => {
		await gotoReady(page, "/docs/foundation/drag-and-drop/");
		const list = demo(page, "Sortable list").getByRole("list", { name: "Release checklist" });
		const grips = list.getByRole("button");
		await expect(grips.first()).toHaveAccessibleName("Move Review the pull request");
		await grips.first().focus();
		await page.keyboard.press("Space");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Escape");
		await expect(grips.first()).toHaveAccessibleName("Move Review the pull request");
		await page.keyboard.press("Space");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");
		await expect(grips.nth(1)).toHaveAccessibleName("Move Review the pull request");
		await expect(grips.nth(1)).toBeFocused();
	});
});
