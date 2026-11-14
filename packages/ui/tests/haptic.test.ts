import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

const { haptic } = await import("../src/lib/utils/haptic.js");

/** Every pattern the page asked the device for. */
let calls: (number | number[])[] = [];
let reduce = false;

/** happy-dom has no `navigator.vibrate`, like desktop Safari and Firefox: give the page one. */
function withVibrate() {
	Object.defineProperty(navigator, "vibrate", {
		configurable: true,
		value: (pattern: number | number[]) => {
			calls.push(pattern);
			return true;
		},
	});
}

beforeEach(() => {
	calls = [];
	reduce = false;
	localStorage.clear();
	Reflect.deleteProperty(navigator, "vibrate");
	window.matchMedia = ((q: string) => ({
		matches: q.includes("reduced-motion") && reduce,
		addEventListener() {},
	})) as unknown as typeof window.matchMedia;
});

describe("haptic", () => {
	it("vibrates one distinct pattern per kind", () => {
		withVibrate();
		expect(haptic("tap")).toBe(true);
		expect(haptic("success")).toBe(true);
		expect(haptic("error")).toBe(true);
		expect(haptic()).toBe(true);
		const [tap, success, error, fallback] = calls;
		expect(fallback).toEqual(tap);
		expect(new Set([tap, success, error].map((p) => JSON.stringify(p))).size).toBe(3);
	});

	it("is a silent no-op without navigator.vibrate", () => {
		expect(haptic.supported).toBe(false);
		expect(() => haptic("error")).not.toThrow();
		expect(haptic("tap")).toBe(false);
	});

	it("follows its own opt-out, persisted under ca-haptic", () => {
		withVibrate();
		expect(haptic.enabled).toBe(true);
		haptic.enable(false);
		expect(haptic("tap")).toBe(false);
		expect(calls).toEqual([]);
		expect(JSON.parse(localStorage.getItem("ca-haptic") ?? "null")).toEqual({ enabled: false });
		haptic.enable(true);
		expect(haptic("tap")).toBe(true);
		expect(calls).toHaveLength(1);
	});

	it("ignores reduced motion and the sound toggle", () => {
		withVibrate();
		reduce = true;
		localStorage.setItem("ca-sound", JSON.stringify({ enabled: false, volume: 0.25 }));
		expect(haptic("success")).toBe(true);
		expect(calls).toHaveLength(1);
	});
});
