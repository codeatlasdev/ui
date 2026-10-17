import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import ComboboxHarness from "./ComboboxHarness.test.svelte";
import MultiHarness from "./ComboboxMultiHarness.test.svelte";

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

describe("Combobox multiple (#295)", () => {
	// Stale floating-layer popovers from a failed test persist through createPresence's exit
	// animation and confuse subsequent tests (duplicate role="listbox" in DOM, navigation lock).
	// Force-close any lingering popover before and after every test in this describe block.
	afterEach(async () => {
		// Close any open popup by pressing Escape
		await userEvent.keyboard("{Escape}");
		// Wait for all listboxes to leave the DOM (createPresence exit animation)
		await expect
			.poll(() => document.querySelectorAll('[role="listbox"]').length, { timeout: 3000 })
			.toBe(0);
	});

	const openList = async (props = {}) => {
		const screen = await render(MultiHarness, { label: "Labels", ...props });
		await screen.getByRole("button", { name: /^Labels/ }).click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await settled(); // wait for popup positioning animation to complete
		return screen;
	};

	it("is a multiselectable listbox, picking keeps it open and builds an array", async () => {
		const screen = await openList();
		await expect
			.element(screen.getByRole("listbox"))
			.toHaveAttribute("aria-multiselectable", "true");
		await screen.getByRole("option", { name: "Bug" }).click();
		await screen.getByRole("option", { name: "UI" }).click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("bug,ui");
		await expect
			.element(screen.getByRole("option", { name: "Bug" }))
			.toHaveAttribute("aria-selected", "true");
		await expect
			.element(screen.getByRole("option", { name: "Docs" }))
			.toHaveAttribute("aria-selected", "false");
		// Close the popup so it doesn't leak into the next test (createPresence exit animation
		// keeps it in the DOM across cleanup, and the stale option confuses the next click).
		await userEvent.keyboard("{Escape}");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
	});

	it("clicking a selected option toggles it off", async () => {
		const screen = await openList({ initial: ["bug", "ui"] });
		// Bug is at index 0 (highlighted by listbox.first() on open); Enter toggles it off
		await userEvent.keyboard("{Enter}");
		// Verify via ARIA — the deselected option updates immediately without harness roundtrip
		await expect
			.element(screen.getByRole("option", { name: "Bug" }))
			.toHaveAttribute("aria-selected", "false");
		await expect
			.element(screen.getByRole("option", { name: "UI" }))
			.toHaveAttribute("aria-selected", "true");
	});

	it("keyboard: Enter + ArrowDown + Enter selects two items, list stays open, onchange gets the array", async () => {
		const onchange = vi.fn();
		const screen = await openList({ onchange });
		// highlight starts at Bug (index 0) because listbox.first() fires on open
		await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("bug,docs");
		expect(onchange).toHaveBeenLastCalledWith(["bug", "docs"]);
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{Escape}");
	});

	it("selected values render as chips that remove with their button", async () => {
		const screen = await render(MultiHarness, { label: "Labels", initial: ["bug", "docs"] });
		await expect.element(screen.getByRole("button", { name: "Remove Bug" })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Remove Docs" })).toBeVisible();
		await screen.getByRole("button", { name: "Remove Bug" }).click();
		// Verify via DOM chip presence — no harness roundtrip needed
		await expect
			.element(screen.getByRole("button", { name: "Remove Bug" }))
			.not.toBeInTheDocument();
		await expect.element(screen.getByRole("button", { name: "Remove Docs" })).toBeVisible();
	});

	it("Backspace on an empty query removes the last chip", async () => {
		const screen = await openList({ initial: ["bug", "docs"] });
		await userEvent.keyboard("{Backspace}");
		// Last chip (docs) should be removed; Bug chip should remain
		await expect
			.element(screen.getByRole("button", { name: "Remove Docs" }))
			.not.toBeInTheDocument();
		await expect.element(screen.getByRole("button", { name: "Remove Bug" })).toBeVisible();
		await userEvent.keyboard("{Escape}");
	});

	it("creatable offers the query as a new option and appends it", async () => {
		const oncreate = vi.fn();
		const screen = await openList({ creatable: true, oncreate });
		await screen.getByRole("combobox", { name: "Search…" }).fill("urgent");
		await expect.element(screen.getByRole("option", { name: 'Create "urgent"' })).toBeVisible();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("urgent");
		expect(oncreate).toHaveBeenCalledWith("urgent");
		await expect.element(screen.getByRole("button", { name: "Remove urgent" })).toBeVisible();
	});

	it("creatable hides the create row when the query matches an option exactly", async () => {
		const screen = await openList({ creatable: true });
		await screen.getByRole("combobox", { name: "Search…" }).fill("bug");
		await expect.element(screen.getByRole("option", { name: "Bug" })).toBeVisible();
		await expect.element(screen.getByRole("option", { name: /Create/ })).not.toBeInTheDocument();
	});

	it("disabled options cannot be toggled and typing filters while chips stay", async () => {
		const screen = await openList({ initial: ["bug"] });
		await screen.getByRole("option", { name: "Old" }).click({ force: true });
		await settled();
		expect(screen.getByTestId("bound").element().textContent).toBe("bug");
		await screen.getByRole("combobox", { name: "Search…" }).fill("do");
		await expect.element(screen.getByRole("option", { name: "Docs" })).toBeVisible();
		await expect.element(screen.getByRole("option", { name: "Bug" })).not.toBeInTheDocument();
		await expect.element(screen.getByRole("button", { name: "Remove Bug" })).toBeVisible();
	});

	it("Backspace with text in the query edits the text and keeps chips", async () => {
		const screen = await openList({ initial: ["bug"] });
		await screen.getByRole("combobox", { name: "Search…" }).fill("ab");
		await userEvent.keyboard("{Backspace}");
		await expect.element(screen.getByRole("combobox", { name: "Search…" })).toHaveValue("a");
		await expect.element(screen.getByRole("button", { name: "Remove Bug" })).toBeVisible();
	});

	it("an external value change updates chips and aria-selected", async () => {
		const screen = await render(MultiHarness, { label: "Labels", initial: ["bug"] });
		await expect.element(screen.getByRole("group", { name: "Selected values" })).toBeVisible();
		await screen.getByRole("button", { name: "Remove Bug" }).click();
		await expect
			.element(screen.getByRole("group", { name: "Selected values" }))
			.not.toBeInTheDocument();
		await expect.poll(() => screen.getByTestId("bound").element().textContent).toBe("");
	});

	it("axe passes open with a create row and no results", async () => {
		const screen = await openList({ creatable: true });
		await screen.getByRole("combobox", { name: "Search…" }).fill("urgent");
		await expect.element(screen.getByRole("option", { name: 'Create "urgent"' })).toBeVisible();
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();
		await screen.getByRole("combobox", { name: "Search…" }).fill("zzz");
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();
	});

	it("axe passes closed with chips and open", async () => {
		const screen = await render(MultiHarness, { label: "Labels", initial: ["bug"] });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.getByRole("button", { name: /^Labels/ }).click();
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();
	});
});

describe("Combobox single creatable (#295)", () => {
	it("creating replaces the single value and closes the list", async () => {
		const oncreate = vi.fn();
		const screen = await render(ComboboxHarness, {
			label: "City",
			creatable: true,
			oncreate,
			initial: "ny",
		});
		await screen.getByRole("button", { name: /^City/ }).click();
		await screen.getByRole("combobox", { name: "Search…" }).fill("Paris");
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("Paris");
		expect(oncreate).toHaveBeenCalledWith("Paris");
		await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
	});
});
