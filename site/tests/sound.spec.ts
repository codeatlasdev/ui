import type { Page } from "@playwright/test";
import { expect, gotoReady, test } from "./fixtures";

const URL = "/docs/feedback/sound/";

// Counts every AudioContext the page creates, before any page script runs. The count lives on the
// constructor itself, so no cast of `window` is needed to read it back.
const COUNT_CONTEXTS = () => {
	const Real = window.AudioContext;
	const Counting = class extends Real {
		static made = 0;
		constructor() {
			super();
			Counting.made++;
		}
	};
	window.AudioContext = Counting;
	Object.defineProperty(window, "__caCtx", { get: () => Counting.made });
};
const contexts = (page: Page) => page.evaluate(() => Reflect.get(window, "__caCtx") as number); // set by COUNT_CONTEXTS above

test.describe("sound docs: Hear it", () => {
	test("sound is off by default and no AudioContext exists before a gesture", async ({ page }) => {
		await page.addInitScript(COUNT_CONTEXTS);
		await gotoReady(page, URL);
		const toggle = page.getByRole("button", { name: "Interface sounds" }).first();
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
		// Cue buttons are pressed while sound is off: nothing may be created or heard.
		await page.getByRole("button", { name: "success" }).first().click();
		expect(await contexts(page)).toBe(0);
		expect(await page.evaluate(() => localStorage.getItem("ca-sound"))).toBeNull();
	});

	test("the toggle turns sound on, persists it, and the context appears only after the next gesture", async ({
		page,
	}) => {
		await page.addInitScript(COUNT_CONTEXTS);
		await gotoReady(page, URL);
		const toggle = page.getByRole("button", { name: "Interface sounds" }).first();
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		expect(
			JSON.parse((await page.evaluate(() => localStorage.getItem("ca-sound"))) as string)
		).toMatchObject({
			enabled: true,
		});
		// The next pointer or key event unlocks audio, and only one context is ever created.
		await page.getByRole("button", { name: "error" }).first().click();
		await page.getByRole("button", { name: "success" }).first().click();
		expect(await contexts(page)).toBe(1);

		await page.reload();
		await expect(page.getByRole("button", { name: "Interface sounds" }).first()).toHaveAttribute(
			"aria-pressed",
			"true"
		);
	});

	test("the cue board and the profile picker are reachable and named", async ({ page }) => {
		await gotoReady(page, URL);
		await expect(page.getByRole("group", { name: "Cue board" })).toBeVisible();
		await expect(page.getByRole("group", { name: "Cue board" }).getByRole("button")).toHaveCount(9);
		await expect(page.getByText("Terminal", { exact: true }).first()).toBeVisible();
	});
});
