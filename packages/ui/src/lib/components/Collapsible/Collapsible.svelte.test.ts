import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import CollapsibleHarness from "./CollapsibleHarness.test.svelte";

describe("Collapsible", () => {
	it("starts closed with aria-expanded=false", async () => {
		const screen = await render(CollapsibleHarness, {});
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByText("Collapsible content")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("click toggles content, aria-expanded and bound open", async () => {
		const screen = await render(CollapsibleHarness, {});
		const trigger = screen.getByRole("button", { name: "Details" });
		await trigger.click();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Collapsible content")).toBeVisible();
		await expect.element(screen.getByTestId("open")).toHaveTextContent("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await trigger.click();
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
		await expect.element(screen.getByTestId("open")).toHaveTextContent("false");
	});

	it("toggles with Enter and Space", async () => {
		const screen = await render(CollapsibleHarness, {});
		const trigger = screen.getByRole("button", { name: "Details" });
		(trigger.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard(" ");
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("disabled trigger does not open", async () => {
		const screen = await render(CollapsibleHarness, { disabled: true });
		const trigger = screen.getByRole("button", { name: "Details" });
		await expect.element(trigger).toBeDisabled();
		await trigger.click({ force: true });
		await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
	});

	it("respects open=true initially", async () => {
		const screen = await render(CollapsibleHarness, { open: true });
		await expect
			.element(screen.getByRole("button", { name: "Details" }))
			.toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Collapsible content")).toBeVisible();
	});
});
