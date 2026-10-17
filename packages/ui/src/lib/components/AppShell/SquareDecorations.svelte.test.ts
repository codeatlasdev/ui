import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./SquareDecorations.test.svelte";

const radius = (sel: string) =>
	getComputedStyle(document.querySelector(sel) as Element).borderRadius;

// #267: pill/circle decorations follow the theme `radius` multiplier (0 = square identity).
const root = document.documentElement;
describe("round decorations follow --ca-radius-scale", () => {
	afterEach(() => root.style.removeProperty("--ca-radius-scale"));

	it("radius 0 squares the swatch, both active pips and the new-item dot", async () => {
		root.style.setProperty("--ca-radius-scale", "0");
		await render(Harness);
		expect(radius(".ca-swatch")).toBe("0px");
		expect(radius(".ca-nav-item__pip")).toBe("0px");
		expect(radius(".ca-nav-item__dot")).toBe("0px");
		expect(radius(".ca-rail__pip")).toBe("0px");
	});

	it("the default scale keeps them fully rounded", async () => {
		await render(Harness);
		for (const sel of [".ca-swatch", ".ca-nav-item__pip", ".ca-nav-item__dot", ".ca-rail__pip"]) {
			expect(Number.parseFloat(radius(sel))).toBeGreaterThanOrEqual(100);
		}
	});
});
