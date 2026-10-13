import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import { cn } from "../src/lib/utils/cn.js";
import { debounce } from "../src/lib/utils/debounce.js";
import {
	formatCurrency,
	formatDate,
	formatNumber,
	formatRelativeTime,
} from "../src/lib/utils/format.js";
import { storageGet, storageRemove, storageSet } from "../src/lib/utils/local-storage.js";
import { throttle } from "../src/lib/utils/throttle.js";
import { uid } from "../src/lib/utils/uid.js";
import { globalStubs } from "./stub-global.js";

describe("debounce", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it("fires once with the last arguments after the quiet period", () => {
		const fn = mock();
		const d = debounce(fn, 100);
		d("a");
		jest.advanceTimersByTime(60);
		d("b");
		jest.advanceTimersByTime(60);
		expect(fn).not.toHaveBeenCalled();
		jest.advanceTimersByTime(40);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("b");
	});

	it("fires again for a later burst", () => {
		const fn = mock();
		const d = debounce(fn, 50);
		d(1);
		jest.advanceTimersByTime(50);
		d(2);
		jest.advanceTimersByTime(50);
		expect(fn.mock.calls).toEqual([[1], [2]]);
	});
});

describe("throttle", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it("runs the first call immediately and drops calls inside the window", () => {
		const fn = mock();
		const t = throttle(fn, 100);
		t("a");
		t("b");
		t("c");
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("a");
	});

	it("accepts a call again once the window elapsed", () => {
		const fn = mock();
		const t = throttle(fn, 100);
		t("a");
		jest.advanceTimersByTime(100);
		t("b");
		expect(fn.mock.calls).toEqual([["a"], ["b"]]);
	});
});

describe("format", () => {
	it("formatNumber uses the requested locale", () => {
		expect(formatNumber(1234567)).toBe("1,234,567");
		expect(formatNumber(1234567, "pt-BR")).toBe("1.234.567");
	});

	it("formatCurrency", () => {
		expect(formatCurrency(1234.5)).toBe("$1,234.50");
		expect(formatCurrency(1234.5, "BRL", "pt-BR").replace(/\s/g, " ")).toBe("R$ 1.234,50");
	});

	it("formatDate accepts Date, timestamp and ISO string alike", () => {
		const iso = "2026-09-16T12:00:00Z";
		const opts = { timeZone: "UTC" } as const;
		const expected = formatDate(iso, "en-US", {
			...opts,
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		expect(expected).toBe("Sep 16, 2026");
		expect(
			formatDate(new Date(iso), "en-US", {
				...opts,
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		).toBe(expected);
		expect(
			formatDate(Date.parse(iso), "en-US", {
				...opts,
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		).toBe(expected);
	});

	describe("formatRelativeTime", () => {
		const NOW = Date.parse("2026-01-01T12:00:00Z");
		beforeEach(() => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
		});
		afterEach(() => jest.useRealTimers());

		it.each([
			[-30_000, "30 seconds ago"],
			[-5 * 60_000, "5 minutes ago"],
			[-3_600_000, "1 hour ago"],
			[86_400_000, "tomorrow"],
			[-3 * 86_400_000, "3 days ago"],
			[-60 * 86_400_000, "2 months ago"],
			[-2 * 31_536_000_000, "2 years ago"],
		])("offset %d → %s", (offset, text) => {
			expect(formatRelativeTime(NOW + offset)).toBe(text);
		});

		it("honours locale", () => {
			// Deliberate pt-BR output: checks the locale argument is honoured.
			expect(formatRelativeTime(NOW - 3_600_000, "pt-BR")).toBe("há 1 hora");
		});
	});
});

describe("uid", () => {
	it("uses the prefix and defaults to `ca`", () => {
		expect(uid("tf")).toMatch(/^tf-[a-z0-9]+$/);
		expect(uid()).toMatch(/^ca-[a-z0-9]+$/);
	});

	it("does not collide across many calls", () => {
		const ids = new Set(Array.from({ length: 500 }, () => uid()));
		expect(ids.size).toBe(500);
	});
});

describe("cn", () => {
	it("joins strings and drops falsy values", () => {
		expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
	});

	it("supports object and array forms", () => {
		expect(cn({ on: true, off: false }, ["x", ["y"]])).toBe("on x y");
	});
});

describe("local-storage helpers", () => {
	const store = new Map<string, string>();
	const fake = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k),
	};

	const globals = globalStubs();

	beforeEach(() => {
		store.clear();
		globals.stub("localStorage", fake);
	});
	afterEach(() => globals.restore());

	it("round-trips JSON values", () => {
		storageSet("k", { a: [1, 2] });
		expect(store.get("k")).toBe('{"a":[1,2]}');
		expect(storageGet<{ a: number[] } | null>("k", null)).toEqual({ a: [1, 2] });
	});

	it("returns the fallback for missing keys", () => {
		expect(storageGet("nope", "fb")).toBe("fb");
	});

	it("returns the fallback for corrupt JSON instead of throwing", () => {
		store.set("bad", "{not json");
		expect(storageGet("bad", 42)).toBe(42);
	});

	it("removes keys", () => {
		storageSet("k", 1);
		storageRemove("k");
		expect(storageGet("k", "gone")).toBe("gone");
	});

	it("is a safe no-op without localStorage (SSR)", () => {
		globals.stub("localStorage", undefined);
		expect(storageGet("k", "fb")).toBe("fb");
		expect(() => storageSet("k", 1)).not.toThrow();
		expect(() => storageRemove("k")).not.toThrow();
	});
});
