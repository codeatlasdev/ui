import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./DropdownMenu.test.svelte";
import AnchorHarness from "./DropdownMenuAnchor.test.svelte";
import AttrsHarness from "./DropdownMenuAttrs.test.svelte";
import IconHarness from "./DropdownMenuIcon.test.svelte";
import OpenHarness from "./DropdownMenuOpen.test.svelte";
import SelectionHarness from "./DropdownMenuSelection.test.svelte";
import SubHarness from "./DropdownMenuSub.test.svelte";

const openByKeyboard = async (props = {}, key = "{Enter}") => {
	const screen = await render(Harness, props);
	const trigger = screen.getByRole("button", { name: "Actions" });
	await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	(trigger.element() as HTMLElement).focus();
	await userEvent.keyboard(key);
	const menu = page.getByRole("menu");
	await expect.element(menu).toBeVisible();
	return { screen, trigger, menu };
};

describe("DropdownMenu", () => {
	it.each(["{ContextMenu}", "{Shift>}{F10}{/Shift}"])(
		"the trigger opens on its first item with %j",
		async (key) => {
			await openByKeyboard({}, key);
			await expect.element(page.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
		}
	);

	it.each(["{Enter}", " ", "{ArrowDown}"])(
		"opens from the trigger with %j and exposes menuitems",
		async (key) => {
			const { trigger } = await openByKeyboard({}, key);
			await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
			await expect.element(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
			await expect.element(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
		}
	);

	it("has no axe violations while open", async () => {
		await openByKeyboard();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});

	it("keyboard open focuses first item; arrows skip disabled", async () => {
		await openByKeyboard();
		const edit = page.getByRole("menuitem", { name: "Edit" });
		const del = page.getByRole("menuitem", { name: "Delete" });
		await expect.element(edit).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(del).toHaveFocus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(edit).toHaveFocus();
	});

	it("Enter on an item fires its onclick and closes the menu", async () => {
		const onedit = vi.fn();
		const { trigger } = await openByKeyboard({ onedit });
		await expect.element(page.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		expect(onedit).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
	});

	it("disabled item is aria-disabled and does not fire", async () => {
		await openByKeyboard();
		await expect
			.element(page.getByRole("menuitem", { name: "Duplicate" }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it("Escape closes and returns focus to the trigger", async () => {
		const { trigger } = await openByKeyboard();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	// #81: opening queues a focus move for the next frame. When the close lands before that frame
	// (a slow machine, CPU-bound suite) the queued move must not pull focus back into the closing menu.
	it("Escape before the open frame has run still leaves focus on the trigger", async () => {
		const screen = await render(Harness);
		const trigger = screen.getByRole("button", { name: "Actions" });
		const el = trigger.element() as HTMLElement;
		el.focus();
		el.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
		);
		await expect.element(page.getByRole("menu")).toBeInTheDocument();
		// Same task as the open: no animation frame has run yet.
		document.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
		);
		for (let i = 0; i < 5; i++) {
			const { promise, resolve } = Promise.withResolvers<void>();
			requestAnimationFrame(() => resolve());
			await promise;
		}
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(el);
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("click opens and clicking an item runs it", async () => {
		const ondelete = vi.fn();
		const screen = await render(Harness, { ondelete });
		await screen.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Delete" }).click();
		expect(ondelete).toHaveBeenCalledOnce();
	});
});

describe("DropdownMenuItem icon", () => {
	const open = async () => {
		const screen = await render(IconHarness, {});
		(screen.getByRole("button", { name: "Actions" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		return screen;
	};
	const box = (name: string) =>
		page
			.getByRole("menuitem", { name })
			.element()
			.querySelector(".ca-dropdown-item__icon") as HTMLElement;

	it("renders a fixed aria-hidden icon box; the label stays the accessible name", async () => {
		await open();
		const b = box("Edit");
		expect(b.getAttribute("aria-hidden")).toBe("true");
		const r = b.getBoundingClientRect();
		expect(r.width).toBe(r.height);
		expect(r.width).toBeGreaterThan(0);
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});

	it("a plain icon follows the item color, a brand icon ignores destructive and disabled", async () => {
		await open();
		const item = (name: string) => page.getByRole("menuitem", { name }).element() as HTMLElement;
		expect(getComputedStyle(box("Edit")).color).toBe(getComputedStyle(item("Edit")).color);
		const remove = getComputedStyle(item("Remove"));
		expect(getComputedStyle(box("Remove")).color).not.toBe(remove.color);
		expect(getComputedStyle(box("Remove")).opacity).toBe("1");
	});

	it("a SchemeAsset logo fills the 14px box, sized or not", async () => {
		await open();
		const size = (id: string) => {
			const r = (page.getByTestId(id).element() as Element).getBoundingClientRect();
			return [r.width, r.height];
		};
		const slot = box("Claude Code").getBoundingClientRect();
		expect(slot.width).toBeGreaterThan(0);
		// Both axes are driven by the box, not by the asset: no width/height attribute, no intrinsic size.
		expect(size("brand-light")).toEqual([slot.width, slot.width]);
		expect(size("img-light")).toEqual([slot.width, slot.width]);
		expect(size("sized-light")).toEqual([slot.width, slot.width]);
	});
});

describe("DropdownMenuItem rest attributes", () => {
	it("forwards data-*, id and aria-* onto the menuitem element", async () => {
		const screen = await render(AttrsHarness, {});
		await screen.getByRole("button", { name: "Actions" }).click();
		const item = page.getByRole("menuitem", { name: "Sign out" });
		await expect.element(item).toBeVisible();
		await expect.element(item).toHaveAttribute("data-testid", "sign-out");
		await expect.element(item).toHaveAttribute("id", "sign-out-item");
		await expect.element(item).toHaveAttribute("aria-keyshortcuts", "Shift+Q");
		await expect.element(item).toHaveAttribute("title", "Leave");
		expect(document.getElementById("sign-out-item")?.getAttribute("role")).toBe("menuitem");
	});
});

describe("DropdownMenu selection items", () => {
	const open = async (props = {}) => {
		const screen = await render(SelectionHarness, props);
		(screen.getByRole("button", { name: "View" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		return screen;
	};
	const state = () => page.getByTestId("state");

	it("checkbox items are menuitemcheckbox with aria-checked", async () => {
		await open();
		const hidden = page.getByRole("menuitemcheckbox", { name: "Show hidden files" });
		await expect.element(hidden).toHaveAttribute("aria-checked", "false");
		await expect
			.element(page.getByRole("menuitemcheckbox", { name: "Pinned" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(page.getByRole("menuitemcheckbox", { name: "Pinned" }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it.each(["{Enter}", " "])(
		"%j toggles a checkbox, binds it and keeps the menu open",
		async (key) => {
			const onchange = vi.fn();
			await open({ onchange });
			await expect
				.element(page.getByRole("menuitemcheckbox", { name: "Show hidden files" }))
				.toHaveFocus();
			await userEvent.keyboard(key);
			await expect.element(state()).toHaveTextContent("true|name");
			await expect
				.element(page.getByRole("menuitemcheckbox", { name: "Show hidden files" }))
				.toHaveAttribute("aria-checked", "true");
			expect(onchange).toHaveBeenLastCalledWith(true);
			await expect.element(page.getByRole("menu")).toBeVisible();
			await userEvent.keyboard(key);
			await expect.element(state()).toHaveTextContent("false|name");
		}
	);

	it("a pointer click toggles a checkbox and keeps the menu open", async () => {
		await open();
		await page.getByRole("menuitemcheckbox", { name: "Show hidden files" }).click();
		await expect.element(state()).toHaveTextContent("true|name");
		await expect.element(page.getByRole("menu")).toBeVisible();
	});

	it("radio items sit in a labelled group and exactly one is checked", async () => {
		await open();
		const group = page.getByRole("group", { name: "Sort by" });
		await expect.element(group).toBeVisible();
		await expect
			.element(page.getByRole("menuitemradio", { name: "Name" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(page.getByRole("menuitemradio", { name: "Date" }))
			.toHaveAttribute("aria-checked", "false");
		await expect
			.element(page.getByRole("menuitemradio", { name: "Size" }))
			.toHaveAttribute("aria-disabled", "true");
	});

	it("Enter on a radio item sets the group value and moves the check", async () => {
		const onvalue = vi.fn();
		await open({ onvalue });
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitemradio", { name: "Name" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitemradio", { name: "Date" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(state()).toHaveTextContent("false|date");
		expect(onvalue).toHaveBeenLastCalledWith("date");
		await expect
			.element(page.getByRole("menuitemradio", { name: "Date" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(page.getByRole("menuitemradio", { name: "Name" }))
			.toHaveAttribute("aria-checked", "false");
		await expect.element(page.getByRole("menu")).toBeVisible();
	});

	it("arrow keys skip the disabled radio and typeahead reaches checkbox items", async () => {
		await open();
		await userEvent.keyboard("{End}");
		await expect.element(page.getByRole("menuitem", { name: "Refresh" })).toHaveFocus();
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(page.getByRole("menuitemradio", { name: "Date" })).toHaveFocus();
		await userEvent.keyboard("s");
		await expect
			.element(page.getByRole("menuitemcheckbox", { name: "Show hidden files" }))
			.toHaveFocus();
	});

	it("a plain item still closes the menu; selection items do not break axe", async () => {
		await open();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
		await page.getByRole("menuitem", { name: "Refresh" }).click();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
	});
});

describe("DropdownMenu submenu", () => {
	const open = async (props = {}) => {
		const screen = await render(SubHarness, props);
		(screen.getByRole("button", { name: "Actions" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		return screen;
	};
	const color = () => page.getByRole("menuitem", { name: "Color" });
	// A closing level stays mounted through its exit animation: count the open ones.
	const menus = () => document.querySelectorAll('[role="menu"][data-state="open"]').length;

	it("the sub-trigger is a menuitem with aria-haspopup and aria-expanded", async () => {
		await open();
		await expect.element(color()).toHaveAttribute("aria-haspopup", "menu");
		await expect.element(color()).toHaveAttribute("aria-expanded", "false");
		expect(menus()).toBe(1);
	});

	it("ArrowRight opens the submenu on its first enabled item; ArrowLeft closes it", async () => {
		await open();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(color()).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(color()).toHaveAttribute("aria-expanded", "true");
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toHaveFocus();
		expect(menus()).toBe(2);
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(color()).toHaveAttribute("aria-expanded", "false");
		await expect.element(color()).toHaveFocus();
		await expect.element(page.getByRole("menuitem", { name: "Red" })).not.toBeInTheDocument();
		expect(menus()).toBe(1);
	});

	it.each(["{Enter}", " "])("%j on the sub-trigger opens the submenu", async (key) => {
		await open();
		await userEvent.keyboard("{ArrowDown}");
		await userEvent.keyboard(key);
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toHaveFocus();
		await expect.element(page.getByRole("menu").first()).toBeVisible();
	});

	it("the submenu is labelled by its trigger", async () => {
		await open();
		await userEvent.keyboard("{ArrowDown}{ArrowRight}");
		await expect.element(page.getByRole("menu", { name: "Color" })).toBeVisible();
	});

	it("arrows stay inside the submenu and skip disabled items", async () => {
		await open();
		await userEvent.keyboard("{ArrowDown}{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem", { name: "Shades" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(color()).toHaveFocus();
	});

	it("Escape closes only the innermost submenu, then the next level, then the menu", async () => {
		await open();
		await userEvent.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Dark red" })).toHaveFocus();
		expect(menus()).toBe(3);
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menuitem", { name: "Shades" })).toHaveFocus();
		await expect.poll(menus).toBe(2);
		await userEvent.keyboard("{Escape}");
		await expect.element(color()).toHaveFocus();
		await expect.poll(menus).toBe(1);
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByRole("button", { name: "Actions" })).toHaveFocus();
	});

	it("selecting a submenu item runs it and closes every level", async () => {
		const onred = vi.fn();
		await open({ onred });
		await userEvent.keyboard("{ArrowDown}{ArrowRight}{Enter}");
		expect(onred).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByRole("button", { name: "Actions" })).toHaveFocus();
	});

	it("clicking a submenu item (pointer) selects it and closes the whole menu", async () => {
		const onred = vi.fn();
		await open({ onred });
		await color().click();
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toBeVisible();
		await page.getByRole("menuitem", { name: "Red" }).click();
		expect(onred).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
	});

	it("pressing a sibling item while a submenu is open closes it without leaving the menu", async () => {
		const onrename = vi.fn();
		await open({ onrename });
		await userEvent.keyboard("{ArrowDown}{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toBeVisible();
		await page.getByRole("menuitem", { name: "Rename" }).click();
		expect(onrename).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
	});

	it("hover opens after a short intent delay; moving to a sibling closes it", async () => {
		const onopen = vi.fn();
		await open({ onopen });
		await userEvent.hover(color());
		await expect.element(page.getByRole("menuitem", { name: "Red" })).toBeVisible();
		expect(onopen).toHaveBeenLastCalledWith(true);
		await userEvent.hover(page.getByRole("menuitem", { name: "Rename" }));
		await expect.element(page.getByRole("menuitem", { name: "Red" })).not.toBeInTheDocument();
		expect(onopen).toHaveBeenLastCalledWith(false);
	});

	it("the pointer can cross from the sub-trigger into the submenu without closing it", async () => {
		await open();
		await userEvent.hover(color());
		const red = page.getByRole("menuitem", { name: "Red" });
		await expect.element(red).toBeVisible();
		await userEvent.hover(red);
		await new Promise((r) => setTimeout(r, 400));
		await expect.element(red).toBeVisible();
		await expect.element(color()).toHaveAttribute("aria-expanded", "true");
	});

	it("a disabled sub-trigger neither opens nor takes ArrowRight", async () => {
		await open();
		const move = page.getByRole("menuitem", { name: "Move to" });
		await expect.element(move).toHaveAttribute("aria-disabled", "true");
		// Pointer events are off on a disabled item; the keyboard path must refuse too.
		const el = move.element() as HTMLElement;
		el.focus();
		el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
		await userEvent.keyboard("{ArrowRight}");
		await new Promise((r) => setTimeout(r, 400));
		await expect.element(move).toHaveAttribute("aria-expanded", "false");
		await expect.element(page.getByRole("menuitem", { name: "Inbox" })).not.toBeInTheDocument();
	});

	it("an open submenu has no axe violations", async () => {
		await open();
		await userEvent.keyboard("{ArrowDown}{ArrowRight}");
		await settled();
		for (const el of document.querySelectorAll<HTMLElement>('[role="menu"]'))
			expect(await checkA11y(el)).toHaveNoViolations();
	});
});

describe("DropdownMenu bind:open", () => {
	const isOpen = () => page.getByTestId("open");

	it("opening from the trigger flips the bound value and calls onOpenChange", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		await expect.element(isOpen()).toHaveTextContent("false");
		await screen.getByRole("button", { name: "Actions" }).click();
		await expect.element(isOpen()).toHaveTextContent("true");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		await userEvent.keyboard("{Escape}");
		await expect.element(isOpen()).toHaveTextContent("false");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	it("setting the bound value from outside opens the menu", async () => {
		const screen = await render(OpenHarness, {});
		await screen.getByRole("button", { name: "Open from outside" }).click();
		await expect.element(page.getByRole("menu")).toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Actions" }))
			.toHaveAttribute("aria-expanded", "true");
	});

	it("selecting an item closes the menu and resets the bound value", async () => {
		await render(OpenHarness, {});
		await page.getByRole("button", { name: "Actions" }).click();
		await page.getByRole("menuitem", { name: "Edit" }).click();
		await expect.element(isOpen()).toHaveTextContent("false");
	});
});

describe("DropdownMenu opened at a point", () => {
	const area = () => page.getByTestId("area");
	const menu = () => document.querySelector('[role="menu"]') as HTMLElement;
	const rightClick = async (x: number, y: number) => {
		const el = area().element() as HTMLElement;
		const r = el.getBoundingClientRect();
		el.dispatchEvent(
			new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				clientX: r.left + x,
				clientY: r.top + y,
			})
		);
		return { x: r.left + x, y: r.top + y };
	};

	it("a menu with no trigger opens at the pointer", async () => {
		await render(AnchorHarness, {});
		const p = await rightClick(60, 40);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		const r = menu().getBoundingClientRect();
		expect(Math.abs(r.left - p.x)).toBeLessThan(2);
		expect(r.top).toBeGreaterThanOrEqual(p.y - 1);
		expect(r.top).toBeLessThan(p.y + 12);
	});

	it("a second right-click while open moves the menu instead of closing it", async () => {
		await render(AnchorHarness, {});
		const first = await rightClick(40, 30);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		expect(Math.abs(menu().getBoundingClientRect().left - first.x)).toBeLessThan(2);
		const second = await rightClick(180, 120);
		await settled();
		await expect.element(page.getByRole("menu")).toBeVisible();
		await expect.element(page.getByTestId("open")).toHaveTextContent("true");
		const after = menu().getBoundingClientRect();
		expect(Math.abs(second.x - first.x)).toBeGreaterThan(50);
		expect(Math.abs(after.left - second.x)).toBeLessThan(2);
		expect(Math.abs(after.top - second.y)).toBeLessThan(2);
	});

	it.each([
		["ContextMenu", "{ContextMenu}"],
		["Shift+F10", "{Shift>}{F10}{/Shift}"],
	])("%s opens the menu from the keyboard on the first item", async (_name, keys) => {
		await render(AnchorHarness, {});
		(area().element() as HTMLElement).focus();
		await userEvent.keyboard(keys);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await expect.element(page.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
	});

	it("Escape closes it and focus returns to the element that had it", async () => {
		await render(AnchorHarness, {});
		(area().element() as HTMLElement).focus();
		await userEvent.keyboard("{ContextMenu}");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(area()).toHaveFocus();
		await expect.element(page.getByTestId("open")).toHaveTextContent("false");
	});

	it("a press outside closes it; an item runs and closes it", async () => {
		const onrename = vi.fn();
		await render(AnchorHarness, { onrename });
		await rightClick(20, 20);
		await page.getByRole("menuitem", { name: "Rename" }).click();
		expect(onrename).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await rightClick(20, 20);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await page.getByTestId("open").click({ force: true });
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByTestId("open")).toHaveTextContent("false");
	});

	it("has no axe violations while open at a point", async () => {
		await render(AnchorHarness, {});
		await rightClick(60, 40);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		expect(await checkA11y(menu())).toHaveNoViolations();
	});
});
