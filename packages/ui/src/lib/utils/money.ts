// ─── @codeatlasdev/ui/utils/money: integer arithmetic on minor units ─────────────────────────
//
// "Cents" means the currency's minor unit, as in `forms/money.ts` (formatting and parsing live
// there). Every operation runs in `bigint`, so nothing is lost to floating point, and the result
// has the type of the amount it was given: `number` in, `number` out; `bigint` in, `bigint` out.
// A `number` result past `Number.MAX_SAFE_INTEGER` throws instead of silently rounding.

/** An integer amount in the currency's minor unit: a safe-integer `number` or a `bigint`. */
export type Cents = number | bigint;

/**
 * A multiplier: an integer, or a decimal read as the digits it prints as (`1.005` is exactly
 * 1005/1000, not its binary value), or a decimal string of any precision (`"0.0725"`).
 */
export type Rate = number | bigint | string;

/**
 * How a result between two integers is rounded, with the names and meaning of
 * `Intl.NumberFormat`'s `roundingMode`. `halfExpand` (the default) is "half up": a tie goes away
 * from zero, so 2.5 → 3 and -2.5 → -3. `halfEven` is banker's rounding.
 */
export type RoundingMode =
	| "ceil"
	| "floor"
	| "expand"
	| "trunc"
	| "halfCeil"
	| "halfFloor"
	| "halfExpand"
	| "halfTrunc"
	| "halfEven";

const MODES = new Set<string>([
	"ceil",
	"floor",
	"expand",
	"trunc",
	"halfCeil",
	"halfFloor",
	"halfExpand",
	"halfTrunc",
	"halfEven",
]);
const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

/**
 * Throws unless `value` is an integer amount of minor units: a `bigint`, or a `number` that is a
 * safe integer (`1.5`, `NaN` and `2 ** 53` throw a `RangeError`, a non-number a `TypeError`).
 */
export function assertCents(value: unknown, name = "amount"): asserts value is Cents {
	if (typeof value === "bigint") return;
	if (typeof value !== "number")
		throw new TypeError(`[ca-ui] ${name} must be a number or bigint of cents, got ${typeof value}`);
	if (!Number.isSafeInteger(value))
		throw new RangeError(
			`[ca-ui] ${name} must be an integer of cents within Number.MAX_SAFE_INTEGER (or a bigint), got ${value}`
		);
}

function big(value: Cents, name?: string): bigint {
	assertCents(value, name);
	return BigInt(value);
}

function out(value: bigint, asBigint: boolean): Cents {
	if (asBigint) return value;
	const n = Number(value);
	if (!Number.isSafeInteger(n))
		throw new RangeError(
			`[ca-ui] result ${value} is past Number.MAX_SAFE_INTEGER: pass the amount as a bigint`
		);
	return n;
}

/** A rate as an exact fraction `n / d`, `d` a power of ten. */
function fraction(value: Rate, name: string): [bigint, bigint] {
	if (typeof value === "bigint") return [value, 1n];
	if (typeof value !== "number" && typeof value !== "string")
		throw new TypeError(`[ca-ui] ${name} must be a number, bigint or decimal string`);
	const m = DECIMAL.exec(String(value));
	if (!m || !(m[2] || m[3]))
		throw new RangeError(`[ca-ui] ${name} must be a finite decimal, got ${String(value)}`);
	const digits = m[3] ?? "";
	const exp = Number(m[4] ?? 0) - digits.length;
	const n = BigInt(`${m[1]}${m[2]}${digits}`) * 10n ** BigInt(Math.max(exp, 0));
	return [n, 10n ** BigInt(Math.max(-exp, 0))];
}

/** Integer division of bigints with a rounding mode. */
function divide(n: bigint, d: bigint, mode: RoundingMode): bigint {
	if (!MODES.has(mode)) throw new RangeError(`[ca-ui] unknown rounding mode "${mode}"`);
	if (d === 0n) throw new RangeError("[ca-ui] division by zero");
	if (d < 0n) {
		n = -n;
		d = -d;
	}
	const q = n / d;
	const r = n % d;
	if (r === 0n) return q;
	const negative = n < 0n;
	const twice = (negative ? -r : r) * 2n;
	let rule: string = mode;
	if (mode.startsWith("half")) {
		if (twice !== d) return twice > d ? q + (negative ? -1n : 1n) : q;
		rule = mode.slice(4).toLowerCase();
	}
	const away =
		rule === "expand" ||
		(rule === "ceil" && !negative) ||
		(rule === "floor" && negative) ||
		(rule === "even" && q % 2n !== 0n);
	return away ? q + (negative ? -1n : 1n) : q;
}

/**
 * `numerator / denominator` rounded to an integer with `mode` (default `"halfExpand"`, half away
 * from zero): `divRound(5, 2)` is 3, `divRound(-5, 2)` is -3, `divRound(5, 2, "halfEven")` is 2.
 * A `bigint` numerator gives a `bigint`.
 */
export function divRound(numerator: number, denominator: Cents, mode?: RoundingMode): number;
export function divRound(numerator: bigint, denominator: Cents, mode?: RoundingMode): bigint;
export function divRound(numerator: Cents, denominator: Cents, mode?: RoundingMode): Cents;
export function divRound(
	numerator: Cents,
	denominator: Cents,
	mode: RoundingMode = "halfExpand"
): Cents {
	const q = divide(big(numerator, "numerator"), big(denominator, "denominator"), mode);
	return out(q, typeof numerator === "bigint");
}

/**
 * `divRound(numerator, denominator, "halfExpand")`: a tie goes away from zero (`5 / 2` → 3,
 * `-5 / 2` → -3). A `bigint` numerator gives a `bigint`.
 */
export function divRoundHalfUp(numerator: number, denominator: Cents): number;
export function divRoundHalfUp(numerator: bigint, denominator: Cents): bigint;
export function divRoundHalfUp(numerator: Cents, denominator: Cents): Cents;
export function divRoundHalfUp(numerator: Cents, denominator: Cents): Cents {
	return divRound(numerator, denominator, "halfExpand");
}

/** Exact sum. A `bigint` total when any amount is a `bigint`; `[]` sums to `0`. */
export function sumCents(amounts: readonly number[]): number;
export function sumCents(amounts: readonly bigint[]): bigint;
export function sumCents(amounts: readonly Cents[]): Cents;
export function sumCents(amounts: readonly Cents[]): Cents {
	let total = 0n;
	for (const a of amounts) total += big(a);
	return out(
		total,
		amounts.some((a) => typeof a === "bigint")
	);
}

/**
 * `amount × rate`, rounded with `mode` (default `"halfExpand"`). A quantity is exact
 * (`multiplyCents(1999, 3)` is 5997); a decimal rate is read as written, so
 * `multiplyCents(100, 1.005)` is 101 where `Math.round(100 * 1.005)` gives 100. A `bigint`
 * amount gives a `bigint`.
 */
export function multiplyCents(amount: number, rate: Rate, mode?: RoundingMode): number;
export function multiplyCents(amount: bigint, rate: Rate, mode?: RoundingMode): bigint;
export function multiplyCents(amount: Cents, rate: Rate, mode?: RoundingMode): Cents;
export function multiplyCents(amount: Cents, rate: Rate, mode: RoundingMode = "halfExpand"): Cents {
	const [n, d] = fraction(rate, "rate");
	return out(divide(big(amount) * n, d, mode), typeof amount === "bigint");
}

/**
 * The share of `amount` that `bps` basis points represent (1 bp = 0.01%, 10000 bp = 100%), rounded
 * with `mode` (default `"halfExpand"`): `applyBasisPoints(10000, 250)` is 250. Returns the share,
 * not `amount` plus it; fractional points (`12.5`) are allowed. A `bigint` amount gives a `bigint`.
 */
export function applyBasisPoints(amount: number, bps: Rate, mode?: RoundingMode): number;
export function applyBasisPoints(amount: bigint, bps: Rate, mode?: RoundingMode): bigint;
export function applyBasisPoints(amount: Cents, bps: Rate, mode?: RoundingMode): Cents;
export function applyBasisPoints(
	amount: Cents,
	bps: Rate,
	mode: RoundingMode = "halfExpand"
): Cents {
	const [n, d] = fraction(bps, "bps");
	return out(divide(big(amount) * n, d * 10000n, mode), typeof amount === "bigint");
}

/**
 * Splits `total` in proportion to `weights` without losing or inventing a cent: the shares always
 * sum to `total`. Each share is the exact proportion rounded toward zero; the cents left over go
 * one each to the shares with the largest remainders, and a tie goes to the earlier share, so
 * `allocateByWeights(100, [1, 1, 1])` is `[34, 33, 33]` and `(100, [1, 2])` is `[33, 67]`. A
 * negative total splits like its absolute value, negated. Weights are non-negative decimals
 * (percentages work) and at least one must be above zero; a zero weight gets 0. A `bigint` total
 * gives `bigint` shares.
 */
export function allocateByWeights(total: number, weights: readonly Rate[]): number[];
export function allocateByWeights(total: bigint, weights: readonly Rate[]): bigint[];
export function allocateByWeights(total: Cents, weights: readonly Rate[]): Cents[];
export function allocateByWeights(total: Cents, weights: readonly Rate[]): Cents[] {
	const t = big(total, "total");
	const parts = weights.map((w) => fraction(w, "weight"));
	const scale = parts.reduce((m, [, d]) => (d > m ? d : m), 1n);
	const w = parts.map(([n, d]) => n * (scale / d));
	let sum = 0n;
	for (const x of w) {
		if (x < 0n) throw new RangeError("[ca-ui] weights must not be negative");
		sum += x;
	}
	if (sum === 0n) throw new RangeError("[ca-ui] weights need at least one value above zero");
	const abs = t < 0n ? -t : t;
	const shares = w.map((x) => (abs * x) / sum);
	const rest = w.map((x) => (abs * x) % sum);
	let left = abs - shares.reduce((a, b) => a + b, 0n);
	const order = w
		.map((_, i) => i)
		.sort((a, b) => (rest[a] === rest[b] ? a - b : rest[a] > rest[b] ? -1 : 1));
	for (const i of order) {
		if (left === 0n) break;
		shares[i] += 1n;
		left -= 1n;
	}
	return shares.map((s) => out(t < 0n ? -s : s, typeof total === "bigint"));
}
