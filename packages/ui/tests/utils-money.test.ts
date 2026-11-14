// #1140: integer money arithmetic on minor units, computed in bigint (@codeatlasdev/ui/utils/money).
import { describe, expect, test } from "bun:test";
import {
	allocateByWeights,
	applyBasisPoints,
	assertCents,
	divRound,
	divRoundHalfUp,
	multiplyCents,
	type RoundingMode,
	sumCents,
} from "../src/lib/utils/money.js";

const MODES: RoundingMode[] = [
	"ceil",
	"floor",
	"expand",
	"trunc",
	"halfCeil",
	"halfFloor",
	"halfExpand",
	"halfTrunc",
	"halfEven",
];
const MAX = Number.MAX_SAFE_INTEGER;

describe("issue #1140 acceptance", () => {
	test("allocateByWeights(100, [1,1,1]) is [34,33,33]", () => {
		expect(allocateByWeights(100, [1, 1, 1])).toEqual([34, 33, 33]);
	});
	test("applyBasisPoints(10000, 250) is 250", () => {
		expect(applyBasisPoints(10000, 250)).toBe(250);
	});
	test("assertCents(1.5) throws", () => {
		expect(() => assertCents(1.5)).toThrow(RangeError);
	});
	test("divRoundHalfUp(5, 2) is 3", () => {
		expect(divRoundHalfUp(5, 2)).toBe(3);
	});
});

describe("assertCents", () => {
	test("accepts safe integers and bigints", () => {
		for (const v of [0, -0, 1, -1, MAX, -MAX, 0n, 10n ** 30n, -(10n ** 30n)])
			expect(() => assertCents(v)).not.toThrow();
	});
	test("rejects fractions, unsafe integers and non-numbers", () => {
		for (const v of [1.5, -0.01, Number.NaN, Number.POSITIVE_INFINITY, MAX + 1, 2 ** 60])
			expect(() => assertCents(v)).toThrow(RangeError);
		for (const v of ["100", null, undefined, {}]) expect(() => assertCents(v)).toThrow(TypeError);
	});
	test("names the value in the message", () => {
		expect(() => assertCents(1.5, "price")).toThrow(/price/);
	});
});

describe("divRound", () => {
	test("each mode rounds n/d exactly like Intl.NumberFormat's roundingMode", () => {
		// Denominators 1, 2, 4, 5, 8 keep n/d an exact binary fraction, so Intl sees the true value.
		for (const mode of MODES) {
			// `roundingMode` is ES2023 Intl; the root tsconfig's lib is ES2022.
			const options = { maximumFractionDigits: 0, roundingMode: mode, useGrouping: false };
			const intl = new Intl.NumberFormat("en-US", options as Intl.NumberFormatOptions);
			for (const d of [1, 2, 4, 5, 8])
				for (let n = -20; n <= 20; n++) {
					const want = Number(intl.format(n / d)) || 0;
					expect([mode, n, d, divRound(n, d, mode)]).toEqual([mode, n, d, want]);
					expect(divRound(BigInt(n), BigInt(d), mode)).toBe(BigInt(want));
				}
		}
	});
	test("half up rounds a tie away from zero, also below zero", () => {
		expect(divRoundHalfUp(-5, 2)).toBe(-3);
		expect(divRoundHalfUp(5, -2)).toBe(-3);
		expect(divRoundHalfUp(-5, -2)).toBe(3);
		expect(divRoundHalfUp(7, 3)).toBe(2);
	});
	test("stays exact beyond Number.MAX_SAFE_INTEGER with bigint", () => {
		const n = 10n ** 30n + 1n;
		expect(divRoundHalfUp(n, 2n)).toBe(5n * 10n ** 29n + 1n);
		expect(divRound(n, 2n, "halfEven")).toBe(5n * 10n ** 29n);
	});
	test("rejects a zero divisor, fractions and an unknown mode", () => {
		expect(() => divRound(1, 0)).toThrow(RangeError);
		expect(() => divRound(1.5, 2)).toThrow(RangeError);
		expect(() => divRound(1, 2, "up" as RoundingMode)).toThrow(RangeError);
	});
});

describe("sumCents", () => {
	test("adds numbers and bigints", () => {
		expect(sumCents([])).toBe(0);
		expect(sumCents([10, 20, -5])).toBe(25);
		expect(sumCents([10n ** 20n, 1n, -2n])).toBe(10n ** 20n - 1n);
	});
	test("refuses a number total past MAX_SAFE_INTEGER instead of rounding it", () => {
		expect(() => sumCents([MAX, 1])).toThrow(RangeError);
		expect(sumCents([BigInt(MAX), 1n])).toBe(BigInt(MAX) + 1n);
	});
	test("rejects a float in the list", () => {
		expect(() => sumCents([10, 0.1])).toThrow(RangeError);
	});
});

describe("multiplyCents", () => {
	test("multiplies by a quantity exactly", () => {
		expect(multiplyCents(1999, 3)).toBe(5997);
		expect(multiplyCents(-1999, 3n)).toBe(-5997);
		expect(multiplyCents(10n ** 30n + 1n, 3)).toBe(3n * 10n ** 30n + 3n);
	});
	test("reads a number rate as the decimal it prints as, not its binary value", () => {
		// 100 * 1.005 is 100.49999999999999 in floating point, so Math.round gives 100.
		expect(Math.round(100 * 1.005)).toBe(100);
		expect(multiplyCents(100, 1.005)).toBe(101);
		expect(multiplyCents(1999, 1.075)).toBe(2149); // 2148.925
		expect(multiplyCents(100, 1e-7, "ceil")).toBe(1);
	});
	test("takes a decimal string rate with any number of digits", () => {
		expect(multiplyCents(10n ** 21n, "0.333333333333333333333")).toBe(333333333333333333333n);
		expect(multiplyCents(300, "-0.5")).toBe(-150);
	});
	test("rounds a tie with the given mode", () => {
		expect(multiplyCents(25, 0.5)).toBe(13);
		expect(multiplyCents(25, 0.5, "halfEven")).toBe(12);
		expect(multiplyCents(-25, 0.5)).toBe(-13);
		expect(multiplyCents(-25, 0.5, "trunc")).toBe(-12);
	});
	test("refuses a number result past MAX_SAFE_INTEGER", () => {
		expect(() => multiplyCents(MAX, 2)).toThrow(RangeError);
		expect(multiplyCents(BigInt(MAX), 2)).toBe(BigInt(MAX) * 2n);
	});
	test("rejects a rate that is not a finite decimal", () => {
		for (const r of [Number.NaN, Number.POSITIVE_INFINITY, "1,5", "abc", "", "."])
			expect(() => multiplyCents(100, r)).toThrow(RangeError);
		expect(() => multiplyCents(100, null as unknown as number)).toThrow(TypeError);
	});
});

describe("applyBasisPoints", () => {
	test("returns the share of the amount, rounded half up by default", () => {
		expect(applyBasisPoints(12345, 250)).toBe(309); // 308.625
		expect(applyBasisPoints(12345, 250, "trunc")).toBe(308);
		expect(applyBasisPoints(-12345, 250)).toBe(-309);
		expect(applyBasisPoints(10000, -250)).toBe(-250);
	});
	test("takes fractional basis points and bigint amounts", () => {
		expect(applyBasisPoints(100000, 12.5)).toBe(125);
		expect(applyBasisPoints(100000, "0.5")).toBe(5);
		expect(applyBasisPoints(10n ** 25n, 1)).toBe(10n ** 21n);
	});
});

describe("allocateByWeights", () => {
	test("gives the leftover cents to the largest remainders", () => {
		expect(allocateByWeights(100, [1, 2])).toEqual([33, 67]);
		expect(allocateByWeights(10, [3, 3, 4])).toEqual([3, 3, 4]);
		expect(allocateByWeights(101, [1, 1, 1, 1])).toEqual([26, 25, 25, 25]);
	});
	test("breaks ties by position, so the same input always splits the same way", () => {
		expect(allocateByWeights(2, [1, 1, 1])).toEqual([1, 1, 0]);
		expect(allocateByWeights(1, [1, 1, 1])).toEqual([1, 0, 0]);
	});
	test("mirrors a negative total", () => {
		expect(allocateByWeights(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
		expect(allocateByWeights(-100, [1, 2])).toEqual([-33, -67]);
	});
	test("gives nothing to a zero weight", () => {
		expect(allocateByWeights(101, [0, 1, 1])).toEqual([0, 51, 50]);
	});
	test("takes decimal weights such as percentages", () => {
		expect(allocateByWeights(100, [0.5, 0.25, 0.25])).toEqual([50, 25, 25]);
		expect(allocateByWeights(1000, [33.33, 33.33, 33.34])).toEqual([333, 333, 334]);
	});
	test("always sums to the total, each share within one cent of exact", () => {
		let seed = 1140;
		const rand = (n: number) => {
			seed = (seed * 48271) % 2147483647;
			return seed % n;
		};
		for (let i = 0; i < 2000; i++) {
			const total = rand(2_000_001) - 1_000_000;
			const weights = Array.from({ length: 1 + rand(7) }, () => rand(50));
			if (!weights.some((w) => w > 0)) weights[0] = 1;
			const shares = allocateByWeights(total, weights);
			const sum = weights.reduce((a, b) => a + b, 0);
			expect(shares.reduce((a, b) => a + b, 0)).toBe(total);
			shares.forEach((s, j) => {
				expect(Math.abs(s - (total * weights[j]) / sum)).toBeLessThan(1);
			});
		}
	});
	test("stays exact beyond Number.MAX_SAFE_INTEGER with bigint", () => {
		const total = 10n ** 24n + 1n;
		const shares = allocateByWeights(total, [1n, 1n, 1n]);
		expect(shares).toEqual([333333333333333333333334n, 333333333333333333333334n, 10n ** 24n / 3n]);
		expect(shares.reduce((a, b) => a + b, 0n)).toBe(total);
	});
	test("rejects no weights, a negative weight and all-zero weights", () => {
		expect(() => allocateByWeights(100, [])).toThrow(RangeError);
		expect(() => allocateByWeights(100, [1, -1])).toThrow(RangeError);
		expect(() => allocateByWeights(100, [0, 0])).toThrow(RangeError);
		expect(() => allocateByWeights(1.5, [1])).toThrow(RangeError);
	});
});
