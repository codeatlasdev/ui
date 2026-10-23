import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./DialogSplit.test.svelte";

const panel = () => document.querySelector("dialog.ca-dialog") as HTMLElement;
const body = () => document.querySelector(".ca-dialog__body") as HTMLElement;
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

async function open(props: Record<string, unknown>) {
	const screen = await render(Harness, props);
	await expect.element(page.getByRole("dialog")).toBeVisible();
	await settled();
	return screen;
}

describe("Dialog split: size, columns, fullscreenBelow", () => {
	it("splitSize sets the panel width and height", async () => {
		await page.viewport(1400, 1000);
		await open({ splitSize: { width: "min(66vw, 60rem)", height: "min(88svh, 40rem)" } });
		const r = panel().getBoundingClientRect();
		expect(r.width).toBeCloseTo(Math.min(0.66 * 1400, 60 * rem()), 0);
		expect(r.height).toBeCloseTo(Math.min(0.88 * 1000, 40 * rem()), 0);
	});

	it("splitColumns sets the column ratio", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await open({ splitColumns: "1fr 3fr" });
		const [a, b] = getComputedStyle(body()).gridTemplateColumns.split(" ").map(parseFloat);
		expect(b / a).toBeCloseTo(3, 1);
	});

	it("defaults are unchanged: 1100x720 box, two equal columns", async () => {
		await page.viewport(1400, 1000);
		await open({});
		const r = panel().getBoundingClientRect();
		expect(r.width).toBe(1100);
		expect(r.height).toBe(720);
		const [a, b] = getComputedStyle(body()).gridTemplateColumns.split(" ").map(parseFloat);
		expect(a).toBeCloseTo(b, 0);
	});

	it("the --ca-dialog-split-* tokens work without the props", async () => {
		await page.viewport(1400, 1000);
		const screen = await render(Harness, {});
		const dlg = panel();
		dlg.style.setProperty("--ca-dialog-split-width", "800px");
		dlg.style.setProperty("--ca-dialog-split-height", "500px");
		dlg.style.setProperty("--ca-dialog-split-columns", "1fr 2fr");
		await settled();
		const r = dlg.getBoundingClientRect();
		expect([r.width, r.height]).toEqual([800, 500]);
		const [a, b] = getComputedStyle(body()).gridTemplateColumns.split(" ").map(parseFloat);
		expect(b / a).toBeCloseTo(2, 1);
		screen.unmount();
	});

	it("fullscreenBelow=sm: exactly the viewport under 600px, not above", async () => {
		await page.viewport(390, 844);
		const screen = await open({ fullscreenBelow: "sm" });
		const r = panel().getBoundingClientRect();
		expect([r.left, r.top, r.width, r.height]).toEqual([0, 0, 390, 844]);
		expect(getComputedStyle(panel()).borderTopLeftRadius).toBe("0px");
		expect(await checkA11y(document.body)).toHaveNoViolations();
		screen.unmount();
		await page.viewport(700, 844);
		await open({ fullscreenBelow: "sm" });
		expect(panel().getBoundingClientRect().width).toBeLessThan(700);
	});

	it("fullscreenBelow keeps the safe-area padding, the focus trap and Escape", async () => {
		await page.viewport(390, 844);
		const root = document.documentElement;
		root.style.setProperty("--ca-safe-top", "44px");
		root.style.setProperty("--ca-safe-bottom", "34px");
		try {
			await open({ fullscreenBelow: "md", size: "md" });
			const cs = getComputedStyle(panel());
			expect(panel().getBoundingClientRect().width).toBe(390);
			expect([cs.paddingTop, cs.paddingBottom]).toEqual(["44px", "34px"]);
			expect(cs.boxSizing).toBe("border-box");
			// Focus trap: Tab never leaves the dialog.
			for (let i = 0; i < 4; i++) {
				await userEvent.keyboard("{Tab}");
				expect(panel().contains(document.activeElement)).toBe(true);
			}
			await userEvent.keyboard("{Escape}");
			await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
		} finally {
			root.style.removeProperty("--ca-safe-top");
			root.style.removeProperty("--ca-safe-bottom");
		}
	});

	it("without fullscreenBelow a 390px viewport keeps the gutter", async () => {
		await page.viewport(390, 844);
		await open({});
		expect(panel().getBoundingClientRect().width).toBeLessThan(390);
	});
});
