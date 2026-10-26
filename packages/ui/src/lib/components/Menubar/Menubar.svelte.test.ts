import { describe, expect, it, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./Menubar.test.svelte";

const bar = () => page.getByRole("menubar", { name: "Application" });
const top = (name: string) => page.getByRole("menuitem", { name, exact: true });
const menu = () => page.getByRole("menu");

const focusFirst = async () => {
	await userEvent.tab();
	await userEvent.tab();
};

describe("Menubar", () => {
	it("is one tab stop: Tab enters the bar on the first menu and leaves it on the next", async () => {
		await render(Harness);
		await focusFirst();
		await expect.element(top("File")).toHaveFocus();
		await expect.element(top("File")).toHaveAttribute("aria-haspopup", "menu");
		await expect.element(top("File")).toHaveAttribute("aria-expanded", "false");
		await userEvent.tab();
		await expect.element(page.getByRole("button", { name: "After" })).toHaveFocus();
		await userEvent.tab({ shift: true });
		await expect.element(top("File")).toHaveFocus();
	});

	it("ArrowRight/ArrowLeft move between menus, wrap, skip disabled; Home and End jump", async () => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(top("Edit")).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(top("View")).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(top("File")).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(top("View")).toHaveFocus();
		await userEvent.keyboard("{Home}");
		await expect.element(top("File")).toHaveFocus();
		await userEvent.keyboard("{End}");
		await expect.element(top("View")).toHaveFocus();
		await expect.element(menu()).not.toBeInTheDocument();
	});

	it.each([
		["ArrowDown", "{ArrowDown}", "New"],
		["Enter", "{Enter}", "New"],
		["Space", " ", "New"],
		["ArrowUp", "{ArrowUp}", "Print"],
	])("%s opens the menu with focus on the right item", async (_n, keys, item) => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard(keys);
		await expect.element(menu()).toBeVisible();
		await expect.element(top("File")).toHaveAttribute("aria-expanded", "true");
		await expect.element(page.getByRole("menuitem", { name: item })).toHaveFocus();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});

	it("ArrowRight/ArrowLeft inside an open menu switch to the adjacent menu, open, on its first item", async () => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem", { name: "New" })).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Undo" })).toHaveFocus();
		await expect.element(top("Edit")).toHaveAttribute("aria-expanded", "true");
		await expect.element(top("File")).toHaveAttribute("aria-expanded", "false");
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(page.getByRole("menuitemcheckbox", { name: "Word wrap" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(page.getByRole("menuitem", { name: "Undo" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(page.getByRole("menuitem", { name: "New" })).toHaveFocus();
	});

	it("ArrowRight on a submenu trigger opens the submenu, not the next menu", async () => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem", { name: "New" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem", { name: "Share" })).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Email" })).toHaveFocus();
		await expect.element(top("File")).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(page.getByRole("menuitem", { name: "Share" })).toHaveFocus();
		await expect.element(top("File")).toHaveAttribute("aria-expanded", "true");
	});

	it("Escape closes the menu and focus returns to its bar item", async () => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard("{ArrowRight}{ArrowDown}");
		await expect.element(menu()).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(menu()).not.toBeInTheDocument();
		await expect.element(top("Edit")).toHaveFocus();
		await expect.element(top("Edit")).toHaveAttribute("aria-expanded", "false");
	});

	it("Tab inside a menu closes it and moves on from the bar", async () => {
		await render(Harness);
		await focusFirst();
		await userEvent.keyboard("{ArrowDown}");
		// Focus moves into the menu a frame after it opens; a Tab before that never reaches the menu.
		await expect.element(page.getByRole("menuitem", { name: "New" })).toHaveFocus();
		await userEvent.tab();
		await expect.element(menu()).not.toBeInTheDocument();
		await expect.element(page.getByRole("button", { name: "After" })).toHaveFocus();
	});

	it("a click opens, a second click closes; selecting an item runs it and closes", async () => {
		const onnew = vi.fn();
		await render(Harness, { onnew });
		await top("File").click();
		await expect.element(menu()).toBeVisible();
		await top("File").click();
		await expect.element(menu()).not.toBeInTheDocument();
		await top("File").click();
		await page.getByRole("menuitem", { name: "New" }).click();
		expect(onnew).toHaveBeenCalledOnce();
		await expect.element(menu()).not.toBeInTheDocument();
		await expect.element(top("File")).toHaveFocus();
	});

	it("once one is open, hovering another top-level item switches to it; hover alone opens nothing", async () => {
		await render(Harness);
		await top("Edit").hover();
		// No timer is involved (the pointer handler is synchronous): a settled frame is enough.
		await settled();
		await expect.element(menu()).not.toBeInTheDocument();
		await top("File").click();
		await expect.element(page.getByRole("menuitem", { name: "New" })).toBeVisible();
		await top("Edit").hover();
		await expect.element(page.getByRole("menuitem", { name: "Undo" })).toBeVisible();
		await expect.element(page.getByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
		await expect.element(top("Edit")).toHaveAttribute("aria-expanded", "true");
	});

	it("a disabled menu is announced and never opens", async () => {
		await render(Harness);
		await expect.element(top("Locked")).toHaveAttribute("aria-disabled", "true");
		await top("Locked").click({ force: true });
		await expect.element(menu()).not.toBeInTheDocument();
	});

	it("checkbox items keep the menu open and report state", async () => {
		await render(Harness);
		await top("View").click();
		await page.getByRole("menuitemcheckbox", { name: "Word wrap" }).click();
		await expect.element(page.getByTestId("wrap")).toHaveTextContent("true");
		await expect.element(menu()).toBeVisible();
	});

	it("reports the bar's open state through onOpenChange", async () => {
		const onOpenChange = vi.fn();
		await render(Harness, { onOpenChange });
		await top("File").click();
		await expect.element(menu()).toBeVisible();
		await top("Edit").hover();
		await expect.element(page.getByRole("menuitem", { name: "Undo" })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(menu()).not.toBeInTheDocument();
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
	});

	it("has no axe violations closed and the bar is a labelled menubar", async () => {
		const screen = await render(Harness);
		await expect.element(bar()).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("Menubar touch (#464)", () => {
	it("every top-level menu has a 44px hit area under a coarse pointer", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			await render(Harness);
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			for (const el of document.querySelectorAll(".ca-menubar__item")) {
				const r = el.getBoundingClientRect();
				const a = getComputedStyle(el, "::after");
				const overlay = a.content !== "none" && a.position === "absolute";
				const w = Math.max(r.width, overlay ? Number.parseFloat(a.width) || 0 : 0);
				const h = Math.max(r.height, overlay ? Number.parseFloat(a.height) || 0 : 0);
				expect(Math.min(w, h), `${el.textContent?.trim()} ${w}x${h}`).toBeGreaterThanOrEqual(
					touchTarget()
				);
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
