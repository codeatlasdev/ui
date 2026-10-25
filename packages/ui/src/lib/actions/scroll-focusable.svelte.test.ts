import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./ScrollFocusableHarness.test.svelte";

describe("scrollFocusable", () => {
	it("content that overflows after mount, below a direct child, makes the scroller focusable", async () => {
		const screen = await render(Harness, { later: true });
		const el = screen.getByTestId("scroller").element() as HTMLElement;
		expect(el.hasAttribute("tabindex")).toBe(false);
		await expect.poll(() => el.scrollHeight > el.clientHeight + 1).toBe(true);
		await expect.poll(() => el.tabIndex, { timeout: 2000 }).toBe(0);
	});

	it("adds no tab stop while nothing overflows", async () => {
		const screen = await render(Harness, { later: false });
		const el = screen.getByTestId("scroller").element() as HTMLElement;
		expect(el.hasAttribute("tabindex")).toBe(false);
	});
});
