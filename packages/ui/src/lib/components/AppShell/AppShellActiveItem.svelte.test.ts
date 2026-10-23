import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellActiveItem.test.svelte";

const current = () =>
	[...document.querySelectorAll(".ca-panel [aria-current=page]")].map((el) =>
		el.textContent?.trim()
	);
const title = () => document.querySelector(".ca-mobile-header__title")?.textContent;

describe("AppShell active item", () => {
	it("marks only the detail item and titles the header with it", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/items/a" });
		await expect.poll(current).toEqual(["Item A"]);
		expect(document.querySelectorAll(".ca-panel .ca-nav-item--active")).toHaveLength(1);
		expect(title()).toBe("Item A");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the overview active on itself and on unclaimed sub-paths", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/items" });
		await expect.poll(current).toEqual(["All items"]);
		expect(title()).toBe("All items");
		await screen.rerender({ pathname: "/items/zzz" });
		await expect.poll(current).toEqual(["All items"]);
		expect(title()).toBe("All items");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
