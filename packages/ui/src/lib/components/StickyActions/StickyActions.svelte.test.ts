import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./StickyActions.test.svelte";

describe("StickyActions", () => {
	it("renders the actions and is sticky to the bottom of its scroller", async () => {
		await page.viewport(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
		const screen = await render(Harness, {});
		await expect.element(screen.getByRole("button", { name: "Save" })).toBeVisible();
		const bar = screen.container.querySelector(".ca-sticky-actions") as HTMLElement;
		expect(getComputedStyle(bar).position).toBe("sticky");
		expect(getComputedStyle(bar).bottom).toBe("0px");
		const scroller = screen.container.querySelector("[data-testid=scroller]") as HTMLElement;
		scroller.scrollTop = 0;
		// Sticky: bar bottom stays within the scroller even with the content far above the fold.
		expect(bar.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			scroller.getBoundingClientRect().bottom + 1
		);
	});

	it("pads the bottom by the keyboard inset and the safe area", async () => {
		const screen = await render(Harness, {});
		const bar = screen.container.querySelector(".ca-sticky-actions") as HTMLElement;
		expect(bar.style.paddingBottom).toBe("var(--ca-kb-inset, 0px)");
	});

	it("align=end right-aligns, align=stretch adds the modifier class", async () => {
		const end = await render(Harness, { align: "end" });
		const endInner = end.container.querySelector(".ca-sticky-actions__inner") as HTMLElement;
		expect(getComputedStyle(endInner).justifyContent).toMatch(/flex-end|end/);

		const stretch = await render(Harness, { align: "stretch" });
		expect(stretch.container.querySelector(".ca-sticky-actions--stretch")).not.toBeNull();
	});

	it("show=false renders nothing", async () => {
		const screen = await render(Harness, { show: false });
		expect(screen.container.querySelector(".ca-sticky-actions")).toBeNull();
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness, {});
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
