import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./Popover.test.svelte";
import OpenHarness from "./PopoverOpen.test.svelte";

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

describe("Popover bind:open", () => {
	const isOpen = () => page.getByTestId("open");
	const content = () => page.getByText("Popover content");

	it("opening and closing flips the bound value and calls onOpenChange", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		await expect.element(isOpen()).toHaveTextContent("false");
		await screen.getByRole("button", { name: "Details" }).click();
		await expect.element(isOpen()).toHaveTextContent("true");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		await userEvent.keyboard("{Escape}");
		await expect.element(isOpen()).toHaveTextContent("false");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
	});

	it("setting the bound value from outside opens the popover", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		await screen.getByRole("button", { name: "Open from outside" }).click();
		await expect.element(content()).toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "true");
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it("close() from the content closes it and returns focus to the trigger", async () => {
		const onOpenChange = vi.fn();
		const screen = await render(OpenHarness, { onOpenChange });
		const trigger = screen.getByRole("button", { name: "Details" });
		await trigger.click();
		await expect.element(content()).toBeVisible();
		await page.getByRole("button", { name: "Pick" }).click();
		await expect.element(content()).not.toBeInTheDocument();
		await expect.element(isOpen()).toHaveTextContent("false");
		await expect.element(trigger).toHaveFocus();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});
});
