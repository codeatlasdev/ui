import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./FieldHarness.test.svelte";

// #764: label, description and error wiring for a custom control.
describe("Field, Fieldset, Label (#764)", () => {
	it("names and describes a custom control", async () => {
		const screen = await render(Harness, {});
		const input = screen.getByRole("textbox", { name: "Plan code" });
		await expect.element(input).toHaveAccessibleDescription("Six letters.");
		await expect.element(input).toHaveAttribute("aria-required", "true");
		await expect.element(input).not.toHaveAttribute("aria-invalid");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("an error marks the control invalid and is read after the description", async () => {
		const screen = await render(Harness, { error: "Use six letters." });
		const input = screen.getByRole("textbox", { name: "Plan code" });
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		await expect.element(input).toHaveAccessibleDescription("Six letters. Use six letters.");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Use six letters.");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a fieldset names its group and disables every control in it", async () => {
		const screen = await render(Harness, { disabled: true });
		await expect.element(screen.getByRole("group", { name: "Contact" })).toBeVisible();
		await expect.element(screen.getByRole("checkbox", { name: "Email me" })).toBeDisabled();
	});
});
