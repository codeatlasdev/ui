/// <reference types="@vitest/browser-playwright" />
import { afterEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";
import { reducedMotion, reducedTransparency } from "./reduced-motion.svelte.js";

const emulate = (name: string, value: "reduce" | "no-preference") =>
	cdp().send("Emulation.setEmulatedMedia", { features: [{ name, value }] });

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("reducedMotion store", () => {
	it("is false by default and follows prefers-reduced-motion live", async () => {
		await emulate("prefers-reduced-motion", "no-preference");
		reducedMotion.init();
		expect(reducedMotion.value).toBe(false);

		await emulate("prefers-reduced-motion", "reduce");
		await expect.poll(() => reducedMotion.value).toBe(true);

		await emulate("prefers-reduced-motion", "no-preference");
		await expect.poll(() => reducedMotion.value).toBe(false);
	});

	it("init() reads the current preference immediately", async () => {
		await emulate("prefers-reduced-motion", "reduce");
		reducedMotion.init();
		expect(reducedMotion.value).toBe(true);
	});
});

// #1102: the server assumes reduced motion; the client reads the real preference as soon as the store loads,
// so a page that never calls init() does not stay in the server's snapshot (hydration repairs the markup).
describe("reducedMotion before init()", () => {
	it.each([
		["no-preference", false],
		["reduce", true],
	] as const)("reads %s on the client without init()", async (pref, expected) => {
		await emulate("prefers-reduced-motion", pref);
		const fresh = await import(/* @vite-ignore */ `./reduced-motion.svelte.js?fresh=${pref}`);
		expect(fresh.reducedMotion.value).toBe(expected);
	});
});

describe("reducedTransparency store", () => {
	it("follows prefers-reduced-transparency", async () => {
		await emulate("prefers-reduced-transparency", "no-preference");
		reducedTransparency.init();
		expect(reducedTransparency.value).toBe(false);
		await emulate("prefers-reduced-transparency", "reduce");
		await expect.poll(() => reducedTransparency.value).toBe(true);
	});
});
