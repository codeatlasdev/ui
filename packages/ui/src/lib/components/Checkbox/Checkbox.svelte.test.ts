import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import CheckboxHarness from "./CheckboxHarness.test.svelte";

describe("Checkbox", () => {
	it("label names the checkbox; Space toggles aria-checked and the bound value", async () => {
		const screen = await render(CheckboxHarness, { label: "I accept the terms" });
		const box = screen.getByRole("checkbox", { name: "I accept the terms" });
		await expect.element(box).toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		box.element().focus();
		await userEvent.keyboard(" ");
		await expect.element(box).toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await userEvent.keyboard(" ");
		await expect.element(box).toHaveAttribute("aria-checked", "false");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("false");
	});

	it("clicking the label toggles and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(CheckboxHarness, { label: "Newsletter", onchange });
		await screen.getByText("Newsletter").click();
		expect(onchange).toHaveBeenCalledWith(true, expect.any(Event));
		await expect.element(screen.getByRole("checkbox", { name: "Newsletter" })).toBeChecked();
	});

	it("indeterminate is exposed as aria-checked=mixed", async () => {
		const screen = await render(CheckboxHarness, { label: "All", indeterminate: true });
		await expect
			.element(screen.getByRole("checkbox", { name: "All" }))
			.toHaveAttribute("aria-checked", "mixed");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("disabled does not toggle", async () => {
		const onchange = vi.fn();
		const screen = await render(CheckboxHarness, { label: "Locked", disabled: true, onchange });
		const box = screen.getByRole("checkbox", { name: "Locked" });
		await expect.element(box).toBeDisabled();
		await box.click({ force: true });
		expect(onchange).not.toHaveBeenCalled();
		await expect.element(box).toHaveAttribute("aria-checked", "false");
	});
	it("forwards data-*, onclick (Shift) and the change event to the input", async () => {
		let shift = false;
		const onclick = vi.fn((e: MouseEvent) => (shift = e.shiftKey));
		const onchange = vi.fn();
		const screen = await render(CheckboxHarness, {
			"aria-label": "Select row",
			"data-testid": "select",
			onclick,
			onchange,
		});
		const box = screen.getByTestId("select");
		await expect.element(box).toHaveAttribute("type", "checkbox");
		await box.click({ modifiers: ["Shift"] });
		expect(onclick).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledOnce();
		const [checked, event] = onchange.mock.calls[0];
		expect(checked).toBe(true);
		expect((event as Event).type).toBe("change");
		expect(shift).toBe(true);
	});

	it("ref receives the input element", async () => {
		const screen = await render(CheckboxHarness, { "aria-label": "Pick" });
		await expect.element(screen.getByTestId("ref-tag")).toHaveTextContent("INPUT");
	});
});
