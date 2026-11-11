import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./DialogPlacement.test.svelte";

// #716: palette / quick-switcher dialogs anchor at the top and keep their place as results change.
const panel = () => document.querySelector("dialog.ca-dialog") as HTMLElement;
// Measured at rest: the entrance animation moves the panel while it plays.
const rect = async () => {
	await settled();
	return panel().getBoundingClientRect();
};

describe("Dialog placement and panel tokens (#716)", () => {
	it('placement="top" anchors at the offset and does not move when the body grows', async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { placement: "top", rows: 1 });
		// The token is a calc(): resolve it through a probe, as the browser does for the panel.
		const probe = document.createElement("div");
		probe.style.cssText = "position:absolute;visibility:hidden;width:var(--ca-space-24)";
		document.body.append(probe);
		const offset = probe.getBoundingClientRect().width;
		probe.remove();
		const top1 = (await rect()).top;
		expect(top1).toBeCloseTo(offset, 0);
		await screen.rerender({ placement: "top", rows: 8 });
		expect((await rect()).top).toBeCloseTo(top1, 0);
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("--ca-dialog-top-offset moves the anchor", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		document.documentElement.style.setProperty("--ca-dialog-top-offset", "40px");
		try {
			await render(Harness, { placement: "top" });
			expect((await rect()).top).toBeCloseTo(40, 0);
		} finally {
			document.documentElement.style.removeProperty("--ca-dialog-top-offset");
		}
	});

	it("the default stays centred", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { rows: 1 });
		const r = await rect();
		expect(r.top + r.height / 2).toBeCloseTo(window.innerHeight / 2, 0);
	});

	it("--ca-dialog-width and --ca-dialog-radius restyle the panel without a selector", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		document.documentElement.style.setProperty("--ca-dialog-width", "576px");
		document.documentElement.style.setProperty("--ca-dialog-radius", "12px");
		try {
			await render(Harness, {});
			expect((await rect()).width).toBeCloseTo(576, 0);
			expect(getComputedStyle(panel()).borderTopLeftRadius).toBe("12px");
		} finally {
			document.documentElement.style.removeProperty("--ca-dialog-width");
			document.documentElement.style.removeProperty("--ca-dialog-radius");
		}
	});

	it("fullscreenBelow still wins under its breakpoint", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { placement: "top", fullscreenBelow: "md" });
		const r = await rect();
		expect(r.top).toBe(0);
		expect(r.height).toBeCloseTo(window.innerHeight, 0);
	});
});
