import { expect, gotoReady, test } from "./fixtures";

/**
 * #225 (Atlas Desktop, WKWebView): a Dialog must be truly modal and anything opened from inside it
 * must stack above it. Run on every engine we can reach: `--project=desktop|mobile|webkit`.
 */
test.describe("Dialog modality on the built docs page", () => {
	test.beforeEach(async ({ page }) => {
		await gotoReady(page, "/docs/feedback/dialog/");
		await page.getByRole("button", { name: "Invite member" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("the dialog is :modal and the page behind is inert to pointer and Tab", async ({ page }) => {
		expect(
			await page.evaluate(() => document.querySelector("dialog[open]")?.matches(":modal"))
		).toBe(true);

		// A control behind the dialog is never the hit target, and never takes focus by Tab.
		const behind = await page.evaluate(() => {
			const dialog = document.querySelector("dialog[open]") as HTMLElement;
			const target = [...document.querySelectorAll<HTMLElement>("a[href], button")].find(
				(el) => !dialog.contains(el) && el.getBoundingClientRect().width > 0
			);
			if (!target) return null;
			const r = target.getBoundingClientRect();
			const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return { hitsTarget: hit === target, inert: target.matches(":is([inert], [inert] *)") };
		});
		if (behind) expect(behind.hitsTarget).toBe(false);

		for (let i = 0; i < 14; i++) {
			await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
			const escaped = await page.evaluate(() => {
				const active = document.activeElement;
				const dialog = document.querySelector("dialog[open]");
				return active !== document.body && active !== dialog && !dialog?.contains(active);
			});
			expect(escaped, `focus left the dialog at press ${i}`).toBe(false);
		}
	});

	test("the Select list opened from inside is the top element and selectable", async ({ page }) => {
		await page.getByRole("button", { name: "Role" }).click();
		const list = page.getByRole("listbox");
		await expect(list).toBeVisible();
		const onTop = await page.evaluate(() => {
			const box = document.querySelector('[role="listbox"]') as HTMLElement;
			const r = box.getBoundingClientRect();
			const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
			return {
				open: box.matches(":popover-open"),
				insideDialog: !!box.closest("dialog"),
				hit: !!hit && box.contains(hit),
			};
		});
		expect(onTop).toEqual({ open: true, insideDialog: true, hit: true });
		await page.getByRole("option").nth(1).click();
		await expect(list).toBeHidden();
		await expect(page.getByRole("dialog")).toBeVisible();
	});
});
