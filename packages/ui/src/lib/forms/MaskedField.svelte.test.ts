import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import MaskedField from "./MaskedField.svelte";
import Harness from "./MaskedField.test.svelte";
import { maskCEP, maskDateBR } from "./masks";

describe("MaskedField", () => {
	it("masks while typing and binds the masked value", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("CPF");
		await input.fill("12345678909");
		await expect.element(input).toHaveValue("123.456.789-09");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("123.456.789-09");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("drops extra digits and non-digits", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("CPF");
		await input.fill("12a3.4b5678909999");
		await expect.element(input).toHaveValue("123.456.789-09");
	});

	it("keeps the caret on the same digit when inserting mid-string", async () => {
		const screen = await render(Harness, { initial: "123.456.789-09" });
		const input = screen.getByLabelText("CPF");
		await expect.element(input).toHaveValue("123.456.789-09");
		const el = input.element() as HTMLInputElement;
		el.focus();
		// caret between "1" and "2" (after 1 digit)
		el.setSelectionRange(1, 1);
		await userEvent.keyboard("9");
		// 11 digits max: the trailing digit is pushed out, the rest shifts right
		await expect.element(input).toHaveValue("192.345.678-90");
		// caret must sit right after the inserted digit "9" (index 2 in the masked text)
		expect(el.selectionStart).toBe(2);
		expect(el.selectionEnd).toBe(2);
		await userEvent.keyboard("8");
		await expect.element(input).toHaveValue("198.234.567-89");
		expect(el.selectionStart).toBe(3);
	});
	it("caret hops over a literal separator that the mask inserts", async () => {
		const screen = await render(MaskedField, { label: "Date", mask: maskDateBR });
		const input = screen.getByLabelText("Date");
		const el = input.element() as HTMLInputElement;
		await input.fill("2512");
		await expect.element(input).toHaveValue("25/12");
		el.focus();
		el.setSelectionRange(2, 2); // after "25", before "/"
		await userEvent.keyboard("0");
		await expect.element(input).toHaveValue("25/01/2");
		// 3rd digit "0" belongs after the slash: caret follows the digit, not the index
		expect(el.selectionStart).toBe(4);
	});

	it("deleting a digit mid-string re-masks and keeps the caret in place", async () => {
		const screen = await render(Harness, { initial: "123.456.789-09" });
		const input = screen.getByLabelText("CPF");
		const el = input.element() as HTMLInputElement;
		el.focus();
		el.setSelectionRange(5, 5); // "123.4|56"
		await userEvent.keyboard("{Backspace}");
		await expect.element(input).toHaveValue("123.567.890-9");
		// caret stays right after the 3rd digit (the mask's "." that follows is skipped)
		expect(el.selectionStart).toBe(3);
	});

	it("validate runs on blur only for non-empty values and clears on input", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("CPF");
		await input.click();
		await userEvent.tab();
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();

		await input.fill("11111111111");
		await userEvent.tab();
		const alert = screen.getByRole("alert");
		await expect.element(alert).toHaveTextContent("Invalid CPF");
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await input.fill("12345678909");
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
		await userEvent.tab();
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
	});

	it("external `error` wins over validation", async () => {
		const screen = await render(MaskedField, { label: "CEP", mask: maskCEP, error: "Required" });
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Required");
	});

	it("digit-only masks use numeric inputmode; overridable", async () => {
		const a = await render(MaskedField, { label: "CEP", mask: maskCEP });
		await expect.element(a.getByLabelText("CEP")).toHaveAttribute("inputmode", "numeric");
		a.unmount();
		const b = await render(MaskedField, { label: "CEP", mask: maskCEP, inputmode: "text" });
		await expect.element(b.getByLabelText("CEP")).toHaveAttribute("inputmode", "text");
	});

	it("letter-capable masks fall back to text inputmode", async () => {
		const alnum = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
		const screen = await render(MaskedField, { label: "Plate", mask: alnum });
		await expect.element(screen.getByLabelText("Plate")).toHaveAttribute("inputmode", "text");
	});

	it("oninput receives the masked value", async () => {
		const oninput = vi.fn();
		const screen = await render(MaskedField, { label: "CEP", mask: maskCEP, oninput });
		await screen.getByLabelText("CEP").fill("01310100");
		expect(oninput).toHaveBeenLastCalledWith("01310-100");
	});

	it("initial value is masked on mount", async () => {
		const screen = await render(MaskedField, { label: "CEP", mask: maskCEP, value: "01310100" });
		await expect.element(screen.getByLabelText("CEP")).toHaveValue("01310-100");
	});
});
