import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { q } from "../../../../tests/dom";
import Harness from "./PageShellScroll.test.svelte";

const settle = () =>
	new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

describe("PageShell scrolling inside AppShellLayout (#673)", () => {
	it("the scrollbar sits at the content region's edge, not beside the centred column", async () => {
		await page.viewport(1600, 900);
		await render(Harness);
		await settle();
		const region = q(document.body, ".ca-shell__content");
		const column = q(document.body, ".ca-page-shell");
		// The column is the centred max-width box; it is narrower than the region at 1600px.
		expect(column.getBoundingClientRect().width).toBeLessThan(region.clientWidth - 100);
		// The region scrolls (its scrollbar is at its right edge) and the column does not.
		expect(region.scrollHeight).toBeGreaterThan(region.clientHeight + 100);
		expect(getComputedStyle(region).overflowY).toMatch(/auto|scroll/);
		expect(column.scrollHeight).toBeLessThanOrEqual(column.clientHeight + 1);
		// The scroll container's right edge is the content region's edge (where its scrollbar is drawn), and
		// the centred column sits strictly inside it.
		const r = region.getBoundingClientRect();
		const c = column.getBoundingClientRect();
		expect(r.right).toBeGreaterThan(c.right + 50);
		expect(c.left - r.left).toBeCloseTo(r.right - c.right, 0);
	});

	it("a visually hidden child at the end adds no document scroll", async () => {
		await page.viewport(1600, 900);
		await render(Harness);
		await settle();
		const hidden = q(document.body, "[data-testid='hidden-end']");
		hidden.scrollIntoView();
		await settle();
		const doc = document.documentElement;
		expect(doc.scrollHeight).toBeLessThanOrEqual(doc.clientHeight + 1);
		expect(doc.scrollTop).toBe(0);
	});

	it("a PageShell outside any shell still scrolls itself", async () => {
		await page.viewport(1600, 900);
		await render(Harness, { shell: false });
		await settle();
		const column = q(document.body, ".ca-page-shell");
		expect(column.scrollHeight).toBeGreaterThan(column.clientHeight + 100);
		expect(getComputedStyle(column).overflowY).toMatch(/auto|scroll/);
	});
});
