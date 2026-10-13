import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import TabsHarness from "./TabsHarness.test.svelte";

describe("Tabs", () => {
	it("marks the active tab and shows only its panel", async () => {
		const screen = await render(TabsHarness, {});
		const account = screen.getByRole("tab", { name: "Account" });
		const password = screen.getByRole("tab", { name: "Password" });
		await expect.element(account).toHaveAttribute("aria-selected", "true");
		await expect.element(password).toHaveAttribute("aria-selected", "false");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Account panel");
		await expect.element(screen.getByText("Password panel")).not.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("uses roving tabindex: only the active tab is tabbable", async () => {
		const screen = await render(TabsHarness, {});
		await expect
			.element(screen.getByRole("tab", { name: "Account" }))
			.toHaveAttribute("tabindex", "0");
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("tabindex", "-1");
		await expect
			.element(screen.getByRole("tab", { name: "Team" }))
			.toHaveAttribute("tabindex", "-1");
	});

	it("clicking a tab switches content, bound value and fires onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(TabsHarness, { onchange });
		await screen.getByRole("tab", { name: "Password" }).click();
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Password panel");
		await expect.element(screen.getByTestId("value")).toHaveTextContent("b");
		expect(onchange).toHaveBeenCalledWith("b");
	});

	it("arrow keys move focus (skipping disabled) and wrap around", async () => {
		const screen = await render(TabsHarness, {});
		const account = screen.getByRole("tab", { name: "Account" });
		(account.element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("tab", { name: "Password" })).toHaveFocus();
		// Billing is disabled → next stop is Team
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(account).toHaveFocus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
	});

	it("keyboard activation selects the focused tab", async () => {
		const screen = await render(TabsHarness, {});
		(screen.getByRole("tab", { name: "Account" }).element() as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}");
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("tab", { name: "Password" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toMatchTextContent("Password panel");
	});

	it("disabled tab cannot be selected", async () => {
		const screen = await render(TabsHarness, {});
		const billing = screen.getByRole("tab", { name: "Billing" });
		await expect.element(billing).toBeDisabled();
		await billing.click({ force: true });
		await expect.element(screen.getByTestId("value")).toHaveTextContent("a");
	});

	it("tab and panel reference each other", async () => {
		const screen = await render(TabsHarness, {});
		const tab = screen.getByRole("tab", { name: "Account" }).element();
		const panel = screen.getByRole("tabpanel").element();
		expect(tab.getAttribute("aria-controls")).toBe(panel.id);
		expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
	});
});
