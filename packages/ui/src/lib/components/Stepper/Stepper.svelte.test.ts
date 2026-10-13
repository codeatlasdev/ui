import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Stepper from "./Stepper.svelte";

const steps = [
	{ label: "Account", description: "Basic details" },
	{ label: "Address" },
	{ label: "Review" },
];

describe("Stepper", () => {
	it("exposes a Progress landmark and marks only the current step", async () => {
		const screen = await render(Stepper, { steps, current: 1 });
		await expect.element(screen.getByRole("navigation", { name: "Progress" })).toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Step 2: Address" }))
			.toHaveAttribute("aria-current", "step");
		await expect
			.element(screen.getByRole("button", { name: "Step 3: Review" }))
			.not.toHaveAttribute("aria-current");
		await expect.element(screen.getByText("Basic details")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("labels completed steps as done", async () => {
		const screen = await render(Stepper, { steps, current: 2 });
		await expect
			.element(screen.getByRole("button", { name: "Step 1: Account (done)" }))
			.toBeVisible();
		await expect
			.element(screen.getByRole("button", { name: "Step 2: Address (done)" }))
			.toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Step 3: Review" })).toBeVisible();
	});

	it("clicking a step moves the current marker", async () => {
		const screen = await render(Stepper, { steps, current: 0 });
		await screen.getByRole("button", { name: "Step 3: Review" }).click();
		await expect
			.element(screen.getByRole("button", { name: "Step 3: Review" }))
			.toHaveAttribute("aria-current", "step");
		await expect
			.element(screen.getByRole("button", { name: "Step 1: Account (done)" }))
			.toBeVisible();
	});

	it("steps are reachable and activatable by keyboard", async () => {
		const screen = await render(Stepper, { steps, current: 0 });
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Step 1: Account" })).toHaveFocus();
		await userEvent.tab();
		await expect.element(screen.getByRole("button", { name: "Step 2: Address" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect
			.element(screen.getByRole("button", { name: "Step 2: Address" }))
			.toHaveAttribute("aria-current", "step");
	});
});
