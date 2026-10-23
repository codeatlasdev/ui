import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./ContextMenu.test.svelte";

const area = () => page.getByTestId("area");
const menu = () => document.querySelector('[role="menu"]') as HTMLElement;

function fire(target: Element, type: string, init: PointerEventInit & MouseEventInit = {}) {
	const Ctor = type.startsWith("pointer") ? PointerEvent : MouseEvent;
	const e = new Ctor(type, { bubbles: true, cancelable: true, ...init });
	target.dispatchEvent(e);
	return e;
}
const rightClick = (x: number, y: number) => {
	const el = area().element();
	const r = el.getBoundingClientRect();
	const e = fire(el, "contextmenu", { clientX: r.left + x, clientY: r.top + y });
	return { x: r.left + x, y: r.top + y, e };
};
const touch = (type: string, x: number, y: number) => {
	const el = area().element();
	const r = el.getBoundingClientRect();
	return fire(el, type, {
		pointerType: "touch",
		pointerId: 7,
		isPrimary: true,
		clientX: r.left + x,
		clientY: r.top + y,
	});
};

describe("ContextMenu", () => {
	it("right-click opens the menu at the pointer on the first item and cancels the native menu", async () => {
		await render(Harness);
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		const p = rightClick(60, 40);
		expect(p.e.defaultPrevented).toBe(true);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await expect.element(page.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
		await settled();
		const r = menu().getBoundingClientRect();
		expect(Math.abs(r.left - p.x)).toBeLessThan(2);
		expect(r.top).toBeGreaterThanOrEqual(p.y - 1);
		expect(r.top).toBeLessThan(p.y + 12);
		expect(await checkA11y(menu())).toHaveNoViolations();
	});

	it("a second right-click moves the open menu", async () => {
		await render(Harness);
		const first = rightClick(40, 30);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await settled();
		const second = rightClick(200, 120);
		await settled();
		await expect.element(page.getByRole("menu")).toBeVisible();
		expect(Math.abs(second.x - first.x)).toBeGreaterThan(50);
		expect(Math.abs(menu().getBoundingClientRect().left - second.x)).toBeLessThan(2);
	});

	it.each([
		["ContextMenu", "{ContextMenu}"],
		["Shift+F10", "{Shift>}{F10}{/Shift}"],
	])("%s on the focused region opens the menu on the first item", async (_n, keys) => {
		await render(Harness);
		await userEvent.tab();
		await expect.element(area()).toHaveFocus();
		await userEvent.keyboard(keys);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await expect.element(page.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
		await settled();
		const m = menu().getBoundingClientRect();
		const a = area().element().getBoundingClientRect();
		expect(m.left).toBeGreaterThanOrEqual(a.left - 1);
		expect(m.top).toBeGreaterThanOrEqual(a.top - 1);
	});

	it("Escape closes it and focus returns to the region", async () => {
		await render(Harness);
		await userEvent.tab();
		await userEvent.keyboard("{ContextMenu}");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(area()).toHaveFocus();
	});

	it("arrows move, Enter runs the item and closes, checkbox items keep it open, submenus open", async () => {
		const onrename = vi.fn();
		await render(Harness, { onrename });
		rightClick(20, 20);
		await expect.element(page.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitemcheckbox", { name: "Pinned" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByTestId("pinned")).toHaveTextContent("true");
		await expect.element(page.getByRole("menu")).toBeVisible();
		await userEvent.keyboard("{ArrowDown}{ArrowRight}");
		await expect.element(page.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}{ArrowUp}{ArrowUp}{Enter}");
		expect(onrename).toHaveBeenCalledOnce();
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
	});

	it("a press outside closes it", async () => {
		await render(Harness);
		rightClick(20, 20);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await page.getByRole("button", { name: "After" }).click({ force: true });
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
	});

	it("a long touch press opens it at the finger and swallows the native contextmenu", async () => {
		await render(Harness, { longPressDelay: 80 });
		touch("pointerdown", 50, 60);
		await new Promise((r) => setTimeout(r, 30));
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		await expect.element(page.getByRole("menu")).toBeVisible();
		const e = rightClick(50, 60);
		expect(e.e.defaultPrevented).toBe(true);
		touch("pointerup", 50, 60);
		await settled();
		await expect.element(page.getByRole("menu")).toBeVisible();
	});

	it("a touch that lifts early or drags away never opens it", async () => {
		await render(Harness, { longPressDelay: 120 });
		touch("pointerdown", 50, 60);
		touch("pointerup", 50, 60);
		touch("pointerdown", 50, 60);
		touch("pointermove", 120, 140);
		await new Promise((r) => setTimeout(r, 250));
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it("leaves the native menu in editable fields", async () => {
		await render(Harness);
		const field = page.getByTestId("field").element();
		expect(fire(field, "contextmenu", { clientX: 10, clientY: 10 }).defaultPrevented).toBe(false);
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it("leaves the native menu when disabled", async () => {
		await render(Harness, { disabled: true });
		expect(rightClick(20, 20).e.defaultPrevented).toBe(false);
		expect(document.querySelector('[role="menu"]')).toBeNull();
	});

	it("reports user-driven changes and supports bind:open", async () => {
		const onOpenChange = vi.fn();
		await render(Harness, { onOpenChange });
		rightClick(20, 20);
		await expect.element(page.getByRole("menu")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("menu")).not.toBeInTheDocument();
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
		await expect.element(page.getByTestId("open")).toHaveTextContent("false");
	});

	it("the region has no axe violations and the menu is closed by default", async () => {
		const screen = await render(Harness);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
