import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Slider from "./Slider.svelte";
import SliderHarness from "./SliderHarness.test.svelte";

describe("Slider", () => {
	it("thumb exposes slider role with aria-valuenow/min/max and axe passes", async () => {
		const screen = await render(SliderHarness, { initial: 30, min: 10, max: 90 });
		const thumb = screen.getByRole("slider");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "30");
		await expect.element(thumb).toHaveAttribute("aria-valuemin", "10");
		await expect.element(thumb).toHaveAttribute("aria-valuemax", "90");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("arrow keys step the value and update the binding", async () => {
		const onchange = vi.fn();
		const screen = await render(SliderHarness, { initial: 50, step: 5, onchange });
		const thumb = screen.getByRole("slider");
		thumb.element().focus();
		await userEvent.keyboard("{ArrowRight}{ArrowRight}");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "60");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("60");
		expect(onchange).toHaveBeenLastCalledWith([60]);
		await userEvent.keyboard("{ArrowLeft}");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "55");
	});

	it("Home/End jump to the bounds and values are clamped", async () => {
		const screen = await render(SliderHarness, { initial: 50, min: 0, max: 20 });
		const thumb = screen.getByRole("slider");
		thumb.element().focus();
		await userEvent.keyboard("{End}");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "20");
		await userEvent.keyboard("{ArrowRight}");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "20");
		await userEvent.keyboard("{Home}");
		await expect.element(thumb).toHaveAttribute("aria-valuenow", "0");
	});

	it("disabled slider is not operable", async () => {
		const screen = await render(SliderHarness, { initial: 40, disabled: true });
		const thumb = screen.getByRole("slider");
		await expect.element(thumb).toHaveAttribute("aria-disabled", "true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("Slider size and tokens (#704)", () => {
	it('size="sm": 6px control and track, 16px thumb', async () => {
		const screen = await render(Slider, { value: 40, label: "Radius", size: "sm" });
		const root = screen.container.querySelector(".ca-slider") as HTMLElement;
		expect(root.getBoundingClientRect().height).toBe(6);
		expect(
			(root.querySelector(".ca-slider__track") as HTMLElement).getBoundingClientRect().height
		).toBe(6);
		const thumb = root.querySelector(".ca-slider__thumb") as HTMLElement;
		expect(thumb.getBoundingClientRect().width).toBe(16);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("keeps the default size", async () => {
		const screen = await render(Slider, { value: 40, label: "Radius" });
		expect(
			(screen.container.querySelector(".ca-slider") as HTMLElement).getBoundingClientRect().height
		).toBe(20);
	});

	it("--ca-slider-thumb-size tunes one slider", async () => {
		const screen = await render(Slider, { value: 40, label: "Radius" });
		const root = screen.container.querySelector(".ca-slider") as HTMLElement;
		root.style.setProperty("--ca-slider-thumb-size", "12px");
		expect(
			(root.querySelector(".ca-slider__thumb") as HTMLElement).getBoundingClientRect().width
		).toBe(12);
	});
});
