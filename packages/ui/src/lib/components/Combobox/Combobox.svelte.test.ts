import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import ComboboxHarness from "./ComboboxHarness.test.svelte";

// Page-level landmark rule does not apply to an isolated component rendered into <body>.
const PORTAL_RULES = { rules: { region: { enabled: false } } };

describe("Combobox", () => {
	it("label names the trigger and axe passes closed", async () => {
		const screen = await render(ComboboxHarness, { label: "Estado", placeholder: "Escolha" });
		const trigger = screen.getByRole("button", { name: "Estado" });
		await expect.element(trigger).toHaveTextContent("Escolha");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("ariaLabel names the trigger and the list when there is no visible label", async () => {
		const screen = await render(ComboboxHarness, { ariaLabel: "Estado", placeholder: "Escolha" });
		// Name = ariaLabel + visible text, so it always contains the visible label (WCAG 2.5.3).
		const trigger = screen.getByRole("button", { name: "Estado Escolha" });
		await expect.element(trigger.getByText("Escolha")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox", { name: "Estado" })).toBeVisible();
	});

	it("opens by keyboard, arrows + Enter select, bound value reflects", async () => {
		const screen = await render(ComboboxHarness, { label: "Estado" });
		const trigger = screen.getByRole("button", { name: "Estado" });
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();

		await userEvent.keyboard("{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("rj");
		await expect.element(trigger).toHaveTextContent("Rio de Janeiro");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
	});

	it("typing filters the options and shows the empty text when nothing matches", async () => {
		const screen = await render(ComboboxHarness, { label: "Estado", emptyText: "Nada encontrado" });
		await screen.getByRole("button", { name: "Estado" }).click();
		const search = screen.getByRole("combobox", { name: "Search…" });
		await search.fill("rio");
		await expect.element(screen.getByRole("option", { name: "Rio de Janeiro" })).toBeVisible();
		await expect
			.element(screen.getByRole("option", { name: "Minas Gerais" }))
			.not.toBeInTheDocument();
		await search.fill("zzz");
		await expect.element(screen.getByText("Nada encontrado")).toBeVisible();
	});

	it("click selects, calls onchange and marks the option selected", async () => {
		const onchange = vi.fn();
		const screen = await render(ComboboxHarness, { label: "Estado", onchange });
		await screen.getByRole("button", { name: "Estado" }).click();
		await screen.getByRole("option", { name: "Minas Gerais" }).click();
		expect(onchange).toHaveBeenCalledWith("mg");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("mg");
	});

	it("Escape closes the list", async () => {
		const screen = await render(ComboboxHarness, { label: "Estado", initial: "sp" });
		await screen.getByRole("button", { name: "Estado" }).click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("sp");
	});

	it("error sets aria-invalid, role=alert and describes the trigger", async () => {
		const screen = await render(ComboboxHarness, {
			label: "Estado",
			error: "Obrigatório",
			description: "Dica",
		});
		const trigger = screen.getByRole("button", { name: "Estado" });
		await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Obrigatório");
		expect(trigger.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
