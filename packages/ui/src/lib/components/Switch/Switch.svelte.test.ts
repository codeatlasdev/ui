import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SwitchHarness from "./SwitchHarness.test.svelte";

describe("Switch", () => {
	it("label names the switch; Space toggles aria-checked and the bound value", async () => {
		const screen = await render(SwitchHarness, { label: "Notifications" });
		const sw = screen.getByRole("switch", { name: "Notifications" });
		await expect.element(sw).toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		sw.element().focus();
		await userEvent.keyboard(" ");
		await expect.element(sw).toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await userEvent.keyboard("{Enter}");
		await expect.element(sw).toHaveAttribute("aria-checked", "false");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("false");
	});

	it("clicking the label toggles and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(SwitchHarness, { label: "Dark mode", onchange });
		await screen.getByText("Dark mode").click();
		expect(onchange).toHaveBeenCalledWith(true);
		await expect.element(screen.getByRole("switch", { name: "Dark mode" })).toBeChecked();
	});

	it("starts checked when bound value is true", async () => {
		const screen = await render(SwitchHarness, { label: "On", initial: true });
		await expect
			.element(screen.getByRole("switch", { name: "On" }))
			.toHaveAttribute("aria-checked", "true");
	});

	it("disabled does not toggle", async () => {
		const onchange = vi.fn();
		const screen = await render(SwitchHarness, { label: "Locked", disabled: true, onchange });
		const sw = screen.getByRole("switch", { name: "Locked" });
		await expect.element(sw).toBeDisabled();
		await sw.click({ force: true });
		expect(onchange).not.toHaveBeenCalled();
	});
});
