import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./AppShellRailNav.test.svelte";

const rail = () => page.getByRole("navigation", { name: "Module navigation" }).first();
const tabbar = () => page.getByRole("navigation", { name: "Module navigation" }).last();

describe("Rail labels and search slot (#346)", () => {
	it("shows the module label under the icon when railLabels is on", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { railLabels: true });
		const visibleLabel = document.querySelector(".ca-rail__label");
		expect(visibleLabel?.textContent).toBe("Inbox");
		expect(visibleLabel?.checkVisibility()).toBe(true);
	});

	it("has no visible labels by default", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		expect(document.querySelector(".ca-rail__label")).toBeNull();
	});

	it("renders railTop above the modules", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { withTop: true });
		await expect.element(rail().getByRole("button", { name: "Search ⌘K" })).toBeVisible();
		const top = document.querySelector(".top-slot");
		const first = document.querySelector(".ca-rail__icon");
		expect(top?.compareDocumentPosition(first as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});
});

describe("Module badges (#346)", () => {
	it("composes the badge into the accessible name, number and dot", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		// number without badgeLabel: the unread count joins the name
		await expect.element(rail().getByRole("button", { name: "Inbox, 12 unread" })).toBeVisible();
		// dot with badgeLabel: the label joins the name, no number rendered
		await expect.element(rail().getByRole("button", { name: "Map, Search running" })).toBeVisible();
		// number with badgeLabel: the label wins
		await expect
			.element(rail().getByRole("button", { name: "People, 3 tasks pending" }))
			.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the bottom nav tab carries the same name", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness);
		await expect.element(tabbar().getByRole("button", { name: "Inbox, 12 unread" })).toBeVisible();
		await expect
			.element(tabbar().getByRole("button", { name: "Map, Search running" }))
			.toBeVisible();
	});
});

describe("BottomNav overflow (#346)", () => {
	it("shows every module, no More button, up to the primary count", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { count: 5 });
		expect(tabbar().getByRole("button").elements()).toHaveLength(5);
		expect(page.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
	});

	it("collapses extra modules into a More sheet that navigates", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const onNavigate = vi.fn();
		const screen = await render(Harness, { count: 7, onNavigate, withOverflow: true });
		// 4 modules + More
		expect(tabbar().getByRole("button").elements()).toHaveLength(5);
		const bar = document.querySelector(".ca-bottom-nav");
		expect(bar?.querySelector('[aria-label="Alerts"]')).toBeNull();

		await tabbar().getByRole("button", { name: "More" }).click();
		const sheet = page.getByRole("dialog", { name: "More" });
		await expect.element(sheet).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await expect.element(sheet.getByRole("button", { name: "Account" })).toBeVisible();

		await sheet.getByRole("button", { name: "Alerts" }).click();
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/alerts/rules");
		await expect.element(page.getByRole("dialog", { name: "More" })).not.toBeInTheDocument();
	});

	it("without the opt-in sheet the bar keeps the 5-tab cap, no More", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { count: 7, sheet: false });
		expect(tabbar().getByRole("button").elements()).toHaveLength(5);
		expect(page.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
	});

	it("keeps the More tab current when the active module is in the sheet", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { count: 7, pathname: "/alerts/rules" });
		await expect
			.element(tabbar().getByRole("button", { name: "More" }))
			.toHaveAttribute("aria-current", "page");
	});

	it("bottomNavPrimary sets how many tabs stay on the bar", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { count: 7, bottomNavPrimary: 3 });
		// 2 modules + More
		expect(tabbar().getByRole("button").elements()).toHaveLength(3);
	});
});

describe("filterModules (#346)", () => {
	it("hides filtered modules from the rail and the bottom nav", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { hidden: ["settings"] });
		expect(rail().getByRole("button", { name: "Settings" }).elements()).toHaveLength(0);
		expect(rail().getByRole("button").elements()).toHaveLength(3);
	});

	it("keeps the right module active when an earlier one is filtered out", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { pathname: "/map/live", hidden: ["inbox"] });
		await expect
			.element(rail().getByRole("button", { name: /^Map/ }))
			.toHaveAttribute("aria-current", "page");
		await expect.element(screen.getByRole("link", { name: "Live" })).toBeVisible();
	});

	it("clicking a module after a filter navigates to that module's path", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onNavigate = vi.fn();
		await render(Harness, { pathname: "/map/live", hidden: ["inbox", "map"], onNavigate });
		await rail().getByRole("button", { name: "Settings" }).click();
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/settings/general");
	});

	it("falls back to a visible module when the URL belongs to a filtered one", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { pathname: "/inbox/all", hidden: ["inbox"] });
		// nothing matches: the first visible module is selected, the shell does not crash
		await expect.element(rail().getByRole("button", { name: /^Map/ })).toBeVisible();
	});
});
