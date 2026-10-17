import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import TextField from "./TextField.svelte";
import TextFieldRef from "./TextFieldRef.test.svelte";

describe("TextField", () => {
	it("associates the label with the input", async () => {
		const screen = await render(TextField, { label: "E-mail" });
		const input = screen.getByLabelText("E-mail");
		await expect.element(input).toBeVisible();
		await input.fill("a@b.co");
		await expect.element(input).toHaveValue("a@b.co");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("required keeps the accessible name free of the decorative asterisk", async () => {
		const screen = await render(TextField, { label: "Name", required: true });
		await expect.element(screen.getByRole("textbox", { name: "Name" })).toBeRequired();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is linked through aria-describedby", async () => {
		const screen = await render(TextField, {
			label: "Username",
			description: "At least 3 letters",
		});
		const input = screen.getByLabelText("Username");
		await expect.element(input).toHaveAccessibleDescription("At least 3 letters");
		await expect.element(input).not.toHaveAttribute("aria-invalid");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("error sets aria-invalid, role=alert and becomes the accessible description", async () => {
		const screen = await render(TextField, {
			label: "Password",
			description: "Hint",
			error: "Too short",
		});
		const input = screen.getByLabelText("Password");
		await expect.element(input).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Too short");
		await expect.element(input).toHaveAccessibleDescription("Too short");
		const describedBy = input.element().getAttribute("aria-describedby");
		expect(describedBy).toBe(screen.getByRole("alert").element().id);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("fires oninput on every keystroke and onchange on commit", async () => {
		const oninput = vi.fn();
		const onchange = vi.fn();
		const screen = await render(TextField, { label: "Field", oninput, onchange });
		const input = screen.getByLabelText("Field");
		await input.fill("abc");
		expect(oninput).toHaveBeenLastCalledWith("abc");
		await input.element().blur();
		expect(onchange).toHaveBeenCalledWith("abc");
	});

	it("disabled input is not editable", async () => {
		const screen = await render(TextField, { label: "Locked", disabled: true });
		await expect.element(screen.getByLabelText("Locked")).toBeDisabled();
	});
	it("forwards native attributes and handlers to the input", async () => {
		const onkeydown = vi.fn();
		const onfocus = vi.fn();
		const screen = await render(TextField, {
			label: "Name",
			onfocus,
			maxlength: 5,
			inputmode: "numeric",
			"data-testid": "name",
			onkeydown,
		});
		const input = screen.getByTestId("name");
		await expect.element(input).toHaveAttribute("maxlength", "5");
		await expect.element(input).toHaveAttribute("inputmode", "numeric");
		await input.fill("1234567");
		await expect.element(input).toHaveValue("12345");
		await input.element().focus();
		await userEvent.keyboard("{Enter}");
		expect(onkeydown).toHaveBeenCalled();
		expect(onfocus).toHaveBeenCalled();
	});

	it("ref is the input element", async () => {
		const screen = await render(TextFieldRef, { label: "Name" });
		await expect.element(screen.getByTestId("ref-tag")).toHaveTextContent("INPUT");
		await screen.getByRole("button", { name: "focus" }).click();
		expect(document.activeElement).toBe(screen.getByLabelText("Name").element());
	});

	it("hideLabel keeps the label for assistive tech only", async () => {
		const screen = await render(TextField, { label: "Name", hideLabel: true });
		const input = screen.getByRole("textbox", { name: "Name" });
		await expect.element(input).toBeVisible();
		const label = screen.container.querySelector<HTMLElement>("label.ca-tf__label");
		expect(label?.classList.contains("ca-sr-only")).toBe(true);
		expect(label?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("aria-label names a field without a label", async () => {
		const screen = await render(TextField, { "aria-label": "Search" });
		await expect.element(screen.getByRole("textbox", { name: "Search" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
