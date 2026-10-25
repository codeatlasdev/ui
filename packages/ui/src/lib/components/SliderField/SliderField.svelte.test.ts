import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SliderFieldHarness from "./SliderFieldHarness.test.svelte";

describe("SliderField", () => {
	it("names the slider and the number field after the label and passes axe", async () => {
		const screen = await render(SliderFieldHarness);
		await expect.element(screen.getByRole("slider", { name: "Radius" })).toBeInTheDocument();
		await expect.element(screen.getByRole("textbox", { name: "Radius" })).toHaveValue("0.80");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a typed value is clamped and snapped to step on Enter", async () => {
		const screen = await render(SliderFieldHarness);
		const input = screen.getByRole("textbox", { name: "Radius" });
		await input.fill("1.234");
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("1.25");
		await input.fill("9");
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("2");
		await expect.element(input).toHaveValue("2.00");
	});

	it("arrow keys on the slider move by step and update the number", async () => {
		const screen = await render(SliderFieldHarness, { initial: 1 });
		screen.getByRole("slider", { name: "Radius" }).element().focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("1.05");
		await expect.element(screen.getByRole("textbox", { name: "Radius" })).toHaveValue("1.05");
	});
});
