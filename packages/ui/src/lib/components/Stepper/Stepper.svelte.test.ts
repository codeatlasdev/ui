import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Stepper from "./Stepper.svelte";
import Sized from "./StepperSized.test.svelte";

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

	describe("layout (#988)", () => {
		const rects = (c: Element, sel: string) =>
			[...c.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());

		it("1200px: descriptions read as text, labels stay inside, connectors stay short", async () => {
			const screen = await render(Sized, { width: 1200 });
			const box = screen.getByTestId("box").element().getBoundingClientRect();
			const ch20 = screen.getByTestId("ch20").element().getBoundingClientRect().width;
			for (const d of rects(screen.container, ".ca-stepper__desc"))
				expect(d.width).toBeGreaterThanOrEqual(ch20 - 0.5);
			for (const l of rects(screen.container, ".ca-stepper__label")) {
				expect(l.left).toBeGreaterThanOrEqual(box.left - 0.5);
				expect(l.right).toBeLessThanOrEqual(box.right + 0.5);
			}
			const bubbles = rects(screen.container, ".ca-stepper__bubble");
			// The connector links one number to the next, a small gap from each edge, and does not float.
			const stepEls = [...screen.container.querySelectorAll(".ca-stepper__step")];
			for (let i = 0; i < stepEls.length - 1; i++) {
				const step = stepEls[i].getBoundingClientRect();
				const after = getComputedStyle(stepEls[i], "::after");
				const start = step.left + Number.parseFloat(after.left);
				const end = step.right - Number.parseFloat(after.right);
				expect(start - bubbles[i].right).toBeGreaterThan(0);
				expect(start - bubbles[i].right).toBeLessThanOrEqual(12);
				expect(bubbles[i + 1].left - end).toBeGreaterThan(0);
				expect(bubbles[i + 1].left - end).toBeLessThanOrEqual(12);
			}
			expect(bubbles[1].top).toBeCloseTo(bubbles[0].top, 0);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("360px: steps stack vertically in at most 320px", async () => {
			const screen = await render(Sized, { width: 360 });
			const bubbles = rects(screen.container, ".ca-stepper__bubble");
			expect(bubbles[1].top).toBeGreaterThan(bubbles[0].bottom);
			const nav = screen.getByRole("navigation", { name: "Progress" }).element();
			expect(nav.getBoundingClientRect().height).toBeLessThanOrEqual(320);
			const box = screen.getByTestId("box").element().getBoundingClientRect();
			for (const l of rects(screen.container, ".ca-stepper__label"))
				expect(l.right).toBeLessThanOrEqual(box.right + 0.5);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});

		it("orientation overrides the container: horizontal at 360, vertical at 1200", async () => {
			const h = await render(Sized, { width: 360, orientation: "horizontal" });
			const hb = rects(h.container, ".ca-stepper__bubble");
			expect(hb[1].top).toBeCloseTo(hb[0].top, 0);
			h.unmount();
			const v = await render(Sized, { width: 1200, orientation: "vertical" });
			const vb = rects(v.container, ".ca-stepper__bubble");
			expect(vb[1].top).toBeGreaterThan(vb[0].bottom);
		});
	});
});
