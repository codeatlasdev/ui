import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import RadioGroupHarness from "./RadioGroupHarness.test.svelte";

describe("RadioGroup", () => {
	it("exposes a radiogroup of labelled radios and axe passes", async () => {
		const screen = await render(RadioGroupHarness, { initial: "pro" });
		await expect.element(screen.getByRole("radiogroup")).toBeVisible();
		await expect
			.element(screen.getByRole("radio", { name: "Pro" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(screen.getByRole("radio", { name: "Free" }))
			.toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrow keys move selection and update the bound value", async () => {
		const onchange = vi.fn();
		const screen = await render(RadioGroupHarness, { initial: "free", onchange });
		screen.getByRole("radio", { name: "Free" }).element().focus();
		await userEvent.keyboard("{ArrowDown}");
		await expect
			.element(screen.getByRole("radio", { name: "Pro" }))
			.toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		expect(onchange).toHaveBeenLastCalledWith("pro");
		await userEvent.keyboard("{ArrowDown}");
		await expect
			.element(screen.getByRole("radio", { name: "Team" }))
			.toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("horizontal orientation uses ArrowRight/ArrowLeft", async () => {
		const screen = await render(RadioGroupHarness, { initial: "free", orientation: "horizontal" });
		screen.getByRole("radio", { name: "Free" }).element().focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("pro");
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("free");
	});

	it("clicking the label selects the radio", async () => {
		const screen = await render(RadioGroupHarness);
		await screen.getByText("Team").click();
		await expect.element(screen.getByRole("radio", { name: "Team" })).toBeChecked();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("team");
	});

	it("disabled group ignores interaction", async () => {
		const onchange = vi.fn();
		const screen = await render(RadioGroupHarness, { disabled: true, onchange });
		await screen.getByRole("radio", { name: "Pro" }).click({ force: true });
		expect(onchange).not.toHaveBeenCalled();
	});
});
