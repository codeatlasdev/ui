import { afterAll, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { VIEWPORTS } from "../../../tests/viewports";
import { BREAKPOINTS } from "../components/Layout/layout.js";
import { responsive } from "./responsive.svelte.js";

responsive.init();

afterAll(async () => {
	await page.viewport(...VIEWPORTS.desktop);
});

async function at(w: number, h = 800) {
	await page.viewport(w, h);
	await expect.poll(() => responsive.width).toBe(w);
}

describe("responsive store", () => {
	it.each([
		[390, "xs"],
		[600, "sm"],
		[899, "sm"],
		[900, "md"],
		[1200, "lg"],
		[1536, "xl"],
	] as const)("width %i → breakpoint %s", async (w, bp) => {
		await at(w);
		expect(responsive.current).toBe(bp);
		expect(responsive.only(bp)).toBe(true);
	});

	it("mobile: isMobile, down(md), not up(md)", async () => {
		await at(VIEWPORTS.mobile[0], VIEWPORTS.mobile[1]);
		expect(responsive.isMobile).toBe(true);
		expect(responsive.isDesktop).toBe(false);
		expect(responsive.down("md")).toBe(true);
		expect(responsive.up("md")).toBe(false);
	});

	it("tablet (900) leaves mobile and is tablet", async () => {
		await at(VIEWPORTS.tablet[0], VIEWPORTS.tablet[1]);
		expect(responsive.isMobile).toBe(false);
		expect(responsive.isTablet).toBe(true);
		expect(responsive.up("md")).toBe(true);
	});

	it("desktop (1280) is desktop and up(lg)", async () => {
		await at(VIEWPORTS.desktop[0], VIEWPORTS.desktop[1]);
		expect(responsive.isDesktop).toBe(true);
		expect(responsive.isTablet).toBe(false);
		expect(responsive.up("lg")).toBe(true);
		expect(responsive.down("lg")).toBe(false);
	});

	// layout.ts owns the scale (#649): the store adds `xs` (0) to it and nothing else.
	it("exposes the breakpoint table of layout.ts plus xs", () => {
		expect(responsive.BREAKPOINTS).toEqual({ xs: 0, ...BREAKPOINTS });
	});
});
