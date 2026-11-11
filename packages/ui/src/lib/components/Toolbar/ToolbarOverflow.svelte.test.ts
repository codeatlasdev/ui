import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { touchTarget } from "../../../../tests/touch-target";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./ToolbarOverflow.test.svelte";

const bar = (c: HTMLElement) => c.querySelector(".ca-toolbar") as HTMLElement;
const visible = (el: Element) => {
	const r = el.getBoundingClientRect();
	return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};
/** Every direct child of the bar that is laid out sits on one line and inside the bar. */
const oneLine = (c: HTMLElement) => {
	const b = bar(c).getBoundingClientRect();
	const tops = [...bar(c).children]
		.filter((el) => visible(el))
		.map((el) => {
			const r = el.getBoundingClientRect();
			return Math.round(r.top + r.height / 2);
		});
	return new Set(tops).size === 1 && tops.length > 0 && b.height > 0;
};

describe("Toolbar overflow (#914)", () => {
	it("wrap (default) breaks onto more lines when it does not fit", async () => {
		const screen = await render(Harness, { width: 160 });
		expect(bar(screen.container).getAttribute("data-overflow")).toBe("wrap");
		expect(oneLine(screen.container)).toBe(false);
	});

	it("scroll keeps one line, scrolls sideways and hides the scrollbar", async () => {
		const screen = await render(Harness, { overflow: "scroll", width: 160 });
		const b = bar(screen.container);
		expect(oneLine(screen.container)).toBe(true);
		expect(b.scrollWidth).toBeGreaterThan(b.clientWidth);
		const cs = getComputedStyle(b);
		expect(cs.overflowX).toBe("auto");
		expect(cs.scrollbarWidth).toBe("none");
		for (const el of b.children) expect(getComputedStyle(el).flexShrink).toBe("0");
	});

	it("menu keeps one line and the primary item visible at a narrow width", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { overflow: "menu", width: 200 });
		await expect.element(screen.getByRole("button", { name: "More" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Send" })).toBeVisible();
		expect(oneLine(screen.container)).toBe(true);
		const b = bar(screen.container).getBoundingClientRect();
		const send = screen.getByRole("button", { name: "Send" }).element().getBoundingClientRect();
		expect(send.right).toBeLessThanOrEqual(b.right + 1);
		expect(bar(screen.container).scrollWidth).toBeLessThanOrEqual(
			bar(screen.container).clientWidth + 1
		);
	});

	it("menu shows no More trigger when everything fits", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 900 });
		await settled();
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
		await expect.element(screen.getByRole("button", { name: "Assistant" })).toBeVisible();
	});

	it("the More trigger is a touch-sized icon button", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 200 });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		const r = more.element().getBoundingClientRect();
		if (matchMedia("(pointer: coarse)").matches)
			expect(r.height).toBeGreaterThanOrEqual(touchTarget());
		expect(more.element().classList.contains("ca-icon-btn")).toBe(true);
	});

	it("a narrower bar moves more items into the menu, a wider one brings them back", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 300 });
		const inline = () =>
			[...bar(screen.container).querySelectorAll("[aria-label]")].filter(
				(el) => visible(el) && el.getAttribute("aria-label") !== "More"
			).length;
		await expect.poll(() => inline()).toBeGreaterThan(0);
		const before = inline();
		(screen.container.querySelector('[data-testid="host"]') as HTMLElement).style.width = "140px";
		await expect.poll(() => inline()).toBeLessThan(before);
		(screen.container.querySelector('[data-testid="host"]') as HTMLElement).style.width = "900px";
		await expect.poll(() => inline()).toBeGreaterThanOrEqual(before);
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
	});

	it("the menu lists the moved items, in order, and a pick runs the real action", async () => {
		const sent: string[] = [];
		const screen = await render(Harness, { overflow: "menu", width: 200, sent });
		const more = screen.getByRole("button", { name: "More" });
		await more.click();
		const items = page.getByRole("menuitem");
		await expect.element(items.first()).toBeVisible();
		const names = items.elements().map((el) => el.textContent?.trim());
		// Leading items stay in the row; the trailing ones move, in row order. Send is pinned.
		const order = ["Attach", "Templates", "Bold", "Italic", "Assistant"];
		expect(names.length).toBeGreaterThan(0);
		expect(names).toEqual(order.slice(order.length - names.length));
		expect(names).not.toContain("Send");
		await page.getByRole("menuitem", { name: names[0] as string }).click();
		expect(sent).toEqual([(names[0] as string).toLowerCase()]);
	});

	it("keyboard: Tab reaches the trigger, Enter opens, Arrows walk the moved items, Escape returns", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 200 });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		(more.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menuitem").first()).toHaveFocus();
		const count = page.getByRole("menuitem").elements().length;
		expect(count).toBeGreaterThan(1);
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem").nth(1)).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await expect.element(more).toHaveFocus();
	});

	it("passes axe closed and open", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 200 });
		const more = screen.getByRole("button", { name: "More" });
		await expect.element(more).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await more.click();
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();
	});
});
