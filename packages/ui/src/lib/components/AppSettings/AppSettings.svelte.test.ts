import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./AppSettingsHarness.test.svelte";

describe("AppSettings", () => {
	it("renders title (h1), description, actions and one tab per entry", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
		await expect.element(screen.getByText("Manage the workspace")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Save" })).toBeVisible();
		expect(screen.getByRole("tab").elements()).toHaveLength(3);
		await expect
			.element(screen.getByRole("tablist", { name: "Settings navigation" }))
			.toBeVisible();
	});

	it("renders no header box when there is no title, description or actions (#758)", async () => {
		const screen = await render(Harness, { headless: true });
		await expect.element(screen.getByRole("tab", { name: "General" })).toBeVisible();
		expect(document.querySelector(".ca-app-settings__header")).toBeNull();
		const full = await render(Harness);
		await expect.element(full.getByRole("heading", { level: 1 })).toBeVisible();
		expect(document.querySelector(".ca-app-settings__header")).not.toBeNull();
	});

	it("a back link alone still renders the header (#758 with #777)", async () => {
		const screen = await render(Harness, { headless: true, backHref: "/" });
		await expect.element(screen.getByRole("link", { name: /back/i })).toBeVisible();
		expect(document.querySelector(".ca-app-settings__header")).not.toBeNull();
	});

	it("selects the first tab by default and passes it to children", async () => {
		const screen = await render(Harness);
		await expect
			.element(screen.getByRole("tab", { name: "General" }))
			.toHaveAttribute("aria-selected", "true");
		await expect
			.element(screen.getByRole("tab", { name: "Members 4" }))
			.toHaveAttribute("aria-selected", "false");
		await expect
			.element(screen.getByRole("tabpanel", { name: "Settings content" }))
			.toHaveTextContent("Content: general");
	});

	it("defaultTab picks the initial tab", async () => {
		const screen = await render(Harness, { defaultTab: "danger" });
		await expect
			.element(screen.getByRole("tab", { name: "Danger zone" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("Content: danger");
	});

	it("clicking a tab switches content and fires onTabChange", async () => {
		const onTabChange = vi.fn();
		const screen = await render(Harness, { onTabChange });
		await screen.getByRole("tab", { name: "Members 4" }).click();
		expect(onTabChange).toHaveBeenCalledExactlyOnceWith("members");
		await expect
			.element(screen.getByRole("tab", { name: "Members 4" }))
			.toHaveAttribute("aria-selected", "true");
		await expect
			.element(screen.getByRole("tab", { name: "General" }))
			.toHaveAttribute("aria-selected", "false");
		await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("Content: members");
	});

	it("bind:activeTab drives the tab and receives user changes", async () => {
		const screen = await render(Harness, { controlled: "members" });
		await expect
			.element(screen.getByRole("tab", { name: "Members 4" }))
			.toHaveAttribute("aria-selected", "true");
		await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("Content: members");
		await screen.getByRole("tab", { name: "General" }).click();
		await expect.element(screen.getByTestId("external")).toHaveTextContent("general");
	});

	it("has no axe violations", async () => {
		const screen = await render(Harness);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
