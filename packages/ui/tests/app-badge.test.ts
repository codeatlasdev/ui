import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { setAppBadge } from "../src/lib/utils/app-badge.js";
import { globalStubs } from "./stub-global.js";

/**
 * #1182: the page hook and the push handler of the app each called `navigator.setAppBadge` by hand. One
 * helper, usable from both, has to feature-detect, never throw, clear on 0 and normalise the count, so a
 * push carrying `app_badge: 3` and a page whose total is 3 make the same call.
 */
const globals = globalStubs();
afterEach(() => globals.restore());

type Call = [method: "set" | "clear", value: number | undefined, self: unknown];

/** A navigator with the Badging API that records each call, its argument and its `this`. */
function badgingNavigator(fail?: "reject" | "throw") {
	const calls: Call[] = [];
	const nav = {
		setAppBadge(this: unknown, value?: number) {
			calls.push(["set", value, this]);
			if (fail === "throw") throw new TypeError("Illegal invocation");
			return fail === "reject"
				? Promise.reject(new DOMException("Not installed", "NotAllowedError"))
				: Promise.resolve();
		},
		clearAppBadge(this: unknown) {
			calls.push(["clear", undefined, this]);
			if (fail === "throw") throw new TypeError("Illegal invocation");
			return fail === "reject"
				? Promise.reject(new DOMException("Not installed", "NotAllowedError"))
				: Promise.resolve();
		},
	};
	globals.stub("navigator", nav);
	return { nav, calls };
}

describe("setAppBadge (#1182)", () => {
	it("a count above 0 sets the badge, called on navigator", async () => {
		const { nav, calls } = badgingNavigator();
		expect(await setAppBadge(5)).toBe(true);
		expect(calls).toEqual([["set", 5, nav]]);
	});

	it("0, null, undefined and garbage clear the badge", async () => {
		const { nav, calls } = badgingNavigator();
		for (const v of [0, null, undefined, -2, Number.NaN, "", "abc"])
			expect(await setAppBadge(v)).toBe(true);
		expect(calls).toEqual(Array.from({ length: 7 }, () => ["clear", undefined, nav] as Call));
	});

	it("normalises the count to the integer range the API accepts", async () => {
		const { calls } = badgingNavigator();
		await setAppBadge(3.9);
		await setAppBadge(0.5);
		await setAppBadge(1e20);
		expect(calls.map(([m, v]) => [m, v])).toEqual([
			["set", 3],
			["clear", undefined],
			["set", Number.MAX_SAFE_INTEGER],
		]);
	});

	it("a push app_badge of 3 and a page total of 3 make the same call", async () => {
		const { calls } = badgingNavigator();
		const push = JSON.parse('{"app_badge":"3"}') as { app_badge: string };
		await setAppBadge(push.app_badge);
		const total = 1 + 2;
		await setAppBadge(total);
		expect(calls.map(([m, v]) => [m, v])).toEqual([
			["set", 3],
			["set", 3],
		]);
	});

	it("is a silent no-op without the Badging API", async () => {
		globals.stub("navigator", {});
		expect(await setAppBadge(4)).toBe(false);
		expect(await setAppBadge(0)).toBe(false);
		globals.stub("navigator", undefined);
		expect(await setAppBadge(4)).toBe(false);
		expect(await setAppBadge(0)).toBe(false);
	});

	it("swallows a rejected promise and a synchronous throw", async () => {
		badgingNavigator("reject");
		expect(await setAppBadge(2)).toBe(false);
		expect(await setAppBadge(0)).toBe(false);
		badgingNavigator("throw");
		expect(await setAppBadge(2)).toBe(false);
		expect(await setAppBadge(0)).toBe(false);
	});

	it("loads in a service worker: its subpath imports nothing", () => {
		const pkg = JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf8"));
		expect(pkg.exports["./utils/app-badge"]).toEqual({
			types: "./dist/utils/app-badge.d.ts",
			default: "./dist/utils/app-badge.js",
		});
		const src = readFileSync(join(import.meta.dir, "../src/lib/utils/app-badge.ts"), "utf8");
		expect(src).not.toMatch(/^\s*(import|export\s.*\sfrom)\s/m);
	});
});
