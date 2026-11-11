import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { settled } from "../../../../tests/settled";
import { applyTheme, STYLES, vrtReady } from "../../../../tests/vrt";
import Matrix from "./CollapsibleFlushMatrix.test.svelte";

const WIDTHS = [360, 1280] as const;

describe("Collapsible flush (vrt)", () => {
	afterEach(async () => {
		await page.viewport(1280, 720);
	});

	for (const width of WIDTHS) {
		for (const style of STYLES) {
			it(`${width}px light / ${style}`, async () => {
				await page.viewport(width, 720);
				applyTheme({ scheme: "light", style });
				await render(Matrix);
				await settled();
				await vrtReady();
				await expect
					.element(page.getByTestId("matrix"))
					.toMatchScreenshot(`CollapsibleFlush-${width}-light-${style}`);
			});
		}
	}

	it("title, chevron and body share the panel's left gutter", async () => {
		await page.viewport(360, 720);
		applyTheme({ scheme: "light", style: "solid" });
		const screen = await render(Matrix);
		await settled();
		const panel = screen.container.querySelector("[data-panel]") as HTMLElement;
		const gutter =
			panel.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(panel).paddingLeft);
		const right =
			panel.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(panel).paddingRight);
		const shown = (el: HTMLElement) => el.getBoundingClientRect().width > 0;
		const lefts = [
			...panel.querySelectorAll<HTMLElement>(
				".ca-collapsible__title, .ca-collapsible__body, .ca-accordion-item__title, .ca-accordion-item__body"
			),
		].filter(shown);
		expect(lefts.length).toBeGreaterThanOrEqual(5);
		for (const el of lefts) {
			expect(el.getBoundingClientRect().left, el.className).toBeCloseTo(gutter, 0);
		}
		for (const el of panel.querySelectorAll<HTMLElement>(
			".ca-collapsible__chevron, .ca-accordion-item__chevron"
		)) {
			expect(el.getBoundingClientRect().right, el.className).toBeCloseTo(right, 0);
		}
	});
});
