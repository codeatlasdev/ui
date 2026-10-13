import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import { applyTheme, overlayVrt, SCHEMES, vrtReady } from "../../../../tests/vrt";
import Matrix from "./SheetMatrix.test.svelte";

// Desktop (>= 768px): renders as a centered dialog.
overlayVrt(
	"Sheet",
	Matrix,
	async () => {
		await page.getByRole("button", { name: "Open" }).click();
	},
	"dialog"
);

// Mobile (< 768px): bottom sheet.
describe("Sheet-mobile (vrt)", () => {
	afterEach(async () => {
		await page.viewport(...VIEWPORTS.desktop);
	});

	for (const scheme of SCHEMES) {
		it(`${scheme} / glass`, async () => {
			await page.viewport(...VIEWPORTS.mobile);
			applyTheme({ scheme, style: "glass" });
			await render(Matrix);
			await page.getByRole("button", { name: "Open" }).click();
			const target = page.getByRole("dialog");
			await expect.element(target).toBeVisible();
			await settled();
			await vrtReady();
			await expect.element(target).toMatchScreenshot(`Sheet-mobile-${scheme}-glass`);
		});
	}
});
