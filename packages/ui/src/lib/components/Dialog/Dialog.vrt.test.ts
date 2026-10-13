import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { VIEWPORTS } from "../../../../tests/viewports";
import { applyTheme, overlayVrt, SCHEMES, STYLES, vrtReady } from "../../../../tests/vrt";
import Matrix from "./DialogMatrix.test.svelte";

const open = async () => {
	await page.getByRole("button", { name: "Open" }).click();
};

overlayVrt("Dialog-sm", Matrix, open, "dialog", { size: "sm" });
overlayVrt("Dialog-md", Matrix, open, "dialog", { size: "md" });
overlayVrt("Dialog-lg", Matrix, open, "dialog", { size: "lg" });
overlayVrt("Dialog-chromeless", Matrix, open, "dialog", { chromeless: true });

describe("Dialog-split (vrt)", () => {
	afterEach(async () => {
		await page.viewport(...VIEWPORTS.desktop);
	});

	for (const scheme of SCHEMES) {
		for (const style of STYLES) {
			it(`desktop ${scheme} / ${style}`, async () => {
				await page.viewport(...VIEWPORTS.desktop);
				applyTheme({ scheme, style });
				await render(Matrix, { size: "split", open: true });
				const target = page.getByRole("dialog");
				await expect.element(target).toBeVisible();
				await vrtReady();
				await expect.element(target).toMatchScreenshot(`Dialog-split-${scheme}-${style}`);
			});
		}
	}

	for (const scheme of SCHEMES) {
		it(`mobile ${scheme} / glass`, async () => {
			await page.viewport(...VIEWPORTS.mobile);
			applyTheme({ scheme, style: "glass" });
			await render(Matrix, { size: "split", open: true });
			const target = page.getByRole("dialog");
			await expect.element(target).toBeVisible();
			await vrtReady();
			await expect.element(target).toMatchScreenshot(`Dialog-split-mobile-${scheme}-glass`);
		});
	}
});
