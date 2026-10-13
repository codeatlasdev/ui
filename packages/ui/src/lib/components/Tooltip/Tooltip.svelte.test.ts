import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import Harness from "./Tooltip.test.svelte";

describe("Tooltip", () => {
	it("is hidden until the trigger receives keyboard focus, then role=tooltip describes it", async () => {
		const screen = await render(Harness);
		const trigger = screen.getByRole("button", { name: "Save" });
		await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();

		await userEvent.tab();
		await expect.element(trigger).toHaveFocus();
		const tip = page.getByRole("tooltip");
		await expect.element(tip).toBeVisible();
		await expect.element(tip).toHaveTextContent("Save changes");
		await expect.element(trigger).toHaveAttribute("aria-describedby");
		await settled();
		expect(
			await checkA11y(document.querySelector(".ca-tooltip-content") as HTMLElement)
		).toHaveNoViolations();
	});

	it("Escape dismisses the tooltip", async () => {
		const screen = await render(Harness);
		await userEvent.tab();
		await expect.element(page.getByRole("tooltip")).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
		await expect.element(screen.getByRole("button", { name: "Save" })).toHaveFocus();
	});

	it("blur hides the tooltip", async () => {
		const screen = await render(Harness);
		const trigger = screen.getByRole("button", { name: "Save" });
		// A pointer left over the trigger by an earlier test would keep the tooltip open.
		await userEvent.unhover(trigger);
		await userEvent.tab();
		await expect.element(page.getByRole("tooltip")).toBeVisible();
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "After" })).toHaveFocus();
		await expect.element(page.getByRole("tooltip")).not.toBeInTheDocument();
	});

	it("shows on hover", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Save" }).hover();
		await expect.element(page.getByRole("tooltip")).toBeVisible();
	});
});
