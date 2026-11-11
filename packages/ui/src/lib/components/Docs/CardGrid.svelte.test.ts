import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Harness from "./CardGridMin.test.svelte";

const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
const grid = () => getComputedStyle(document.querySelector(".ca-card-grid") as Element);
const columns = () => grid().gridTemplateColumns.split(" ").length;
/** Columns of `min` px that fit in the 1000px host with the grid's real gap. */
const fit = (min: number) => {
	const gap = Number.parseFloat(grid().columnGap);
	return Math.floor((1000 + gap) / (min + gap));
};

describe("CardGrid minItemWidth (#719)", () => {
	it("defaults to 16rem columns", async () => {
		await render(Harness);
		expect(columns()).toBe(fit(16 * rem()));
	});

	it("a smaller minItemWidth fits more columns in the same width", async () => {
		const screen = await render(Harness, { minItemWidth: "10rem" });
		expect(columns()).toBe(fit(10 * rem()));
		expect(columns()).toBeGreaterThan(fit(16 * rem()));
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a larger minItemWidth fits fewer columns", async () => {
		await render(Harness, { minItemWidth: "24rem" });
		expect(columns()).toBe(fit(24 * rem()));
		expect(columns()).toBeLessThan(fit(16 * rem()));
	});
});
