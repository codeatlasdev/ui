import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { setLocale } from "../../i18n/index.js";
import TextField from "./TextField.svelte";
import TextFieldAddons from "./TextFieldAddons.test.svelte";
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

describe("TextField revealable", () => {
	afterEach(() => setLocale("en"));

	it("toggles type and aria-pressed, keeping focus and the value", async () => {
		const screen = await render(TextField, {
			label: "Password",
			type: "password",
			revealable: true,
			value: "s3cret",
		});
		const input = screen.getByLabelText("Password");
		const toggle = screen.getByRole("button", { name: "Show password" });
		await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
		await expect.element(input).toHaveAttribute("type", "password");
		await toggle.click();
		await expect.element(input).toHaveAttribute("type", "text");
		await expect.element(input).toHaveValue("s3cret");
		const hide = screen.getByRole("button", { name: "Hide password" });
		await expect.element(hide).toHaveAttribute("aria-pressed", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await hide.click();
		await expect.element(input).toHaveAttribute("type", "password");
	});

	it("is localized", async () => {
		setLocale("pt-BR");
		const screen = await render(TextField, { label: "Senha", type: "password", revealable: true });
		await expect.element(screen.getByRole("button", { name: "Mostrar senha" })).toBeVisible();
	});

	it("does nothing for a non-password field", async () => {
		const screen = await render(TextField, { label: "Name", revealable: true });
		expect(screen.getByRole("button").elements()).toHaveLength(0);
	});

	it("does not change the field height", async () => {
		const plain = await render(TextField, { label: "A", type: "password" });
		const rev = await render(TextField, { label: "B", type: "password", revealable: true });
		const h = (s: typeof plain) =>
			(s.container.querySelector(".ca-tf__wrap") as HTMLElement).getBoundingClientRect().height;
		expect(h(rev)).toBe(h(plain));
	});

	it("is disabled with the field and leaves a disabled input untouched", async () => {
		const screen = await render(TextField, {
			label: "Password",
			type: "password",
			revealable: true,
			disabled: true,
		});
		await expect.element(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("stacks with a custom trailing snippet: reveal comes last", async () => {
		const screen = await render(TextField, {
			label: "Password",
			type: "password",
			revealable: true,
			trailing: createRawSnippet(() => ({ render: () => "<span data-testid='tr'>!</span>" })),
		});
		const trail = screen.container.querySelectorAll(".ca-tf__adorn--trail");
		expect(trail).toHaveLength(1);
		expect(trail[0].lastElementChild?.classList.contains("ca-tf__reveal")).toBe(true);
	});
});

describe("TextField below", () => {
	const link = createRawSnippet(() => ({ render: () => "<a href='/forgot'>Forgot password?</a>" }));

	it("renders a snippet under the field, described by it, link stays a link", async () => {
		const screen = await render(TextField, { label: "Password", type: "password", below: link });
		await expect
			.element(screen.getByRole("link", { name: "Forgot password?" }))
			.toHaveAttribute("href", "/forgot");
		await page.viewport(390, 800);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the error as the described-by and shows below after it", async () => {
		const screen = await render(TextField, {
			label: "Password",
			type: "password",
			error: "Wrong password",
			below: link,
		});
		const input = screen.getByLabelText("Password");
		await expect.element(input).toHaveAccessibleDescription("Wrong password");
		const below = screen.container.querySelector(".ca-tf__below") as HTMLElement;
		const err = screen.getByRole("alert").element();
		expect(err.compareDocumentPosition(below) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("TextField requiredIndicator", () => {
	it("false hides the asterisk but keeps the input required", async () => {
		const shown = await render(TextField, { label: "Email", required: true });
		expect(shown.container.querySelector(".ca-tf__req")).not.toBeNull();
		shown.unmount();
		const hidden = await render(TextField, {
			label: "Email",
			required: true,
			requiredIndicator: false,
		});
		expect(hidden.container.querySelector(".ca-tf__req")).toBeNull();
		await expect.element(hidden.getByRole("textbox", { name: "Email" })).toBeRequired();
	});
});

describe("TextField addons (InputGroup)", () => {
	it("text addons sit inside the border, around the input, in reading order", async () => {
		const screen = await render(TextFieldAddons);
		const input = screen.getByLabelText("Website").element() as HTMLInputElement;
		const wrap = input.closest(".ca-tf__wrap") as HTMLElement;
		const pre = wrap.querySelector(".ca-tf__addon--prefix") as HTMLElement;
		const suf = wrap.querySelector(".ca-tf__addon--suffix") as HTMLElement;
		expect(pre.textContent?.trim()).toBe("https://");
		expect(suf.textContent?.trim()).toBe(".com");
		const w = wrap.getBoundingClientRect();
		const i = input.getBoundingClientRect();
		expect(pre.getBoundingClientRect().right).toBeLessThanOrEqual(i.left + 1);
		expect(suf.getBoundingClientRect().left).toBeGreaterThanOrEqual(i.right - 1);
		// Flush with the border: the addon touches the wrapper's top and bottom edges.
		expect(pre.getBoundingClientRect().top).toBeGreaterThanOrEqual(w.top);
		expect(pre.getBoundingClientRect().height).toBeGreaterThan(w.height - 4);
	});

	it("text addons are announced with the field, after its label", async () => {
		const screen = await render(TextFieldAddons);
		const input = screen.getByRole("textbox", { name: "Website" });
		await expect.element(input).toHaveAccessibleDescription("https:// .com");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("an addon is announced together with the description and the error", async () => {
		const screen = await render(TextField, {
			label: "Price",
			prefix: "$",
			description: "Per seat",
		});
		await expect.element(screen.getByLabelText("Price")).toHaveAccessibleDescription("$ Per seat");
		await screen.rerender({ label: "Price", prefix: "$", error: "Required" });
		await expect.element(screen.getByLabelText("Price")).toHaveAccessibleDescription("$ Required");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("button addons keep their own name and click without moving the value", async () => {
		const oncopy = vi.fn();
		const onapply = vi.fn();
		const screen = await render(TextFieldAddons, { oncopy, onapply });
		await screen.getByRole("button", { name: "Copy address" }).click();
		expect(oncopy).toHaveBeenCalledOnce();
		await screen.getByRole("button", { name: "Apply" }).click();
		expect(onapply).toHaveBeenCalledOnce();
		await expect.element(screen.getByLabelText("Share link")).toHaveValue("ca.dev/x");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("Tab order follows the visual order and the focus ring wraps the whole group", async () => {
		const screen = await render(TextFieldAddons);
		await userEvent.tab();
		await userEvent.tab();
		await expect.element(screen.getByLabelText("Share link")).toHaveFocus();
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Copy address" })).toHaveFocus();
		const wrap = screen
			.getByRole("button", { name: "Copy address" })
			.element()
			.closest(".ca-tf__wrap") as HTMLElement;
		expect(getComputedStyle(wrap).boxShadow).not.toBe("none");
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Apply" })).toHaveFocus();
	});

	it("clicking a text addon focuses the input", async () => {
		const screen = await render(TextFieldAddons);
		const pre = screen.container.querySelector(".ca-tf__addon--prefix") as HTMLElement;
		pre.click();
		await expect.element(screen.getByLabelText("Website")).toHaveFocus();
	});

	it("disabled and error states reach the addons; axe passes in both", async () => {
		const off = await render(TextField, { label: "Site", prefix: "https://", disabled: true });
		await expect.element(off.getByLabelText("Site")).toBeDisabled();
		const addon = off.container.querySelector(".ca-tf__addon--prefix") as HTMLElement;
		expect(getComputedStyle(addon).color).toBe(
			getComputedStyle(off.getByLabelText("Site").element()).color
		);
		expect(await checkA11y(off.container)).toHaveNoViolations();
		await off.unmount();
		const bad = await render(TextField, { label: "Site", suffix: ".com", error: "Taken" });
		await expect.element(bad.getByLabelText("Site")).toHaveAttribute("aria-invalid", "true");
		expect(await checkA11y(bad.container)).toHaveNoViolations();
	});
});

describe("TextField in a narrow slot (#464)", () => {
	it("shrinks to a grid track narrower than its input's intrinsic width", async () => {
		await page.viewport(390, 844);
		const screen = await render(TextFieldAddons);
		const field = (screen.getByLabelText("Website").element() as HTMLInputElement).closest(
			".ca-tf"
		) as HTMLElement;
		const grid = document.createElement("div");
		grid.style.cssText = "display:grid;width:200px";
		field.parentElement?.insertBefore(grid, field);
		grid.append(field);
		expect(field.getBoundingClientRect().width).toBeLessThanOrEqual(200.5);
	});
});
