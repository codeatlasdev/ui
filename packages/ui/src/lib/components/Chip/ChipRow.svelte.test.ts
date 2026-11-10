import { describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { touchTarget } from "../../../../tests/touch-target";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./ChipRow.test.svelte";

async function coarse<T>(fn: () => Promise<T>) {
	await page.viewport(...VIEWPORTS.mobile);
	await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
	try {
		return await fn();
	} finally {
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
	}
}

// A tap just above or below a chip, inside the 44px area the chip promises, must land on the chip: a
// scroller clips the overhanging ::after, so the row reserves that room itself (#727).
const hitsChip = (chip: Element, dy: number) => {
	const r = chip.getBoundingClientRect();
	const hit = document.elementFromPoint(r.left + r.width / 2, r.top + dy);
	return !!hit && (hit === chip || chip.contains(hit));
};

describe("ChipRow (#727)", () => {
	it("a bare scroller clips the 44px hit area (the bug)", async () => {
		await coarse(async () => {
			await render(Harness, { raw: true });
			const chip = q(document.body, ".ca-chip");
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			expect(hitsChip(chip, -6)).toBe(false);
		});
	});

	it("keeps the whole 44px hit area above and below a chip without growing the layout", async () => {
		await coarse(async () => {
			const screen = await render(Harness);
			const row = q(screen.container, ".ca-chip-row");
			const chip = q(row, ".ca-chip");
			const h = chip.getBoundingClientRect().height;
			const gap = (touchTarget() - h) / 2;
			expect(gap).toBeGreaterThan(4);
			expect(hitsChip(chip, -(gap - 1))).toBe(true);
			expect(hitsChip(chip, h + gap - 1)).toBe(true);
			// The bleed is cancelled by a negative margin: the row occupies the chip's height in the page.
			const r = row.getBoundingClientRect();
			const content = row.parentElement as HTMLElement;
			expect(r.height - 2 * gap).toBeCloseTo(h, 0);
			expect(content.getBoundingClientRect().height).toBeLessThan(h + 2 * 12 + 2);
		});
	});

	it("scrolls sideways, contains horizontal overscroll and hides the scrollbar", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness);
		const row = q(screen.container, ".ca-chip-row");
		expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
		const s = getComputedStyle(row);
		expect(s.overflowX).toBe("auto");
		expect(s.overscrollBehaviorX).toBe("contain");
		expect(s.scrollbarWidth).toBe("none");
		expect(row.getAttribute("role")).toBe("group");
		expect(row.getAttribute("aria-label")).toBe("Filter chats");
	});

	it("wrap switches to a wrapping row with no scroller", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { wrap: true });
		const row = q(screen.container, ".ca-chip-row");
		expect(getComputedStyle(row).flexWrap).toBe("wrap");
		expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
	});

	it("passes axe in the scrolling, wrapping and fading variants", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		for (const props of [{}, { wrap: true }, { fade: true }]) {
			const screen = await render(Harness, props);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			screen.unmount();
		}
	});
});
