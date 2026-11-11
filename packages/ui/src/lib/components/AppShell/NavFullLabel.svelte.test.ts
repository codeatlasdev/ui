import { Folder } from "@lucide/svelte";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import BottomNav from "./BottomNav.svelte";
import NavMoreSheet from "./NavMoreSheet.svelte";
import Rail from "./Rail.svelte";
import { moduleName, type NavModule } from "./types.js";

// #715: `fullLabel` is the full name of a module whose visible `label` is an abbreviation. The
// accessible name always contains the visible text (WCAG 2.5.3, label in name).
const mod = (id: string, label: string, extra: Partial<NavModule> = {}): NavModule => ({
	id,
	label,
	icon: Folder,
	basePath: `/${id}`,
	items: [{ id: `${id}-i`, label: "Item", icon: Folder, path: `/${id}/a` }],
	...extra,
});
const modules = [
	mod("crm", "CRM", { fullLabel: "Customer relationships" }),
	mod("overview", "Home", { fullLabel: "Overview", badge: 3 }),
	mod("plain", "Plain"),
];
const text = { unread: (n: number) => `${n} unread`, fresh: "New" };

describe("NavModule.fullLabel (#715)", () => {
	it("moduleName is the visible label and the badge; the full label is the description", () => {
		expect(moduleName(modules[0], text)).toBe("CRM");
		expect(moduleName(modules[1], text)).toBe("Home, 3 unread");
		// Without fullLabel nothing changes.
		expect(moduleName(modules[2], text)).toBe("Plain");
	});

	it("the rail button name contains the visible text, the tooltip is the full label", async () => {
		const screen = await render(Rail, {
			modules,
			activeIndex: 0,
			onSelect: () => {},
			labels: true,
		});
		const settings = screen.getByRole("button", { name: "CRM", exact: true });
		await expect.element(settings).toHaveAttribute("title", "Customer relationships");
		await expect.element(settings).toHaveTextContent("CRM");
		await expect
			.element(screen.getByRole("button", { name: "Home, 3 unread", exact: true }))
			.toBeVisible();
		const plain = screen.getByRole("button", { name: "Plain" });
		await expect.element(plain).toHaveAttribute("title", "Plain");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("the bottom-nav tab name contains the visible text", async () => {
		await page.viewport(390, 844);
		const screen = await render(BottomNav, { modules, activeIndex: 0, onSelect: () => {} });
		const tab = screen.getByRole("button", { name: "CRM", exact: true });
		await expect.element(tab).toHaveTextContent("CRM");
		await expect.element(tab).toHaveAttribute("title", "Customer relationships");
		await expect
			.element(screen.getByRole("button", { name: "Home, 3 unread", exact: true }))
			.toBeVisible();
		expect(
			await checkA11y(screen.getByRole("button", { name: "CRM", exact: true }).element())
		).toHaveNoViolations();
	});

	it("the More sheet cards use the same name", async () => {
		await page.viewport(390, 844);
		const screen = await render(NavMoreSheet, {
			open: true,
			title: "More",
			rest: modules,
			visibleCount: 0,
			activeIndex: 0,
			onPick: () => {},
		});
		void screen;
		await expect
			.element(page.getByRole("button", { name: "CRM", exact: true }))
			.toHaveTextContent("CRM");
		await expect
			.element(page.getByRole("button", { name: "Home, 3 unread", exact: true }))
			.toBeVisible();
	});
});
