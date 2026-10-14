import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import SelectForm from "./SelectForm.test.svelte";
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
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("[b]");
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
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("[a]");
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

	it("required blocks form submit while empty and focuses the trigger", async () => {
		const onsubmit = vi.fn();
		const screen = await render(SelectForm, { onsubmit });
		await userEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(onsubmit).not.toHaveBeenCalled();
		await expect.element(screen.getByRole("button", { name: /Plan/ })).toHaveFocus();
		await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
		await userEvent.click(screen.getByRole("option", { name: "Pro" }));
		await userEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(onsubmit).toHaveBeenCalledOnce();
	});

	describe("empty-string option", () => {
		const options = [
			{ value: "", label: "All" },
			{ value: "a", label: "A" },
		];

		it("value='' with an '' option shows its label, not the placeholder", async () => {
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
				initial: "",
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await expect.element(trigger).toHaveTextContent("All");
			await expect.element(trigger).not.toHaveTextContent("Choose");
			expect(trigger.element().hasAttribute("data-placeholder")).toBe(false);
			expect(trigger.element().querySelector(".ca-sel__value--placeholder")).toBeNull();
		});

		it("placeholder shows only when value is undefined", async () => {
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await expect.element(trigger).toHaveTextContent("Choose");
			expect(trigger.element().hasAttribute("data-placeholder")).toBe(true);
			expect(trigger.element().querySelector(".ca-sel__value--placeholder")).not.toBeNull();
		});

		it("value='' without a matching option still shows the placeholder", async () => {
			const screen = await render(SelectHarness, {
				label: "Plan",
				placeholder: "Choose",
				initial: "",
			});
			await expect
				.element(screen.getByRole("button", { name: "Plan" }))
				.toHaveTextContent("Choose");
		});

		it("selecting A then All calls onchange('') and shows All again", async () => {
			const onchange = vi.fn();
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
				initial: "",
				onchange,
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await trigger.click();
			await screen.getByRole("option", { name: "A" }).click();
			expect(onchange).toHaveBeenLastCalledWith("a");
			await expect.element(trigger).toHaveTextContent("A");
			await trigger.click();
			await screen.getByRole("option", { name: "All" }).click();
			expect(onchange).toHaveBeenLastCalledWith("");
			await expect.element(trigger).toHaveTextContent("All");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("[]");
		});

		it("the '' option is marked selected in the list", async () => {
			const screen = await render(SelectHarness, { label: "Filter", options, initial: "" });
			await screen.getByRole("button", { name: "Filter" }).click();
			await expect
				.element(screen.getByRole("option", { name: "All" }))
				.toHaveAttribute("aria-selected", "true");
		});
	});
});
