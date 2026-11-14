import { describe, expect, it, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
import { reducedMotion } from "../../stores/reduced-motion.svelte";
import SegmentedControlContent from "./SegmentedControlContent.test.svelte";
import SegmentedControlHarness from "./SegmentedControlHarness.test.svelte";
import SegmentedControlLong from "./SegmentedControlLong.test.svelte";
import SegmentedControlNarrow from "./SegmentedControlNarrow.test.svelte";

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

	it("every item is at least 44px wide and tall under a coarse pointer", async () => {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(SegmentedControlNarrow);
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			for (const item of screen.container.querySelectorAll(".ca-seg__item")) {
				const r = item.getBoundingClientRect();
				expect(r.width, "item width").toBeGreaterThanOrEqual(touchTarget());
				expect(r.height, "item height").toBeGreaterThanOrEqual(touchTarget());
			}
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});

	describe("sizing", () => {
		const rect = (el: Element) => el.getBoundingClientRect();
		const thumbOf = (root: Element) => root.querySelector(".ca-seg__thumb") as HTMLElement;
		const itemsOf = (root: Element) => [...root.querySelectorAll<HTMLElement>(".ca-seg__item")];
		const padOf = (root: Element) => {
			const cs = getComputedStyle(root);
			return {
				x: Number.parseFloat(cs.paddingLeft) + Number.parseFloat(cs.paddingRight),
				border: Number.parseFloat(cs.borderLeftWidth) + Number.parseFloat(cs.borderRightWidth),
			};
		};

		it("equal (default) keeps one shared column width and no measured thumb", async () => {
			const screen = await render(SegmentedControlContent, { "aria-label": "N", long: true });
			const root = screen.getByRole("group", { name: "N" }).element();
			const widths = itemsOf(root).map((i) => Math.round(rect(i).width));
			expect(new Set(widths).size).toBe(1);
			expect(root.hasAttribute("data-sizing")).toBe(false);
			expect(segIndex(root)).toBe("0");
		});

		it("content: control width = sum of segment widths + padding + gaps, items differ", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				long: true,
				gap: "2px",
			});
			const root = screen.getByRole("group", { name: "N" }).element();
			const items = itemsOf(root);
			const widths = items.map((i) => rect(i).width);
			expect(widths[1]).toBeGreaterThan(widths[0] + 40);
			const { x, border } = padOf(root);
			const sum = widths.reduce((a, b) => a + b, 0) + 2 * (items.length - 1) + x + border;
			expect(rect(root).width).toBeCloseTo(sum, 0);
			for (const i of items) expect(i.scrollWidth).toBeLessThanOrEqual(i.clientWidth);
		});

		it("content: --ca-seg-gap separates segments and the thumb ignores the gap", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				gap: "2px",
				initial: "c",
			});
			const root = screen.getByRole("group", { name: "N" }).element();
			const items = itemsOf(root);
			expect(rect(items[1]).left - rect(items[0]).right).toBeCloseTo(2, 1);
			expect(rect(items[2]).left - rect(items[1]).right).toBeCloseTo(2, 1);
			await expect.poll(() => rect(thumbOf(root)).left).toBeCloseTo(rect(items[2]).left, 0);
			await expect.poll(() => rect(thumbOf(root)).width).toBeCloseTo(rect(items[2]).width, 0);
		});

		it("content: the thumb matches fractional segment widths (#1013)", async () => {
			// Linux fonts give 47.5px segments; offsetWidth rounded the thumb to 48. Force fractions here.
			const frac = document.createElement("style");
			frac.textContent = ".ca-seg__item { padding-inline: 10.25px !important; }";
			document.head.append(frac);
			try {
				const screen = await render(SegmentedControlContent, {
					"aria-label": "F",
					sizing: "content",
					long: true,
				});
				const root = screen.getByRole("group", { name: "F" }).element();
				const items = itemsOf(root);
				expect(rect(items[1]).width % 1).not.toBe(0);
				for (const [n, name] of [
					[1, "Twenty results per search"],
					[2, "100"],
				] as const) {
					await screen.getByRole("radio", { name }).click();
					await expect
						.poll(() => Math.abs(rect(thumbOf(root)).width - rect(items[n]).width))
						.toBeLessThan(0.1);
					await expect
						.poll(() => Math.abs(rect(thumbOf(root)).left - rect(items[n]).left))
						.toBeLessThan(0.1);
				}
			} finally {
				frac.remove();
			}
		});

		it("content: thumb follows the active segment for different label widths", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				long: true,
			});
			const root = screen.getByRole("group", { name: "N" }).element();
			const items = itemsOf(root);
			for (const [n, name] of [
				[0, "10"],
				[1, "Twenty results per search"],
				[2, "100"],
			] as const) {
				await screen.getByRole("radio", { name }).click();
				await expect.poll(() => rect(thumbOf(root)).left).toBeCloseTo(rect(items[n]).left, 0);
				await expect.poll(() => rect(thumbOf(root)).width).toBeCloseTo(rect(items[n]).width, 0);
			}
		});

		it("content: thumb re-measures when labels change width (locale change)", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				initial: "c",
			});
			const root = screen.getByRole("group", { name: "N" }).element();
			const items = itemsOf(root);
			await expect.poll(() => rect(thumbOf(root)).left).toBeCloseTo(rect(items[2]).left, 0);
			await screen.rerender({ long: true });
			await expect.poll(() => rect(thumbOf(root)).left).toBeCloseTo(rect(items[2]).left, 0);
			await expect.poll(() => rect(thumbOf(root)).width).toBeCloseTo(rect(items[2]).width, 0);
		});

		it("content: no thumb transition under reduced motion", async () => {
			await cdp().send("Emulation.setEmulatedMedia", {
				features: [{ name: "prefers-reduced-motion", value: "reduce" }],
			});
			try {
				reducedMotion.init();
				const screen = await render(SegmentedControlContent, {
					"aria-label": "N",
					sizing: "content",
				});
				const root = screen.getByRole("group", { name: "N" }).element();
				expect(getComputedStyle(thumbOf(root)).transitionDuration).toBe("0s");
			} finally {
				await cdp().send("Emulation.setEmulatedMedia", {
					features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
				});
			}
		});

		it("content: coarse pointer gives every segment a 44px target", async () => {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
			try {
				const screen = await render(SegmentedControlContent, {
					"aria-label": "N",
					sizing: "content",
					size: "sm",
				});
				for (const item of screen.container.querySelectorAll(".ca-seg__item")) {
					const r = item.getBoundingClientRect();
					expect(r.width).toBeGreaterThanOrEqual(touchTarget());
					expect(r.height).toBeGreaterThanOrEqual(touchTarget());
				}
			} finally {
				await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
			}
		});

		it("content: wider than its container scrolls on x; horizontal wheel moves scrollLeft, vertical does not", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				long: true,
				width: "140px",
			});
			const root = screen.getByRole("group", { name: "N" }).element() as HTMLElement;
			expect(getComputedStyle(root).overflowX).toBe("auto");
			expect(root.scrollWidth).toBeGreaterThan(root.clientWidth);
			expect(rect(root).width).toBeLessThanOrEqual(140.5);
			root.dispatchEvent(new WheelEvent("wheel", { deltaX: 60, bubbles: true, cancelable: true }));
			await expect.poll(() => root.scrollLeft).toBeGreaterThan(0);
			const before = root.scrollLeft;
			const v = new WheelEvent("wheel", { deltaY: 60, bubbles: true, cancelable: true });
			root.dispatchEvent(v);
			expect(v.defaultPrevented).toBe(false);
			expect(root.scrollLeft).toBe(before);
		});

		it("content: axe passes in every state", async () => {
			const screen = await render(SegmentedControlContent, {
				"aria-label": "N",
				sizing: "content",
				long: true,
			});
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			await screen.getByRole("radio", { name: "100" }).click();
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	});
	// #1051: four long labels in a 330px slot.
	describe("narrow slot (#1051)", () => {
		const items = (root: Element) => [...root.querySelectorAll<HTMLElement>(".ca-seg__item")];
		const inside = (el: Element, box: Element) => {
			const a = el.getBoundingClientRect();
			const b = box.getBoundingClientRect();
			return a.left >= b.left - 0.5 && a.right <= b.right + 0.5;
		};
		const fonts = () => document.fonts.ready;

		it("content: reveals the selected segment", async () => {
			const screen = await render(SegmentedControlLong, { sizing: "content", initial: "d" });
			await fonts();
			const root = screen.getByRole("group", { name: "Discount" }).element();
			expect(root.scrollWidth).toBeGreaterThan(root.clientWidth);
			const [first, , , last] = items(root);
			await expect.poll(() => inside(last, root)).toBe(true);
			await screen.getByRole("button", { name: "Pick first" }).click();
			await expect.poll(() => inside(first, root)).toBe(true);
			await screen.getByRole("button", { name: "Pick last" }).click();
			await expect.poll(() => inside(last, root)).toBe(true);
		});

		it("equal: title on a cut label only", async () => {
			const screen = await render(SegmentedControlLong);
			await fonts();
			const root = screen.getByRole("group", { name: "Discount" }).element();
			const all = items(root);
			const cut = all.filter((i) => i.scrollWidth > i.clientWidth);
			expect(cut.length).toBeGreaterThan(0);
			await expect
				.poll(() => cut.map((i) => i.title))
				.toEqual(cut.map((i) => i.textContent?.trim()));
			expect(all[0].hasAttribute("title")).toBe(false);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
		});
	});
});
