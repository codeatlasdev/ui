import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import SelectHarness from "./SelectHarness.test.svelte";

// Page-level landmark rule does not apply to an isolated component rendered into <body>.
const PORTAL_RULES = { rules: { region: { enabled: false } } };

describe("Select", () => {
	it("label names the trigger button and axe passes closed", async () => {
		const screen = await render(SelectHarness, { label: "Letter", placeholder: "Choose" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(trigger).toHaveTextContent("Choose");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("opens by keyboard, arrows + Enter select, bound value reflects", async () => {
		const screen = await render(SelectHarness, { label: "Letter" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();

		await userEvent.keyboard("{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("b");
		await expect.element(trigger).toHaveTextContent("Beta");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("Escape closes without changing the value", async () => {
		const screen = await render(SelectHarness, { label: "Letter", initial: "a" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		await trigger.click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("a");
	});

	it("selecting an option by click calls onchange and marks it selected", async () => {
		const onchange = vi.fn();
		const screen = await render(SelectHarness, { label: "Letter", onchange });
		await screen.getByRole("button", { name: "Letter" }).click();
		await screen.getByRole("option", { name: "Gamma" }).click();
		expect(onchange).toHaveBeenCalledWith("c");
		await screen.getByRole("button", { name: "Letter" }).click();
		await expect
			.element(screen.getByRole("option", { name: "Gamma" }))
			.toHaveAttribute("aria-selected", "true");
	});

	it("error sets aria-invalid, role=alert and describes the trigger", async () => {
		const screen = await render(SelectHarness, {
			label: "Letter",
			error: "Choose an option",
			description: "Hint",
		});
		const trigger = screen.getByRole("button", { name: "Letter" });
		await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Choose an option");
		expect(trigger.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without label the placeholder names the trigger", async () => {
		const screen = await render(SelectHarness, { placeholder: "Select a letter" });
		await expect.element(screen.getByRole("button", { name: "Select a letter" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
