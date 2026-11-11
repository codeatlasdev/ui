import { audit } from "./layout-audit";
import { expect, gotoReady, test } from "./fixtures";

// #943: each CRM recipe passes the layout audit at 390px, in the states a user reaches on a
// phone (thread open, the second settings tab, a stage being edited). The route sweep only sees
// the first render at 360px.
test.describe("CRM recipes at 390px (#943)", () => {
	test.skip(({ isMobile }) => !isMobile, "phone layout");
	test.use({ viewport: { width: 390, height: 844 } });

	test("deals board and record page", async ({ page }) => {
		for (const [path, demo] of [
			["/docs/display/kanban/", "Deals page"],
			["/docs/layout/record-list/", "Record page"],
		] as const) {
			await gotoReady(page, path);
			await expect(page.getByRole("region", { name: demo })).toBeVisible();
			expect(await audit(page, true), `${demo} @ 390`).toEqual([]);
		}
	});

	test("inbox with a thread open", async ({ page }) => {
		await gotoReady(page, "/docs/layout/master-detail/");
		const demo = page.getByRole("region", { name: "Inbox page" });
		await demo.locator(".ca-conversation-item").first().click();
		await expect(demo.locator(".ca-message-bubble").first()).toBeVisible();
		expect(await audit(page, true), "thread open @ 390").toEqual([]);
	});

	test("settings: notifications tab and a stage being edited", async ({ page }) => {
		await gotoReady(page, "/docs/layout/sortable-list/");
		const demo = page.getByRole("region", { name: "Settings page" });
		await demo.locator(".ca-editable-row__toggle").first().click();
		await expect(demo.locator(".ca-editable-row[data-open]")).toHaveCount(1);
		expect(await audit(page, true), "stage editing @ 390").toEqual([]);
		await demo.getByRole("tab", { name: "Notifications" }).click();
		await expect(demo.getByRole("tab", { name: "Notifications" })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(await audit(page, true), "notifications @ 390").toEqual([]);
	});
});
