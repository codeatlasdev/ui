import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./TourHarness.test.svelte";

// #773: anchored steps, a named dialog per step, keyboard and focus.
describe("Tour (#773)", () => {
	it("shows a named step next to its target and moves focus to the next action", async () => {
		const screen = await render(Harness, {});
		const dialog = page.getByRole("dialog", { name: "Create" });
		await expect.element(dialog).toBeVisible();
		await expect.element(page.getByRole("button", { name: "Next" })).toHaveFocus();
		expect(document.getElementById("new")?.hasAttribute("data-ca-tour-target")).toBe(true);
		expect(document.querySelector(".ca-tour__progress")?.textContent).toBe("1 of 2");
		expect(await checkA11y(document.body)).toHaveNoViolations();
		screen.unmount();
	});

	it("Next and Back walk the steps; Done closes", async () => {
		const onclose = vi.fn();
		await render(Harness, { onclose });
		await page.getByRole("button", { name: "Next" }).click();
		await expect.element(page.getByRole("dialog", { name: "Filter" })).toBeVisible();
		expect(document.getElementById("new")?.hasAttribute("data-ca-tour-target")).toBe(false);
		await page.getByRole("button", { name: "Back" }).click();
		await expect.element(page.getByRole("dialog", { name: "Create" })).toBeVisible();
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Done" }).click();
		await expect.element(page.getByTestId("state")).toHaveTextContent("closed");
		expect(onclose).toHaveBeenCalledWith("done");
	});

	it("Escape skips the tour", async () => {
		const onclose = vi.fn();
		await render(Harness, { onclose });
		await expect.element(page.getByRole("dialog", { name: "Create" })).toBeVisible();
		await userEvent.keyboard("{Escape}");
		await expect.element(page.getByTestId("state")).toHaveTextContent("closed");
		expect(onclose).toHaveBeenCalledWith("skip");
	});
});
