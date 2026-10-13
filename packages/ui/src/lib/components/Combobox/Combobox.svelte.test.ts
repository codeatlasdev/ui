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
		const screen = await render(ComboboxHarness, { label: "State", placeholder: "Choose" });
		const trigger = screen.getByRole("button", { name: "State" });
		await expect.element(trigger).toHaveTextContent("Choose");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("ariaLabel names the trigger and the list when there is no visible label", async () => {
		const screen = await render(ComboboxHarness, { ariaLabel: "State", placeholder: "Choose" });
		// Name = ariaLabel + visible text, so it always contains the visible label (WCAG 2.5.3).
		const trigger = screen.getByRole("button", { name: "State Choose" });
		await expect.element(trigger.getByText("Choose")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox", { name: "State" })).toBeVisible();
	});

	it("opens by keyboard, arrows + Enter select, bound value reflects", async () => {
		const screen = await render(ComboboxHarness, { label: "State" });
		const trigger = screen.getByRole("button", { name: "State" });
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();

		await userEvent.keyboard("{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("la");
		await expect.element(trigger).toHaveTextContent("Los Angeles");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
	});

	it("typing filters the options and shows the empty text when nothing matches", async () => {
		const screen = await render(ComboboxHarness, { label: "State", emptyText: "Nothing found" });
		await screen.getByRole("button", { name: "State" }).click();
		const search = screen.getByRole("combobox", { name: "Search…" });
		await search.fill("los");
		await expect.element(screen.getByRole("option", { name: "Los Angeles" })).toBeVisible();
		await expect.element(screen.getByRole("option", { name: "Chicago" })).not.toBeInTheDocument();
		await search.fill("zzz");
		await expect.element(screen.getByText("Nothing found")).toBeVisible();
	});

	it("click selects, calls onchange and marks the option selected", async () => {
		const onchange = vi.fn();
		const screen = await render(ComboboxHarness, { label: "State", onchange });
		await screen.getByRole("button", { name: "State" }).click();
		await screen.getByRole("option", { name: "Chicago" }).click();
		expect(onchange).toHaveBeenCalledWith("chi");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("chi");
	});

	it("Escape closes the list", async () => {
		const screen = await render(ComboboxHarness, { label: "State", initial: "ny" });
		await screen.getByRole("button", { name: "State" }).click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("ny");
	});

	it("error sets aria-invalid, role=alert and describes the trigger", async () => {
		const screen = await render(ComboboxHarness, {
			label: "State",
			error: "Required",
			description: "Hint",
		});
		const trigger = screen.getByRole("button", { name: "State" });
		await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Required");
		expect(trigger.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
