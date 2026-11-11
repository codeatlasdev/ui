import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import ToolbarHarness from "./ToolbarHarness.test.svelte";

describe("Toolbar (#740)", () => {
	it("is a named toolbar and passes axe", async () => {
		const screen = await render(ToolbarHarness);
		await expect.element(screen.getByRole("toolbar", { name: "Filters" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("fields inside size to content side by side, in one row", async () => {
		const screen = await render(ToolbarHarness);
		const sel = screen.container.querySelector(".ca-sel") as HTMLElement;
		const tf = screen.container.querySelector(".ca-tf") as HTMLElement;
		const bar = screen.container.querySelector(".ca-toolbar") as HTMLElement;
		expect(sel.getBoundingClientRect().width).toBeLessThan(bar.getBoundingClientRect().width / 2);
		expect(Math.abs(sel.getBoundingClientRect().top - tf.getBoundingClientRect().top)).toBeLessThan(
			8
		);
	});

	it("ca-toolbar-spacer pushes what follows to the end", async () => {
		const screen = await render(ToolbarHarness);
		const bar = screen.container.querySelector(".ca-toolbar") as HTMLElement;
		const last = bar.querySelector("[data-last]") as HTMLElement;
		expect(bar.getBoundingClientRect().right - last.getBoundingClientRect().right).toBeLessThan(2);
	});
});
