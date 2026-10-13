import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import Harness from "./MoneyInput.test.svelte";

/** Select the whole text and type over it (what a user does to enter a fresh amount). */
async function typeOver(input: { element(): Element }, text: string) {
	const el = input.element() as HTMLInputElement;
	el.focus();
	el.select();
	await userEvent.keyboard(text);
}

describe("MoneyInput", () => {
	it("starts at R$ 0,00 and binds integer cents", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByLabelText("Amount")).toHaveValue("R$ 0,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("0");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("fill 123456 → R$ 1.234,56 with bound value 123456", async () => {
		const onchange = vi.fn();
		const screen = await render(Harness, { onchange });
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "123456");
		await expect.element(input).toHaveValue("R$ 1.234,56");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("123456");
		expect(onchange).toHaveBeenLastCalledWith(123456);
	});

	it("typing digits shifts them in from the right (type-to-fill)", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Amount");
		await input.click();
		await userEvent.keyboard("1");
		await expect.element(input).toHaveValue("R$ 0,01");
		await userEvent.keyboard("23");
		await expect.element(input).toHaveValue("R$ 1,23");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("123");
	});

	it("backspace removes the last digit", async () => {
		const screen = await render(Harness, { initial: 123456 });
		const input = screen.getByLabelText("Amount");
		await expect.element(input).toHaveValue("R$ 1.234,56");
		await input.click();
		await userEvent.keyboard("{End}{Backspace}");
		await expect.element(input).toHaveValue("R$ 123,45");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("12345");
	});

	it("ignores letters", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "ab12cd");
		await expect.element(input).toHaveValue("R$ 0,12");
	});

	it("clamps to max", async () => {
		const screen = await render(Harness, { max: 100000 });
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "999999");
		await expect.element(input).toHaveValue("R$ 1.000,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("100000");
	});

	it("clamps to min", async () => {
		const screen = await render(Harness, { min: 1000, initial: 2000 });
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "5");
		await expect.element(input).toHaveValue("R$ 10,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("1000");
	});

	it("without allowNegative a '-' is ignored", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "-500");
		await expect.element(input).toHaveValue("R$ 5,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("500");
	});

	it("allowNegative: '-' makes the amount negative", async () => {
		const screen = await render(Harness, { allowNegative: true });
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "-500");
		await expect.element(input).toHaveValue("-R$ 5,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("-500");
	});

	it("allowNegative respects min below zero", async () => {
		const screen = await render(Harness, { allowNegative: true, min: -1000 });
		const input = screen.getByLabelText("Amount");
		await typeOver(input, "-99999");
		await expect.element(input).toHaveValue("-R$ 10,00");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("-1000");
	});

	it("external value changes refresh the display", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "set 50" }).click();
		await expect.element(screen.getByLabelText("Amount")).toHaveValue("R$ 50,00");
	});

	it("blur normalises a cleared field back to R$ 0,00", async () => {
		const screen = await render(Harness, { initial: 500 });
		const input = screen.getByLabelText("Amount");
		await input.fill("");
		await expect.element(input).toHaveValue("");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("0");
		await userEvent.tab();
		await expect.element(input).toHaveValue("R$ 0,00");
	});

	it("initial value outside bounds is displayed clamped", async () => {
		const screen = await render(Harness, { initial: 999999, max: 5000 });
		await expect.element(screen.getByLabelText("Amount")).toHaveValue("R$ 50,00");
	});
});
