import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./NavigationMenu.test.svelte";

const trigger = (name: string) => page.getByRole("button", { name, exact: true });
const link = (name: string) => page.getByRole("link", { name: new RegExp(`^${name}`) });
const gotoNav = async () => {
	await userEvent.tab(); // Skip
	await userEvent.tab(); // Products
};

describe("NavigationMenu", () => {
	it("is a labelled nav landmark with a list, disclosure buttons and no menu roles", async () => {
		const screen = await render(Harness);
		await expect.element(page.getByRole("navigation", { name: "Main" })).toBeVisible();
		await expect.element(trigger("Products")).toHaveAttribute("aria-expanded", "false");
		expect(trigger("Products").element().getAttribute("aria-haspopup")).toBeNull();
		expect(
			screen.container.querySelector('[role="menu"], [role="menubar"], [role="menuitem"]')
		).toBeNull();
		await expect.element(link("Pricing")).toHaveAttribute("aria-current", "page");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("Enter and Space open the panel; focus stays on the button; aria-controls names the panel", async () => {
		await render(Harness);
		await gotoNav();
		await expect.element(trigger("Products")).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(link("Analytics")).toBeVisible();
		await expect.element(trigger("Products")).toHaveAttribute("aria-expanded", "true");
		await expect.element(trigger("Products")).toHaveFocus();
		const panelId = trigger("Products").element().getAttribute("aria-controls");
		expect(panelId).toBeTruthy();
		expect(document.getElementById(panelId as string)?.contains(link("Analytics").element())).toBe(
			true
		);
		await userEvent.keyboard(" ");
		await expect.element(link("Analytics")).not.toBeInTheDocument();
		await userEvent.keyboard(" ");
		await expect.element(link("Analytics")).toBeVisible();
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-navmenu-panel") as HTMLElement)
		).toHaveNoViolations();
	});

	it("Tab moves from the button into the panel links, then on; Shift+Tab goes back", async () => {
		await render(Harness);
		await gotoNav();
		await userEvent.keyboard("{Enter}");
		await expect.element(link("Analytics")).toBeVisible();
		await userEvent.tab();
		await expect.element(link("Analytics")).toHaveFocus();
		await userEvent.tab();
		await expect.element(link("Automation")).toHaveFocus();
		await expect.element(link("Automation")).toBeVisible();
		await userEvent.tab();
		await expect.element(trigger("Resources")).toHaveFocus();
		await expect.element(link("Automation")).not.toBeInTheDocument();
	});

	it("ArrowDown on the button opens it and moves to the first link; arrows move through links", async () => {
		await render(Harness);
		await gotoNav();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(link("Analytics")).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(link("Automation")).toHaveFocus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(link("Analytics")).toHaveFocus();
	});

	it("Escape closes the panel and returns focus to its button, from a link too", async () => {
		await render(Harness);
		await gotoNav();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(link("Analytics")).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await expect.element(link("Analytics")).not.toBeInTheDocument();
		await expect.element(trigger("Products")).toHaveFocus();
		await expect.element(trigger("Products")).toHaveAttribute("aria-expanded", "false");
	});

	it("ArrowRight/ArrowLeft move between the top-level items without opening", async () => {
		await render(Harness);
		await gotoNav();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(trigger("Resources")).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(link("Pricing")).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		await expect.element(trigger("Products")).toHaveFocus();
		await expect.element(link("Analytics")).not.toBeInTheDocument();
	});

	it("a click toggles it and only one panel is open at a time", async () => {
		await render(Harness);
		await trigger("Products").click();
		await expect.element(link("Analytics")).toBeVisible();
		await trigger("Resources").click();
		await expect.element(link("Docs")).toBeVisible();
		await expect.element(link("Analytics")).not.toBeInTheDocument();
		await trigger("Resources").click();
		await expect.element(link("Docs")).not.toBeInTheDocument();
	});

	it("Enter right after a hover opened the panel still closes it", async () => {
		await render(Harness, { openDelay: 0 });
		await trigger("Products").hover();
		await expect.element(link("Analytics")).toBeVisible();
		// Within the click grace of a hover open: a pointer click would confirm it, a key must toggle.
		trigger("Products").element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(link("Analytics")).not.toBeInTheDocument();
	});

	it("hover delays, switches once open, closes after closeDelay", async () => {
		await render(Harness, { openDelay: 150, closeDelay: 150 });
		await trigger("Products").hover();
		await new Promise((r) => setTimeout(r, 60));
		expect(document.querySelector(".ca-navmenu-panel")).toBeNull();
		await expect.element(link("Analytics")).toBeVisible();
		await trigger("Resources").hover();
		await expect.element(link("Docs")).toBeVisible();
		await expect.element(link("Analytics")).not.toBeInTheDocument();
		await userEvent.hover(link("Docs"));
		await new Promise((r) => setTimeout(r, 300));
		await expect.element(link("Docs")).toBeVisible();
		await userEvent.unhover(link("Docs"));
		await expect.element(link("Docs")).not.toBeInTheDocument();
	});

	it("following a link closes the panel; a press outside closes it", async () => {
		await render(Harness);
		await trigger("Products").click();
		await link("Automation").click();
		await expect.element(link("Automation")).not.toBeInTheDocument();
		await trigger("Products").click();
		await expect.element(link("Analytics")).toBeVisible();
		await page.getByRole("button", { name: "After" }).click({ force: true });
		await expect.element(link("Analytics")).not.toBeInTheDocument();
	});

	it("shows a link description inside the link's accessible name", async () => {
		await render(Harness);
		await trigger("Products").click();
		await expect
			.element(page.getByRole("link", { name: /Analytics.*Dashboards and reports/ }))
			.toBeVisible();
	});
});
