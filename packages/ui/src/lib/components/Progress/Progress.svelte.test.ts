import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import Progress from "./Progress.svelte";

const indicator = (c: HTMLElement) => q<HTMLElement>(c, ".ca-progress__indicator");

describe("Progress", () => {
	it("exposes progressbar semantics with now/min/max", async () => {
		const screen = await render(Progress, { value: 40, label: "Upload" });
		const bar = screen.getByRole("progressbar", { name: "Upload" });
		await expect.element(bar).toHaveAttribute("aria-valuenow", "40");
		await expect.element(bar).toHaveAttribute("aria-valuemin", "0");
		await expect.element(bar).toHaveAttribute("aria-valuemax", "100");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("defaults to value 0 / max 100", async () => {
		const screen = await render(Progress, { label: "x" });
		const bar = screen.getByRole("progressbar");
		await expect.element(bar).toHaveAttribute("aria-valuenow", "0");
		await expect.element(bar).toHaveAttribute("aria-valuemax", "100");
	});

	it("indicator width follows value/max", async () => {
		const screen = await render(Progress, { value: 25, max: 50, label: "x" });
		const bar = screen.getByRole("progressbar");
		await expect.element(bar).toHaveAttribute("aria-valuemax", "50");
		await expect.element(bar).toHaveAttribute("aria-valuenow", "25");
		expect(indicator(screen.container).style.width).toBe("50%");
	});

	it("clamps the visual width to 0-100% for out-of-range values", async () => {
		const over = await render(Progress, { value: 250, label: "x" });
		expect(indicator(over.container).style.width).toBe("100%");
		const under = await render(Progress, { value: -10, label: "x" });
		expect(indicator(under.container).style.width).toBe("0%");
	});

	it("indeterminate omits aria-valuenow and sets no explicit width", async () => {
		const screen = await render(Progress, { indeterminate: true, value: 60, label: "Loading" });
		const bar = screen.getByRole("progressbar", { name: "Loading" });
		expect(bar.element().hasAttribute("aria-valuenow")).toBe(false);
		const ind = indicator(screen.container);
		expect(ind.classList.contains("ca-progress__indicator--indeterminate")).toBe(true);
		expect(ind.style.width).toBe("");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
