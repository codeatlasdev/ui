import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Button from "../components/Button/Button.svelte";

/**
 * #405: the Playwright pointer is page state. A test that hovers leaves it over the spot where the
 * next test renders (top-left), so `:hover` rules (filled Button fill, tooltips that open on hover)
 * start active and results depend on file order. `tests/setup.browser.ts` parks the pointer outside
 * the page before every test. The two tests below run in order: the first leaves the pointer behind
 * on purpose, the second must still start with nothing hovered.
 */
describe("pointer is reset between tests (#405)", () => {
	it("leaves the pointer over a rendered button", async () => {
		const screen = await render(Button, { children: undefined, "aria-label": "Go" });
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		await userEvent.hover(btn);
		await expect.poll(() => btn.matches(":hover")).toBe(true);
	});

	it("the next test starts with the pointer outside the page", async () => {
		const screen = await render(Button, { children: undefined, "aria-label": "Go" });
		const btn = screen.container.querySelector(".ca-btn") as HTMLElement;
		expect(document.documentElement.matches(":hover")).toBe(false);
		expect(btn.matches(":hover")).toBe(false);
	});
});
