import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./ButtonGroup.test.svelte";

const corners = (el: Element) => {
	const s = getComputedStyle(el);
	return {
		tl: s.borderTopLeftRadius,
		tr: s.borderTopRightRadius,
		bl: s.borderBottomLeftRadius,
		br: s.borderBottomRightRadius,
	};
};

describe("ButtonGroup", () => {
	it("is a named group; axe passes closed and with the menu open", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByRole("group", { name: "Document actions" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.getByRole("button", { name: "More save options" }).click();
		await expect.element(page.getByRole("menu")).toBeVisible();
		expect(await checkA11y(document.body)).toHaveNoViolations();
	});

	it("attaches the buttons: inner corners are square, outer ones keep the radius", async () => {
		const screen = await render(Harness);
		const save = corners(screen.getByRole("button", { name: "Save", exact: true }).element());
		const saveAs = corners(screen.getByRole("button", { name: "Save as" }).element());
		const more = corners(screen.getByRole("button", { name: "More save options" }).element());
		expect(save.tl).not.toBe("0px");
		expect(save.tr).toBe("0px");
		expect(saveAs).toEqual({ tl: "0px", tr: "0px", bl: "0px", br: "0px" });
		expect(more.tl).toBe("0px");
		expect(more.tr).not.toBe("0px");
		// Neighbours overlap by one border so the seam is a single line.
		const a = screen
			.getByRole("button", { name: "Save", exact: true })
			.element()
			.getBoundingClientRect();
		const b = screen.getByRole("button", { name: "Save as" }).element().getBoundingClientRect();
		expect(b.left).toBeLessThan(a.right);
	});

	it("vertical stacks them and squares the top and bottom seams", async () => {
		const screen = await render(Harness, { orientation: "vertical" });
		const group = screen.getByRole("group", { name: "Document actions" });
		await expect.element(group).toHaveAttribute("data-orientation", "vertical");
		const save = screen.getByRole("button", { name: "Save", exact: true }).element();
		const saveAs = screen.getByRole("button", { name: "Save as" }).element();
		expect(saveAs.getBoundingClientRect().top).toBeLessThan(save.getBoundingClientRect().bottom);
		expect(corners(save).bl).toBe("0px");
		expect(corners(save).tl).not.toBe("0px");
		expect(corners(saveAs).tl).toBe("0px");
	});

	it("the keyboard-focused button paints over its neighbours' seam", async () => {
		const screen = await render(Harness);
		await userEvent.tab();
		await userEvent.tab();
		const saveAs = screen.getByRole("button", { name: "Save as" });
		await expect.element(saveAs).toHaveFocus();
		expect(getComputedStyle(saveAs.element()).zIndex).toBe("2");
	});

	it("Tab visits every button and the menu trigger opens with Enter", async () => {
		const onsave = vi.fn();
		const screen = await render(Harness, { onsave });
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Save", exact: true })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		expect(onsave).toHaveBeenCalledOnce();
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Save as" })).toHaveFocus();
		await userEvent.tab();
		const more = screen.getByRole("button", { name: "More save options" });
		await expect.element(more).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByRole("menuitem", { name: "Save a copy" })).toBeVisible();
	});

	it("a disabled member keeps the group axe-clean and out of the Tab order", async () => {
		const screen = await render(Harness, { disabled: true });
		await expect.element(screen.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
		await expect.element(screen.getByRole("button", { name: "More save options" })).toBeDisabled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
