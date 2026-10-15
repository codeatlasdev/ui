import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SwatchGroupHarness from "./SwatchGroupHarness.test.svelte";

describe("SwatchGroup", () => {
	it("is a radiogroup with named radios and passes axe", async () => {
		const screen = await render(SwatchGroupHarness, { "aria-label": "Brand", initial: "ocean" });
		await expect
			.element(screen.getByRole("radio", { name: "Ocean blue" }))
			.toHaveAttribute("aria-checked", "true");
		await expect
			.element(screen.getByRole("radio", { name: "amber" }))
			.toHaveAttribute("aria-checked", "false");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("click selects, calls onchange once and ignores the active or disabled swatch", async () => {
		const onchange = vi.fn();
		const screen = await render(SwatchGroupHarness, { "aria-label": "Brand", onchange });
		await screen.getByRole("radio", { name: "amber" }).click();
		await screen.getByRole("radio", { name: "amber" }).click();
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(onchange).toHaveBeenLastCalledWith("amber");
		await screen.getByRole("radio", { name: "violet" }).click({ force: true });
		expect(onchange).toHaveBeenCalledTimes(1);
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("amber");
	});

	it("keyboard: one tab stop, arrows move focus and skip disabled, Space selects", async () => {
		const screen = await render(SwatchGroupHarness, { "aria-label": "Brand", initial: "amber" });
		screen.getByRole("radio", { name: "amber" }).element().focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(document.activeElement).toBe(
			screen.getByRole("radio", { name: "Ocean blue" }).element()
		);
		await userEvent.keyboard("{ArrowRight}");
		expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Brand" }).element());
		await userEvent.keyboard(" ");
		await expect.element(screen.getByTestId("bound")).toHaveTextContent("brand");
	});

	it("paints from the preset by default and from `color` when given", async () => {
		const screen = await render(SwatchGroupHarness, { "aria-label": "Brand" });
		const amber = screen.getByRole("radio", { name: "amber" }).element();
		expect(amber.getAttribute("data-preset")).toBe("amber");
		const brand = screen.getByRole("radio", { name: "Brand" }).element();
		expect(brand.hasAttribute("data-preset")).toBe(false);
		expect(getComputedStyle(brand).backgroundColor).toBe("rgb(232, 89, 12)");
	});

	// Regression (#122): 44px ::after tap pads on 26px swatches at a 34px pitch overlapped, so the
	// neighbour's pad intercepted the click and selecting a swatch silently failed. A swatch's tap
	// area (its box plus its ::after pad) must stay inside its own slot.
	it("no swatch tap area reaches into a neighbouring swatch", async () => {
		const screen = await render(SwatchGroupHarness, { "aria-label": "Brand" });
		const radios = screen.getByRole("radio").elements() as HTMLElement[];
		const tapArea = (el: HTMLElement) => {
			const b = el.getBoundingClientRect();
			const a = getComputedStyle(el, "::after");
			if (a.content === "none" || a.position !== "absolute") return b;
			const w = Number.parseFloat(a.width);
			const h = Number.parseFloat(a.height);
			const cx = b.left + b.width / 2;
			const cy = b.top + b.height / 2;
			return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
		};
		const areas = radios.map(tapArea);
		for (let i = 1; i < areas.length; i++) {
			expect(areas[i].left, `swatch ${i} overlaps swatch ${i - 1}`).toBeGreaterThanOrEqual(
				areas[i - 1].right
			);
		}
		for (const r of radios) {
			const b = r.getBoundingClientRect();
			const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
			expect(at?.closest(".ca-swatch")).toBe(r);
		}
	});
});
