import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./DropdownMenu.test.svelte";
import IconHarness from "./DropdownMenuIcon.test.svelte";

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
});
