import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./Targets.test.svelte";

/** The box a pointer can hit: the element, or its `::after` hit area when it draws one. */
function hitBox(el: Element) {
	const r = el.getBoundingClientRect();
	const a = getComputedStyle(el, "::after");
	const overlay = a.content !== "none" && a.position === "absolute";
	return {
		w: Math.max(r.width, overlay ? Number.parseFloat(a.width) || 0 : 0),
		h: Math.max(r.height, overlay ? Number.parseFloat(a.height) || 0 : 0),
	};
}

// #1056: WCAG 2.5.8 (24 px) on a fine pointer, measured on a desktop viewport.
describe("desktop targets (#1056)", () => {
	afterEach(() => vi.restoreAllMocks());

	it("breadcrumb link and clickable sm chip: 24px", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { part: "targets" });
		const link = screen.getByRole("link", { name: "Contacts" }).element();
		const chip = screen.getByRole("button", { name: "Open" }).element();
		for (const el of [link, chip])
			expect(Math.min(...Object.values(hitBox(el)))).toBeGreaterThanOrEqual(24);
	});

	it("a click on the field frame focuses the input", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { part: "targets" });
		const wrap = screen.container.querySelector(".ca-tf__wrap") as HTMLElement;
		const r = wrap.getBoundingClientRect();
		// The frame's top-left inner corner: padding, outside the 16px-tall input.
		await userEvent.click(wrap, { position: { x: 3, y: 3 } });
		await expect.element(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
		expect(r.height).toBeGreaterThan(24);
	});

	it("tooltip warns when its children hold a control", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Harness, { part: "tooltip-text" });
		expect(warn).not.toHaveBeenCalled();
		await render(Harness, { part: "tooltip-button" });
		await vi.waitFor(() =>
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("triggerChild"))
		);
	});
});
