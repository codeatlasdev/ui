import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { setLocale } from "../i18n/index.js";
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

	describe("currency and locale", () => {
		afterEach(() => setLocale("en"));

		it("keeps the BRL format by default even when the UI language is English", async () => {
			setLocale("en");
			const screen = await render(Harness, { initial: 123456 });
			await expect.element(screen.getByLabelText("Amount")).toHaveValue("R$ 1.234,56");
		});

		it("USD / en-US: digits shift in as cents", async () => {
			const onchange = vi.fn();
			const screen = await render(Harness, { currency: "USD", locale: "en-US", onchange });
			const input = screen.getByLabelText("Amount");
			await expect.element(input).toHaveValue("$0.00");
			await typeOver(input, "123456");
			await expect.element(input).toHaveValue("$1,234.56");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("123456");
			expect(onchange).toHaveBeenLastCalledWith(123456);
		});

		it("JPY has no decimals: typed digits are whole yen", async () => {
			const screen = await render(Harness, { currency: "JPY", locale: "en-US" });
			const input = screen.getByLabelText("Amount");
			await expect.element(input).toHaveValue("¥0");
			await typeOver(input, "1234");
			await expect.element(input).toHaveValue("¥1,234");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("1234");
		});

		it("a set currency takes its locale from the active UI language", async () => {
			setLocale("en");
			const screen = await render(Harness, { currency: "EUR", initial: 123456 });
			await expect.element(screen.getByLabelText("Amount")).toHaveValue("€1,234.56");
		});

		it("an explicit locale wins over the UI language", async () => {
			setLocale("en");
			const screen = await render(Harness, { currency: "EUR", locale: "de-DE", initial: 123456 });
			await expect.element(screen.getByLabelText("Amount")).toHaveValue("1.234,56 €");
		});
	});
	describe("typed entry, paste and sign (#1208)", () => {
		/** Put `text` on the real clipboard through the scratch input. */
		async function clip(screen: Awaited<ReturnType<typeof render>>, text: string) {
			const scratch = screen.getByLabelText("Scratch");
			await scratch.fill(text);
			(scratch.element() as HTMLInputElement).select();
			await userEvent.copy();
		}

		it("pt-BR typed amounts: 12,5 / 1.234 / 1.234,56", async () => {
			const screen = await render(Harness, { entry: "typed" });
			const input = screen.getByLabelText("Amount");
			const bound = screen.getByTestId("bound");
			await typeOver(input, "12,5");
			await expect.element(bound).toHaveTextContent("1250");
			await expect.element(input).toHaveValue("12,5");
			await typeOver(input, "1.234");
			await expect.element(bound).toHaveTextContent("123400");
			await typeOver(input, "1.234,56");
			await expect.element(bound).toHaveTextContent("123456");
			await userEvent.tab();
			await expect.element(input).toHaveValue("R$ 1.234,56");
		});

		it("typed entry asks for a decimal keypad, fill for a numeric one", async () => {
			const typed = await render(Harness, { entry: "typed" });
			await expect.element(typed.getByLabelText("Amount")).toHaveAttribute("inputmode", "decimal");
			typed.unmount();
			const fill = await render(Harness);
			await expect.element(fill.getByLabelText("Amount")).toHaveAttribute("inputmode", "numeric");
		});

		it("typed entry: max clamps the amount and the field on blur", async () => {
			const screen = await render(Harness, { entry: "typed", max: 10000 });
			const input = screen.getByLabelText("Amount");
			await typeOver(input, "20000");
			await userEvent.tab();
			await expect.element(input).toHaveValue("R$ 100,00");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("10000");
		});

		it("pasting an amount into a fill field reads its decimal comma", async () => {
			const screen = await render(Harness);
			await clip(screen, "12,5");
			const input = screen.getByLabelText("Amount");
			(input.element() as HTMLInputElement).focus();
			(input.element() as HTMLInputElement).select();
			await userEvent.paste();
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("1250");
			await expect.element(input).toHaveValue("R$ 12,50");
		});

		it("pasting text with no digits keeps the value", async () => {
			for (const entry of ["fill", "typed"] as const) {
				const screen = await render(Harness, { entry, initial: 123456 });
				await clip(screen, "abc");
				const input = screen.getByLabelText("Amount");
				(input.element() as HTMLInputElement).focus();
				(input.element() as HTMLInputElement).select();
				await userEvent.paste();
				await expect.element(screen.getByTestId("bound")).toHaveTextContent("123456");
				await expect.element(input).toHaveValue("R$ 1.234,56");
				screen.unmount();
			}
		});

		it("allowNegative: a named sign toggle, reachable by Tab, flips the value", async () => {
			const screen = await render(Harness, { allowNegative: true, initial: 500 });
			const input = screen.getByLabelText("Amount");
			const sign = screen.getByRole("button", { name: "Negative" });
			await expect.element(sign).toHaveAttribute("aria-pressed", "false");
			(input.element() as HTMLInputElement).focus();
			await userEvent.tab();
			await expect.element(sign).toHaveFocus();
			await userEvent.keyboard("{Enter}");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("-500");
			await expect.element(input).toHaveValue("-R$ 5,00");
			await expect.element(sign).toHaveAttribute("aria-pressed", "true");
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			await sign.click();
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("500");
		});

		it("signToggle={false} hides the button; no button without allowNegative", async () => {
			const off = await render(Harness, { allowNegative: true, signToggle: false });
			expect(off.container.querySelector("button[aria-pressed]")).toBeNull();
			off.unmount();
			const plain = await render(Harness);
			expect(plain.container.querySelector("button[aria-pressed]")).toBeNull();
		});
	});
});
