import { afterEach, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
	nearestSpring,
	type SpringConfig,
	springCurve,
	springPosition,
	springSettle,
	springs,
	springTween,
} from "../src/lib/tokens/springs.ts";

// #1228: named springs. One set of physical numbers ({ damping, stiffness, mass }) drives Motion, WAAPI, CSS and
// Svelte's Tween, and reduced motion resolves every spring to 0 ms.

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const tokensCss = read("src/lib/styles/tokens.css");
// Opt-in sheet: the three curves cost ~0.5 kB gzip, over the budget left in core.css/global.css.
const springsCss = read("src/lib/styles/springs.css");
const NAMES = Object.keys(springs) as (keyof typeof springs)[];

/** Independent reference: RK4 on m·x'' = -k·(x - 1) - c·x', from rest at 0, step 0.01 ms. */
function integrate(c: SpringConfig, ms: number): number {
	const h = 0.00001;
	let x = 0;
	let v = 0;
	const a = (px: number, pv: number) => (-c.stiffness * (px - 1) - c.damping * pv) / c.mass;
	for (let i = 0, n = Math.round(ms / 1000 / h); i < n; i++) {
		const k1x = v;
		const k1v = a(x, v);
		const k2x = v + (h / 2) * k1v;
		const k2v = a(x + (h / 2) * k1x, v + (h / 2) * k1v);
		const k3x = v + (h / 2) * k2v;
		const k3v = a(x + (h / 2) * k2x, v + (h / 2) * k2v);
		const k4x = v + h * k3v;
		const k4v = a(x + h * k3x, v + h * k3v);
		x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
		v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
	}
	return x;
}

/** Evaluates a CSS `linear()` easing at progress `p` (0..1), as the browser interpolates its stops. */
function evalLinear(easing: string, p: number): number {
	const body = easing.match(/^linear\((.*)\)$/)?.[1];
	if (!body) throw new Error(`not a linear(): ${easing}`);
	const parts = body.split(",").map((s) => s.trim().split(/\s+/));
	const stops = parts.map(([v, pct], i) => ({
		v: Number(v),
		t: pct ? Number.parseFloat(pct) / 100 : i === 0 ? 0 : 1,
	}));
	for (let i = 1; i < stops.length; i++) {
		const a = stops[i - 1];
		const b = stops[i];
		if (p <= b.t) return a.v + ((b.v - a.v) * (p - a.t)) / (b.t - a.t || 1);
	}
	return stops[stops.length - 1].v;
}

describe("springs presets", () => {
	it("snappy is the consumer's damping 12, stiffness 200, mass 0.1", () => {
		expect(springs.snappy).toEqual({ damping: 12, stiffness: 200, mass: 0.1 });
	});

	it("draws the physical curve of every preset (RK4 reference)", () => {
		const critical = { damping: 20, stiffness: 100, mass: 1 }; // damping ratio exactly 1
		for (const c of [...NAMES.map((n) => springs[n]), critical])
			for (const ms of [0, 16, 40, 80, 120, 200, 320, 500])
				expect(springPosition(c, ms)).toBeCloseTo(integrate(c, ms), 5);
	});

	it("gives each preset its own character", () => {
		const peak = (c: SpringConfig) =>
			Math.max(...Array.from({ length: 2000 }, (_, ms) => springPosition(c, ms)));
		expect(peak(springs.snappy)).toBeLessThanOrEqual(1);
		expect(peak(springs.soft)).toBeLessThanOrEqual(1);
		expect(peak(springs.bouncy)).toBeGreaterThan(1.1);
		expect(springSettle(springs.soft)).toBeGreaterThan(springSettle(springs.snappy));
	});
});

describe("springSettle", () => {
	it("is the first ms after which the curve stays within 0.1%", () => {
		for (const n of NAMES) {
			const s = springSettle(springs[n]);
			expect(Math.abs(1 - springPosition(springs[n], s - 1)), n).toBeGreaterThan(0.001);
			for (let ms = s; ms < s * 3; ms++)
				expect(Math.abs(1 - springPosition(springs[n], ms)), `${n} ${ms}`).toBeLessThanOrEqual(
					0.001
				);
		}
	});
});

describe("springCurve", () => {
	it("samples the spring into a linear() within 0.004", () => {
		for (const n of NAMES) {
			const { easing, duration } = springCurve(springs[n], { reducedMotion: false });
			expect(duration).toBe(springSettle(springs[n]));
			expect(easing.startsWith("linear(0, ")).toBe(true);
			expect(easing.endsWith(", 1)")).toBe(true);
			for (let i = 0; i <= 500; i++) {
				const p = i / 500;
				const want = p === 1 ? 1 : springPosition(springs[n], p * duration);
				expect(Math.abs(evalLinear(easing, p) - want), `${n} at ${p}`).toBeLessThan(0.004);
			}
		}
	});

	it("keeps the overshoot of a bouncy spring", () => {
		const stops = springCurve("bouncy", { reducedMotion: false }).easing.match(/[\d.]+(?= )/g);
		expect(Math.max(...(stops ?? []).map(Number))).toBeGreaterThan(1.1);
	});
});

describe("reduced motion", () => {
	const real = globalThis.matchMedia;
	afterEach(() => {
		globalThis.matchMedia = real;
	});
	const prefer = (reduce: boolean) => {
		globalThis.matchMedia = ((q: string) => ({
			matches: reduce && q === "(prefers-reduced-motion: reduce)",
		})) as unknown as typeof matchMedia;
	};

	it("resolves every spring to 0 ms when asked", () => {
		for (const n of NAMES) {
			expect(springCurve(n, { reducedMotion: true }).duration).toBe(0);
			expect(springTween(n, { reducedMotion: true }).duration).toBe(0);
		}
	});

	it("reads prefers-reduced-motion when the option is left out", () => {
		prefer(true);
		expect(springCurve("snappy").duration).toBe(0);
		expect(springTween("snappy").duration).toBe(0);
		prefer(false);
		expect(springCurve("snappy").duration).toBe(springSettle(springs.snappy));
	});

	it("scales the CSS duration by --ca-motion-scale, 0 under reduce", () => {
		const reduce = tokensCss.slice(tokensCss.indexOf("@media (prefers-reduced-motion: reduce)"));
		expect(reduce.slice(0, reduce.indexOf("}"))).toContain("--ca-motion-scale: 0;");
		for (const n of NAMES)
			expect(springsCss).toContain(
				`--ca-spring-${n}-duration: calc(${springSettle(springs[n])}ms * var(--ca-motion-scale));`
			);
	});
});

describe("CSS spring tokens", () => {
	it("are the TS curves, so CSS and JS draw the same spring", () => {
		for (const n of NAMES)
			expect(springsCss).toContain(
				`--ca-spring-${n}: ${springCurve(n, { reducedMotion: false }).easing};`
			);
	});

	it("ship as an importable sheet in the tokens layer", () => {
		expect(JSON.parse(read("package.json")).exports["./styles/springs.css"]).toBe(
			"./dist/styles/springs.css"
		);
		expect(springsCss).toContain("@layer ca.tokens {");
	});
});

describe("springTween", () => {
	it("is the same curve as an easing function for Tween", () => {
		const { easing, duration } = springTween("bouncy", { reducedMotion: false });
		expect(duration).toBe(springSettle(springs.bouncy));
		for (const p of [0.1, 0.25, 0.5, 0.75])
			expect(easing(p)).toBeCloseTo(springPosition(springs.bouncy, p * duration), 9);
		expect(easing(0)).toBe(0);
		expect(easing(1)).toBe(1);
	});
});

describe("nearestSpring", () => {
	it("names a preset for its own numbers, at distance 0", () => {
		for (const n of NAMES) expect(nearestSpring(springs[n])).toEqual({ name: n, distance: 0 });
	});

	it("names the preset whose curve is closest", () => {
		const near = [
			[{ damping: 13, stiffness: 210, mass: 0.1 }, "snappy"],
			[{ damping: 18, stiffness: 160, mass: 0.5 }, "soft"],
			[{ damping: 14, stiffness: 400, mass: 0.5 }, "bouncy"],
		] as const;
		for (const [c, name] of near) {
			expect(nearestSpring(c).name).toBe(name);
			expect(nearestSpring(c).distance).toBeLessThanOrEqual(0.05);
		}
		// A fast spring with a small bounce is far from all three: it needs its own name.
		expect(nearestSpring({ damping: 9, stiffness: 420, mass: 0.1 }).distance).toBeGreaterThan(0.05);
	});
});
