import { describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { reducedMotion } from "../../stores/reduced-motion.svelte";
import SegmentedControlHarness from "./SegmentedControlHarness.test.svelte";

const segIndex = (el: Element) => (el as HTMLElement).style.getPropertyValue("--seg-index");

describe("SegmentedControl", () => {
	it("first enabled item is selected by default and axe passes", async () => {
		const screen = await render(SegmentedControlHarness, { "aria-label": "Period" });
		await expect
			.element(screen.getByRole("radio", { name: "Day" }))
			.toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("day");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("click selects, moves --seg-index and calls onchange", async () => {
		const onchange = vi.fn();
		const screen = await render(SegmentedControlHarness, { "aria-label": "Period", onchange });
		const root = screen.getByRole("group", { name: "Period" }).element();
		expect(segIndex(root)).toBe("0");
		await screen.getByRole("radio", { name: "Month" }).click();
		expect(segIndex(root)).toBe("2");
		expect(onchange).toHaveBeenLastCalledWith("month");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("month");
	});

	it("keyboard: arrows move focus and Space/Enter commit; --seg-index follows", async () => {
		const screen = await render(SegmentedControlHarness, { "aria-label": "Period" });
		const root = screen.getByRole("group", { name: "Period" }).element();
		screen.getByRole("radio", { name: "Day" }).element().focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Week" }).element());
		await userEvent.keyboard(" ");
		await expect
			.element(screen.getByRole("radio", { name: "Week" }))
			.toHaveAttribute("aria-checked", "true");
		expect(segIndex(root)).toBe("1");
		await userEvent.keyboard("{ArrowRight}{Enter}");
		expect(segIndex(root)).toBe("2");
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft} ");
		expect(segIndex(root)).toBe("0");
	});

	it("pressing the active item again keeps the selection", async () => {
		const screen = await render(SegmentedControlHarness, {
			"aria-label": "Period",
			initial: "week",
		});
		await screen.getByRole("radio", { name: "Week" }).click();
		await expect
			.element(screen.getByRole("radio", { name: "Week" }))
			.toHaveAttribute("aria-checked", "true");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("week");
	});

	it("thumb has no transition when reduced motion is preferred", async () => {
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-reduced-motion", value: "reduce" }],
		});
		try {
			reducedMotion.init();
			const screen = await render(SegmentedControlHarness, { "aria-label": "Period" });
			const root = screen.getByRole("group", { name: "Period" }).element();
			expect(root.hasAttribute("data-no-motion")).toBe(true);
			const thumb = root.querySelector(".ca-seg__thumb") as HTMLElement;
			expect(getComputedStyle(thumb).transitionDuration).toBe("0s");
		} finally {
			await cdp().send("Emulation.setEmulatedMedia", {
				features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
			});
		}
	});
});
