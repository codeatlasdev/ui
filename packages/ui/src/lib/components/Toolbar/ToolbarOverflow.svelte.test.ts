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
		for (const el of b.children)
			if (!el.classList.contains("ca-toolbar-spacer"))
				expect(getComputedStyle(el).flexShrink).toBe("0");
		// The spacer keeps its flex-grow behaviour (it is not forced to `flex: none`).
		const spacer = b.querySelector(".ca-toolbar-spacer") as HTMLElement;
		expect(getComputedStyle(spacer).flexGrow).not.toBe("0");
	});

	it("scroll leaves room for the items' focus rings inside the scroll container", async () => {
		const screen = await render(Harness, { overflow: "scroll", width: 160 });
		const b = bar(screen.container);
		const first = b.querySelector("button") as HTMLElement;
		await userEvent.keyboard("{Tab}");
		first.focus();
		const cs = getComputedStyle(first);
		const ring = parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset);
		const box = b.getBoundingClientRect();
		const r = first.getBoundingClientRect();
		const pad = getComputedStyle(b);
		// The ring (outline width + offset) must fit between the item and the scroller's padding-box edge.
		expect(r.top - ring).toBeGreaterThanOrEqual(box.top + parseFloat(pad.borderTopWidth) - 0.5);
		expect(r.bottom + ring).toBeLessThanOrEqual(
			box.bottom - parseFloat(pad.borderBottomWidth) + 0.5
		);
		expect(r.left - ring).toBeGreaterThanOrEqual(box.left + parseFloat(pad.borderLeftWidth) - 0.5);
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
		// Real Tab presses from the first inline item until the trigger has focus.
		(
			screen.container.querySelector(".ca-toolbar button:not([data-overflowed])") as HTMLElement
		).focus();
		for (let i = 0; i < 12 && document.activeElement !== more.element(); i++)
			await userEvent.keyboard("{Tab}");
		await expect.element(more).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menuitem").first()).toHaveFocus();
		const count = page.getByRole("menuitem").elements().length;
		expect(count).toBeGreaterThan(1);
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(page.getByRole("menuitem").nth(1)).toHaveFocus();
		await userEvent.keyboard("{Escape}");
		await expect.element(more).toHaveFocus();
	});

	it("Tab never lands on a hidden (moved) item", async () => {
		const screen = await render(Harness, { overflow: "menu", width: 200 });
		await expect.element(screen.getByRole("button", { name: "More" })).toBeVisible();
		const stops: string[] = [];
		(
			screen.container.querySelector(".ca-toolbar button:not([data-overflowed])") as HTMLElement
		).focus();
		for (let i = 0; i < 10; i++) {
			stops.push(
				document.activeElement?.getAttribute("aria-label") ??
					document.activeElement?.textContent?.trim() ??
					""
			);
			await userEvent.keyboard("{Tab}");
		}
		for (const el of bar(screen.container).querySelectorAll("[data-overflowed]"))
			expect(stops).not.toContain(el.getAttribute("aria-label"));
		expect(stops).toContain("More");
	});

	it("a moved ButtonGroup, TextField or wrapped Button is never a dead menu entry", async () => {
		const sent: string[] = [];
		const screen = await render(Harness, { overflow: "menu", width: 200, mixed: true, sent });
		await expect.element(screen.getByRole("button", { name: "More" })).toBeVisible();
		const b = bar(screen.container);
		// A group and a field cannot be clicked from a menu: they stay in the row.
		expect(b.querySelector(".ca-btn-group")?.hasAttribute("data-overflowed")).toBe(false);
		expect(
			b.querySelector(".ca-tf")?.closest(".ca-toolbar > *")?.hasAttribute("data-overflowed")
		).toBe(false);
		// The span-wrapped Button is marked, so it may move, and its entry clicks the inner button.
		await screen.getByRole("button", { name: "More" }).click();
		const wrapped = page.getByRole("menuitem", { name: "Wrapped" });
		await expect.element(wrapped).toBeVisible();
		await wrapped.click();
		expect(sent).toContain("wrapped");
		// Every menu entry does something: every entry's item holds a clickable target.
		for (const el of b.querySelectorAll("[data-overflowed]"))
			expect(el.matches("button, a[href]") || el.querySelector("button, a[href]") !== null).toBe(
				true
			);
	});

	it("data-overflow names the menu entry and a disabled item is a disabled entry", async () => {
		const sent: string[] = [];
		const screen = await render(Harness, { overflow: "menu", width: 140, extras: true, sent });
		await screen.getByRole("button", { name: "More" }).click();
		const entry = page.getByRole("menuitem", { name: "Disabled tool" });
		await expect.element(entry).toBeVisible();
		expect(
			entry.element().getAttribute("aria-disabled") === "true" ||
				entry.element().hasAttribute("disabled") ||
				entry.element().hasAttribute("data-disabled")
		).toBe(true);
		expect(page.getByRole("menuitem", { name: "Off" }).elements()).toHaveLength(0);
		await entry.click({ force: true }).catch(() => {});
		expect(sent).not.toContain("off");
	});

	it("a child added after mount makes the row re-measure, and a removed one leaves no entry", async () => {
		// Exactly full: the bar's width is the sum of the items, so one more item overflows
		// without the bar itself resizing (no ResizeObserver tick on the container).
		const screen = await render(Harness, { overflow: "menu", width: 900 });
		await settled();
		const b = bar(screen.container);
		const host = screen.container.querySelector('[data-testid="host"]') as HTMLElement;
		// The spacer grows to fill, so it counts as 0; the hidden More wrapper is not an item.
		const items = [...b.children].filter(
			(el) =>
				!el.classList.contains("ca-toolbar-spacer") && !el.classList.contains("ca-toolbar__more")
		);
		const natural = items.reduce((w, el) => w + el.getBoundingClientRect().width, 0);
		const gap = parseFloat(getComputedStyle(b).columnGap) || 0;
		// Items plus the spacer's own gap slot, +2px: full, but nothing overflows yet.
		host.style.width = `${Math.ceil(natural + items.length * gap) + 2}px`;
		await settled();
		expect(screen.getByRole("button", { name: "More" }).elements()).toHaveLength(0);
		const added = document.createElement("button");
		added.setAttribute("aria-label", "Late");
		added.style.width = "120px";
		b.insertBefore(added, b.querySelector(".ca-toolbar-spacer"));
		await expect.poll(() => added.hasAttribute("data-overflowed")).toBe(true);
		expect(b.scrollWidth).toBeLessThanOrEqual(b.clientWidth + 1);
		await screen.getByRole("button", { name: "More" }).click();
		await expect.element(page.getByRole("menuitem", { name: "Late" })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		added.remove();
		await expect.poll(() => bar(screen.container).querySelector("[data-overflowed]")).toBeNull();
		await screen
			.getByRole("button", { name: "More" })
			.click()
			.catch(() => {});
		expect(page.getByRole("menuitem", { name: "Late" }).elements()).toHaveLength(0);
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
