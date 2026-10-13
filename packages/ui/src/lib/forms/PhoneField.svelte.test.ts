import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { setLocale } from "../i18n/index.js";
import Harness from "./PhoneField.test.svelte";

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("PhoneField", () => {
	it("mobile number → masked display + E.164 value", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await input.fill("11987654321");
		await expect.element(input).toHaveValue("(11) 98765-4321");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("+5511987654321");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("landline (10 digits) is also valid E.164", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await input.fill("1187654321");
		await expect.element(input).toHaveValue("(11) 8765-4321");
		await expect
			.element(screen.getByTestId("bound"))
			.toHaveTextContent("+55 1187654321".replace(" ", ""));
	});

	it("incomplete number yields an empty value", async () => {
		const screen = await render(Harness);
		await screen.getByLabelText("Phone").fill("119876");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("");
	});

	it("value drops back to empty when the number becomes incomplete again", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await input.fill("11987654321");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("+5511987654321");
		await input.click();
		await userEvent.keyboard("{End}{Backspace}{Backspace}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("");
	});

	it("initial E.164 renders as a national masked number (country code stripped)", async () => {
		const screen = await render(Harness, { initial: "+5511987654321" });
		await expect.element(screen.getByLabelText("Phone")).toHaveValue("(11) 98765-4321");
	});

	it("external E.164 updates the display", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "set external" }).click();
		await expect.element(screen.getByLabelText("Phone")).toHaveValue("(21) 98765-4321");
	});

	it("shows 'Telefone incompleto' on blur of a partial number", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await input.fill("1198");
		await userEvent.tab();
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Telefone incompleto");
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("no error on blur for a complete number or an empty field", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await input.click();
		await userEvent.tab();
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
		await input.fill("11987654321");
		await userEvent.tab();
		await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
	});

	it("uses tel-national autocomplete and numeric inputmode", async () => {
		const screen = await render(Harness);
		const input = screen.getByLabelText("Phone");
		await expect.element(input).toHaveAttribute("autocomplete", "tel-national");
		await expect.element(input).toHaveAttribute("inputmode", "numeric");
	});
});
