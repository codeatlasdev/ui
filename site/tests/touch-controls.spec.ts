import { expect, gotoReady, test } from "./fixtures";

// Under pointer: coarse the painted box of these controls must take the tap, across the whole
// 44px hit area, not only the text label (#219).
const CASES = [
	{ name: "checkbox", page: "/docs/inputs/checkbox/", box: ".ca-checkbox", toggles: true },
	{ name: "switch", page: "/docs/inputs/switch/", box: ".ca-switch", toggles: true },
	{
		name: "radio",
		page: "/docs/inputs/radio/",
		box: ".ca-radio-item .ca-radio-input",
		toggles: false,
	},
];

test.describe("touch controls", () => {
	test.skip(({ hasTouch }) => !hasTouch, "coarse pointer only");

	for (const c of CASES) {
		test(`tapping the ${c.name} box toggles it`, async ({ page }) => {
			await gotoReady(page, c.page);
			// Pin one enabled, unchecked control by its input id: state-based selectors would move.
			const id = await page
				.locator(`${c.box}:not([data-disabled]) input:not(:checked):not(:indeterminate)`)
				.first()
				.getAttribute("id");
			const input = page.locator(`[id="${id}"]`);
			const box = page.locator(`${c.box}:has([id="${id}"])`);
			await box.scrollIntoViewIfNeeded();
			await box.tap();
			await expect(input).toBeChecked();
			if (!c.toggles) return;
			// Inside the 44px hit area but outside the drawn box, on the outer side: stacked
			// controls overlap their neighbours' hit areas above and below.
			const r = await box.boundingBox();
			if (!r) throw new Error("box not laid out");
			await page.touchscreen.tap(r.x + r.width / 2 - 19, r.y + r.height / 2);
			await expect(input).not.toBeChecked();
		});
	}
});
