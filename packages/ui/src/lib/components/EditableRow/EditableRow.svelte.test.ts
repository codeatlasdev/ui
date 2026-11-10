import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./EditableRow.test.svelte";

const visible = (el: Element) => {
	const r = el.getBoundingClientRect();
	return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};

describe("EditableRow (#750)", () => {
	it("collapses to a summary row in a narrow column and opens the fields under it", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { width: 330 });
		const fields = q(screen.container, ".ca-editable-row__fields");
		expect(visible(fields)).toBe(false);
		const toggle = screen.getByRole("button", { name: "Edit Lost" });
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
		await toggle.click();
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		expect(visible(fields)).toBe(true);
		const row = q(screen.container, ".ca-editable-row");
		expect(fields.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			q(row, ".ca-editable-row__summary").getBoundingClientRect().bottom - 1
		);
		await expect.element(screen.getByRole("button", { name: "Delete Lost" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("shows the fields beside the summary, no toggle, when the row is wide", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { width: 900 });
		const row = q(screen.container, ".ca-editable-row");
		const fields = q(row, ".ca-editable-row__fields");
		expect(visible(fields)).toBe(true);
		expect(visible(q(row, ".ca-editable-row__toggle"))).toBe(false);
		expect(fields.getBoundingClientRect().left).toBeGreaterThan(
			q(row, ".ca-editable-row__summary").getBoundingClientRect().right - 1
		);
		expect(row.getBoundingClientRect().height).toBeLessThan(120);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("decides by its own width, not the viewport's", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { width: 330 });
		expect(visible(q(screen.container, ".ca-editable-row__fields"))).toBe(false);
		expect(visible(q(screen.container, ".ca-editable-row__toggle"))).toBe(true);
	});
});
