import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./Popover.test.svelte";

const setup = async () => {
	const screen = await render(Harness);
	const trigger = screen.getByRole("button", { name: "Details" });
	return { screen, trigger };
};

describe("Popover", () => {
	it("is closed initially and trigger reports aria-expanded=false", async () => {
		const { trigger } = await setup();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(page.getByText("Popover content")).not.toBeInTheDocument();
	});

	it("opens from the keyboard (Enter) and has no axe violations", async () => {
		const { trigger } = await setup();
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-popover-content") as HTMLElement)
		).toHaveNoViolations();
	});

	it("opens with Space as well", async () => {
		const { trigger } = await setup();
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard(" ");
		await expect.element(page.getByText("Popover content")).toBeVisible();
	});

	it("Tab moves into the popover content", async () => {
		const { trigger } = await setup();
		await trigger.click();
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await userEvent.tab();
		await expect.element(page.getByRole("button", { name: "Inner action" })).toHaveFocus();
	});

	it("Escape closes and returns focus to the trigger", async () => {
		const { trigger } = await setup();
		await trigger.click();
		await expect.element(page.getByText("Popover content")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByText("Popover content")).not.toBeInTheDocument();
		await expect.element(trigger).toHaveFocus();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});
});
