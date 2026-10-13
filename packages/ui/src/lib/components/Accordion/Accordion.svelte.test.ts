import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import AccordionHarness from "./AccordionHarness.test.svelte";

describe("Accordion", () => {
	it("starts collapsed and passes axe", async () => {
		const screen = await render(AccordionHarness, {});
		const first = screen.getByRole("button", { name: "First" });
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByText("Content one")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("single: opening an item closes the previous one", async () => {
		const screen = await render(AccordionHarness, { type: "single" });
		const first = screen.getByRole("button", { name: "First" });
		const second = screen.getByRole("button", { name: "Second" });
		await first.click();
		await expect.element(first).toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Content one")).toBeVisible();
		await expect.element(screen.getByTestId("value")).toHaveTextContent('"one"');
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await second.click();
		await expect.element(second).toHaveAttribute("aria-expanded", "true");
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("value")).toHaveTextContent('"two"');
	});

	it("single: clicking the open item collapses it", async () => {
		const screen = await render(AccordionHarness, { type: "single", value: "one" });
		const first = screen.getByRole("button", { name: "First" });
		await expect.element(first).toHaveAttribute("aria-expanded", "true");
		await first.click();
		await expect.element(first).toHaveAttribute("aria-expanded", "false");
	});

	it("multiple: several items stay open", async () => {
		const screen = await render(AccordionHarness, { type: "multiple" });
		await screen.getByRole("button", { name: "First" }).click();
		await screen.getByRole("button", { name: "Third" }).click();
		await expect
			.element(screen.getByRole("button", { name: "First" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect
			.element(screen.getByRole("button", { name: "Third" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect
			.element(screen.getByRole("button", { name: "Second" }))
			.toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("value")).toHaveTextContent('["one","three"]');
	});

	it("arrow keys move focus between triggers, Enter/Space toggle", async () => {
		const screen = await render(AccordionHarness, {});
		(screen.getByRole("button", { name: "First" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowDown}");
		await expect.element(screen.getByRole("button", { name: "Second" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("button", { name: "Second" }))
			.toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard("{ArrowUp}");
		await expect.element(screen.getByRole("button", { name: "First" })).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect
			.element(screen.getByRole("button", { name: "First" }))
			.toHaveAttribute("aria-expanded", "true");
	});

	it("triggers are exposed inside headings", async () => {
		const screen = await render(AccordionHarness, {});
		await expect.element(screen.getByRole("heading", { level: 2, name: "First" })).toBeVisible();
		expect(screen.getByRole("heading", { level: 2 }).elements()).toHaveLength(3);
	});
});
