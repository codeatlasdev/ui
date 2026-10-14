import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./KpiGridHarness.test.svelte";

type Layout = { rows: number[]; cols: number; cards: number };

/** Groups the direct children by their top edge: one entry per visual row, value = cards in it. */
function measure(root: HTMLElement, selector: string): Layout {
	const cards = [...q(root, selector).children] as HTMLElement[];
	const tops = new Map<number, number>();
	for (const c of cards) {
		const top = Math.round(c.getBoundingClientRect().top);
		tops.set(top, (tops.get(top) ?? 0) + 1);
	}
	const rows = [...tops.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n);
	return { rows, cols: Math.max(...rows), cards: cards.length };
}

/** An orphan = any row with fewer cards than the first one (a partially filled last row). */
const hasOrphan = ({ rows }: Layout) => rows.some((n) => n !== rows[0]);

describe("KpiGrid", () => {
	it("the documented auto-fill recipe leaves an orphan for 3 cards at 390px", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { count: 3, recipe: true });
		const layout = measure(screen.container, ".ca-grid");
		expect(layout.rows).toEqual([2, 1]);
		expect(hasOrphan(layout)).toBe(true);
	});

	/** Cards per row expected at 390px (1 or 2 columns, never an orphan). */
	const PHONE: Record<number, number[]> = {
		1: [1],
		2: [2],
		3: [1, 1, 1],
		4: [2, 2],
		5: [1, 1, 1, 1, 1],
		6: [2, 2, 2],
		7: [1, 1, 1, 1, 1, 1, 1],
		8: [2, 2, 2, 2],
		9: [1, 1, 1, 1, 1, 1, 1, 1, 1],
	};

	/** Cards per row expected at 1280px: the widest divisor of the count that fits (10rem tiles). */
	const DESKTOP: Record<number, number[]> = {
		1: [1],
		2: [2],
		3: [3],
		4: [4],
		5: [5],
		6: [6],
		7: [7],
		8: [4, 4],
		9: [3, 3, 3],
	};

	it.each(Object.keys(PHONE).map(Number))(
		"lays out %i cards without an orphan at 390px",
		async (count) => {
			await page.viewport(...VIEWPORTS.mobile);
			const screen = await render(Harness, { count });
			await expect.element(screen.getByText("Metric 1")).toBeVisible();
			const layout = measure(screen.container, ".ca-kpi-grid__grid");
			expect(layout.cards).toBe(count);
			expect(layout.rows).toEqual(PHONE[count]);
			expect(hasOrphan(layout)).toBe(false);
		}
	);

	it.each(Object.keys(DESKTOP).map(Number))(
		"lays out %i cards without an orphan at 1280px",
		async (count) => {
			await page.viewport(...VIEWPORTS.desktop);
			const screen = await render(Harness, { count });
			await expect.element(screen.getByText("Metric 1")).toBeVisible();
			const layout = measure(screen.container, ".ca-kpi-grid__grid");
			expect(layout.rows).toEqual(DESKTOP[count]);
			expect(hasOrphan(layout)).toBe(false);
		}
	);

	/** Container widths (px) -> cards per row, for the table in the docs page. */
	it.each([
		[3, 360, [1, 1, 1]],
		[3, 528, [3]],
		[4, 344, [2, 2]],
		[4, 712, [4]],
		[5, 712, [1, 1, 1, 1, 1]],
		[5, 896, [5]],
		[6, 344, [2, 2, 2]],
		[6, 528, [3, 3]],
		[6, 1080, [6]],
		[8, 712, [4, 4]],
		[8, 1440, [8]],
	])("%i cards in %ipx wide container", async (count, px, rows) => {
		await page.viewport(1600, 900);
		const screen = await render(Harness, { count, width: `${px}px` });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(measure(screen.container, ".ca-kpi-grid__grid").rows).toEqual(rows);
	});

	it("falls back to auto-fill above 12 cards", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { count: 13 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		const layout = measure(screen.container, ".ca-kpi-grid__grid");
		expect(layout.cards).toBe(13);
		expect(layout.cols).toBeGreaterThan(1);
	});

	it("puts 3 cards on one row on desktop and stacks them on a phone", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		let screen = await render(Harness, { count: 3 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(measure(screen.container, ".ca-kpi-grid__grid").rows).toEqual([3]);
		screen.unmount();
		await page.viewport(...VIEWPORTS.mobile);
		screen = await render(Harness, { count: 3 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(measure(screen.container, ".ca-kpi-grid__grid").rows).toEqual([1, 1, 1]);
	});

	it("keeps 4 cards as a 2x2 on a phone", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { count: 4 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(measure(screen.container, ".ca-kpi-grid__grid").rows).toEqual([2, 2]);
	});

	it("follows the container width, not the viewport", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { count: 3, width: "360px" });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(measure(screen.container, ".ca-kpi-grid__grid").rows).toEqual([1, 1, 1]);
	});

	it("never overflows its container", async () => {
		await page.viewport(320, 640);
		const screen = await render(Harness, { count: 5 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		const grid = q(screen.container, ".ca-kpi-grid__grid");
		expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth);
	});

	it("has no axe violations", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { count: 3 });
		await expect.element(screen.getByText("Metric 1")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
