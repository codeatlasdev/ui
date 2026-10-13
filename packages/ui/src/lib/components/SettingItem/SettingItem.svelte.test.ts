import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./SettingItem.test.svelte";

describe("SettingItem", () => {
	it("renders label and description", async () => {
		const screen = await render(Harness, {
			label: "Notifications",
			description: "Receive alerts by email",
		});
		await expect.element(screen.getByText("Notifications")).toBeVisible();
		await expect.element(screen.getByText("Receive alerts by email")).toBeVisible();
	});

	it("omits the description element when not provided", async () => {
		const screen = await render(Harness, {});
		expect(screen.container.querySelector(".ca-setting-item__desc")).toBeNull();
	});

	it("the switch control is named by the setting label", async () => {
		const screen = await render(Harness, { label: "Notifications" });
		await expect.element(screen.getByRole("switch", { name: "Notifications" })).toBeVisible();
	});

	it("the description is part of the switch's accessible name", async () => {
		const screen = await render(Harness, { label: "Notifications", description: "Receive alerts" });
		await expect
			.element(screen.getByRole("switch", { name: "Notifications Receive alerts" }))
			.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("clicking the label text toggles the control", async () => {
		const screen = await render(Harness, { label: "Notifications" });
		await screen.getByText("Notifications").click();
		await expect.element(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
	});

	it("the control stays interactive inside the item", async () => {
		const screen = await render(Harness, { label: "Notifications" });
		const sw = screen.getByRole("switch", { name: "Notifications" });
		await expect.element(sw).toHaveAttribute("aria-checked", "false");
		await sw.click();
		await expect.element(sw).toHaveAttribute("aria-checked", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
