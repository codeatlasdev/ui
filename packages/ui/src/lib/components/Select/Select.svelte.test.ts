import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import SelectOnly from "./Select.svelte";
import SelectForm from "./SelectForm.test.svelte";
import SelectHarness from "./SelectHarness.test.svelte";

// Page-level landmark rule does not apply to an isolated component rendered into <body>.
const PORTAL_RULES = { rules: { region: { enabled: false } } };

describe("Select", () => {
	it("label names the trigger button and axe passes closed", async () => {
		const screen = await render(SelectHarness, { label: "Letter", placeholder: "Choose" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(trigger).toHaveTextContent("Choose");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("opens by keyboard, arrows + Enter select, bound value reflects", async () => {
		const screen = await render(SelectHarness, { label: "Letter" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		trigger.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();

		await userEvent.keyboard("{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("[b]");
		await expect.element(trigger).toHaveTextContent("Beta");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("Escape closes without changing the value", async () => {
		const screen = await render(SelectHarness, { label: "Letter", initial: "a" });
		const trigger = screen.getByRole("button", { name: "Letter" });
		await trigger.click();
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("[a]");
	});

	it("selecting an option by click calls onchange and marks it selected", async () => {
		const onchange = vi.fn();
		const screen = await render(SelectHarness, { label: "Letter", onchange });
		await screen.getByRole("button", { name: "Letter" }).click();
		await screen.getByRole("option", { name: "Gamma" }).click();
		expect(onchange).toHaveBeenCalledWith("c");
		await screen.getByRole("button", { name: "Letter" }).click();
		await expect
			.element(screen.getByRole("option", { name: "Gamma" }))
			.toHaveAttribute("aria-selected", "true");
	});

	it("error sets aria-invalid, role=alert and describes the trigger", async () => {
		const screen = await render(SelectHarness, {
			label: "Letter",
			error: "Choose an option",
			description: "Hint",
		});
		const trigger = screen.getByRole("button", { name: "Letter" });
		await expect.element(trigger).toHaveAttribute("aria-invalid", "true");
		await expect.element(screen.getByRole("alert")).toHaveTextContent("Choose an option");
		expect(trigger.element().getAttribute("aria-describedby")).toBe(
			screen.getByRole("alert").element().id
		);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without label the placeholder names the trigger", async () => {
		const screen = await render(SelectHarness, { placeholder: "Select a letter" });
		await expect.element(screen.getByRole("button", { name: "Select a letter" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("required blocks form submit while empty and focuses the trigger", async () => {
		const onsubmit = vi.fn();
		const screen = await render(SelectForm, { onsubmit });
		await userEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(onsubmit).not.toHaveBeenCalled();
		await expect.element(screen.getByRole("button", { name: /Plan/ })).toHaveFocus();
		await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
		await userEvent.click(screen.getByRole("option", { name: "Pro" }));
		await userEvent.click(screen.getByRole("button", { name: "Send" }));
		expect(onsubmit).toHaveBeenCalledOnce();
	});

	describe("empty-string option", () => {
		const options = [
			{ value: "", label: "All" },
			{ value: "a", label: "A" },
		];

		it("value='' with an '' option shows its label, not the placeholder", async () => {
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
				initial: "",
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await expect.element(trigger).toHaveTextContent("All");
			await expect.element(trigger).not.toHaveTextContent("Choose");
			expect(trigger.element().hasAttribute("data-placeholder")).toBe(false);
			expect(trigger.element().querySelector(".ca-sel__value--placeholder")).toBeNull();
		});

		it("placeholder shows only when value is undefined", async () => {
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await expect.element(trigger).toHaveTextContent("Choose");
			expect(trigger.element().hasAttribute("data-placeholder")).toBe(true);
			expect(trigger.element().querySelector(".ca-sel__value--placeholder")).not.toBeNull();
		});

		it("value='' without a matching option still shows the placeholder", async () => {
			const screen = await render(SelectHarness, {
				label: "Plan",
				placeholder: "Choose",
				initial: "",
			});
			await expect
				.element(screen.getByRole("button", { name: "Plan" }))
				.toHaveTextContent("Choose");
		});

		it("selecting A then All calls onchange('') and shows All again", async () => {
			const onchange = vi.fn();
			const screen = await render(SelectHarness, {
				label: "Filter",
				placeholder: "Choose",
				options,
				initial: "",
				onchange,
			});
			const trigger = screen.getByRole("button", { name: "Filter" });
			await trigger.click();
			await screen.getByRole("option", { name: "A" }).click();
			expect(onchange).toHaveBeenLastCalledWith("a");
			await expect.element(trigger).toHaveTextContent("A");
			await trigger.click();
			await screen.getByRole("option", { name: "All" }).click();
			expect(onchange).toHaveBeenLastCalledWith("");
			await expect.element(trigger).toHaveTextContent("All");
			await expect.element(screen.getByTestId("bound")).toHaveTextContent("[]");
		});

		it("the '' option is marked selected in the list", async () => {
			const screen = await render(SelectHarness, { label: "Filter", options, initial: "" });
			await screen.getByRole("button", { name: "Filter" }).click();
			await expect
				.element(screen.getByRole("option", { name: "All" }))
				.toHaveAttribute("aria-selected", "true");
		});
	});
	describe("accessible name without a visible label", () => {
		it("aria-label names the trigger and still contains the visible value", async () => {
			const screen = await render(SelectHarness, { "aria-label": "Role", initial: "a" });
			const trigger = screen.getByRole("button", { name: "Role Alpha" });
			await expect.element(trigger).toHaveTextContent("Alpha");
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			await trigger.click();
			await expect.element(screen.getByRole("listbox", { name: "Role" })).toBeVisible();
		});

		it("aria-label is not replaced by the placeholder", async () => {
			const screen = await render(SelectHarness, { "aria-label": "Role", placeholder: "Pick one" });
			await expect.element(screen.getByRole("button", { name: "Role Pick one" })).toBeVisible();
		});

		it("aria-labelledby points at an outside element", async () => {
			const screen = await render(SelectHarness, { "aria-labelledby": "outside", initial: "b" });
			const outside = document.createElement("span");
			outside.id = "outside";
			outside.textContent = "Team";
			screen.container.prepend(outside);
			await expect.element(screen.getByRole("button", { name: "Team Beta" })).toBeVisible();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	});
});

describe("Select option triggerLabel (#714)", () => {
	const options = [
		{ value: "me", label: "My queue" },
		{ value: "ana", label: "Ana", triggerLabel: "Queue of Ana" },
	];

	it("the closed trigger reads the selected option's triggerLabel; the list keeps label", async () => {
		const screen = await render(SelectOnly, { label: "View as", options, value: "ana" });
		const value = screen.container.querySelector(".ca-sel__value") as HTMLElement;
		expect(value.textContent?.trim()).toBe("Queue of Ana");
		expect(value.getAttribute("title")).toBe("Queue of Ana");
	});

	it("falls back to label without triggerLabel", async () => {
		const screen = await render(SelectOnly, { label: "View as", options, value: "me" });
		expect(screen.container.querySelector(".ca-sel__value")?.textContent?.trim()).toBe("My queue");
	});
});

describe("Select option groups (#811)", () => {
	const grouped = [
		{ value: "n", label: "Name", group: "Contact" },
		{ value: "e", label: "Email", group: "Contact", disabled: true },
		{ value: "p", label: "Phone", group: "Contact" },
		{ value: "c", label: "Company", group: "Account" },
		{ value: "x", label: "Other" },
	];

	it("renders each group as a labelled role=group with a header and its options", async () => {
		const screen = await render(SelectHarness, { label: "Field", options: grouped });
		await screen.getByRole("button", { name: "Field" }).click();
		const contact = screen.getByRole("group", { name: "Contact" });
		await expect.element(contact).toBeVisible();
		const g = contact.element();
		expect([...g.querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim())).toEqual([
			"Name",
			"Email",
			"Phone",
		]);
		const header = document.getElementById(
			g.getAttribute("aria-labelledby") as string
		) as HTMLElement;
		expect(header.textContent).toBe("Contact");
		expect(header.getAttribute("role")).toBeNull();
		expect(screen.getByRole("listbox").element().querySelectorAll('[role="option"]')).toHaveLength(
			5
		);
		await settled();
		expect(await checkA11y(document.body, PORTAL_RULES)).toHaveNoViolations();
	});

	it("arrow keys step over headers and disabled options", async () => {
		const screen = await render(SelectHarness, { label: "Field", options: grouped });
		screen.getByRole("button", { name: "Field" }).element().focus();
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("[c]");
	});

	it("typeahead matches options, never a group header", async () => {
		const screen = await render(SelectHarness, { label: "Field", options: grouped });
		screen.getByRole("button", { name: "Field" }).element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(screen.getByRole("listbox")).toBeVisible();
		// "Acc" is the start of the header "Account"; only the option "Company" may be reached by "com".
		const lit = () => document.querySelector("[data-highlighted]")?.textContent?.trim();
		const before = lit();
		await userEvent.keyboard("acc");
		expect(lit()).toBe(before);
		await userEvent.keyboard("{Escape}");
		await screen.unmount();
		const again = await render(SelectHarness, { label: "Field", options: grouped });
		again.getByRole("button", { name: "Field" }).element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(again.getByRole("listbox")).toBeVisible();
		await userEvent.keyboard("com");
		await expect
			.element(again.getByRole("option", { name: "Company" }))
			.toHaveAttribute("data-highlighted");
		await userEvent.keyboard("{Enter}");
		await expect.element(again.getByTestId("bound")).toHaveTextContent("[c]");
	});

	it("options without a group render with no group wrapper", async () => {
		const screen = await render(SelectHarness, { label: "Letter" });
		await screen.getByRole("button", { name: "Letter" }).click();
		expect(document.querySelector('[role="group"]')).toBeNull();
	});
});
