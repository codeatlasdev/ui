// ─── Spring tokens ────────────────────────────────────────────────────────────
// One set of physical numbers per named spring. Motion reads them as they are (`type: "spring"`), WAAPI and CSS
// read the same curve sampled into `linear()` plus its settle time (CSS: styles/springs.css), Svelte's `Tween` and
// transitions read it as an easing function. Reduced motion resolves every duration to 0 ms (`--ca-motion-scale: 0`).

/** A damped spring in physical units, the convention of Motion and of most spring APIs: `damping` (friction against speed), `stiffness` (pull toward the target), `mass`. */
export interface SpringConfig {
	readonly damping: number;
	readonly stiffness: number;
	readonly mass: number;
}

/** Named springs: `snappy` (no overshoot, ~360 ms), `soft` (no overshoot, slower, ~610 ms), `bouncy` (~14% overshoot, ~450 ms). Mirrored in CSS by `--ca-spring-<name>` and `--ca-spring-<name>-duration` (opt-in `@codeatlasdev/ui/styles/springs.css`). */
export const springs = {
	snappy: { damping: 12, stiffness: 200, mass: 0.1 },
	soft: { damping: 20, stiffness: 170, mass: 0.5 },
	bouncy: { damping: 15, stiffness: 400, mass: 0.5 },
} as const satisfies Record<string, SpringConfig>;

/** Name of a preset in `springs`. */
export type SpringName = keyof typeof springs;

/** A preset name or your own physical numbers. */
export type SpringInput = SpringName | SpringConfig;

/** Options of `springCurve` and `springTween`. */
export interface SpringOptions {
	/** `true` resolves the duration to 0 ms. Left out, it reads `prefers-reduced-motion` where `matchMedia` exists (false on the server). */
	reducedMotion?: boolean;
	/** Distance from the target, as a fraction of the travel, under which the spring counts as settled. Default 0.001 (0.1%). */
	restDelta?: number;
}

const REST = 0.001;
/** Ceiling of a settle search: a spring that has not settled in 10 s is cut there. */
const MAX_MS = 10_000;
/** Largest error of the sampled `linear()` against the curve, as a fraction of the travel, before rounding. */
const TOLERANCE = 0.002;

const config = (s: SpringInput): SpringConfig => (typeof s === "string" ? springs[s] : s);

function prefersReduced(opt: boolean | undefined): boolean {
	if (opt !== undefined) return opt;
	const mm = (globalThis as { matchMedia?: (q: string) => { matches: boolean } }).matchMedia;
	return typeof mm === "function" && mm("(prefers-reduced-motion: reduce)").matches;
}

/** Position of a spring released from rest at 0 toward 1, `ms` milliseconds later (the exact solution, not a simulation). */
export function springPosition(spring: SpringInput, ms: number): number {
	const { damping: c, stiffness: k, mass: m } = config(spring);
	const t = ms / 1000;
	const w0 = Math.sqrt(k / m);
	const zeta = c / (2 * Math.sqrt(k * m));
	if (Math.abs(zeta - 1) < 1e-9) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
	if (zeta < 1) {
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		const decay = Math.exp(-zeta * w0 * t);
		return 1 - decay * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
	}
	const s = Math.sqrt(zeta * zeta - 1);
	const slow = -w0 * (zeta - s);
	const fast = -w0 * (zeta + s);
	const a = -fast / (slow - fast);
	return 1 - (a * Math.exp(slow * t) + (1 - a) * Math.exp(fast * t));
}

/** Milliseconds until the spring stays within `restDelta` (default 0.1%) of its target: the duration of its CSS and WAAPI curve. */
export function springSettle(spring: SpringInput, restDelta = REST): number {
	let last = 0;
	for (let ms = 1; ms <= MAX_MS; ms++)
		if (Math.abs(1 - springPosition(spring, ms)) > restDelta) last = ms;
	return Math.min(last + 1, MAX_MS);
}

/** Indices of the samples to keep so straight lines between them stay within `tol` of every sample. */
function simplify(ys: number[], tol: number): number[] {
	const keep = new Set([0, ys.length - 1]);
	const stack: [number, number][] = [[0, ys.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop() as [number, number];
		let worst = -1;
		let err = tol;
		for (let i = a + 1; i < b; i++) {
			const line = ys[a] + ((ys[b] - ys[a]) * (i - a)) / (b - a);
			const e = Math.abs(ys[i] - line);
			if (e > err) {
				err = e;
				worst = i;
			}
		}
		if (worst > 0) {
			keep.add(worst);
			stack.push([a, worst], [worst, b]);
		}
	}
	return [...keep].sort((x, y) => x - y);
}

const num = (n: number, digits: number) => String(+n.toFixed(digits) || 0);

/**
 * The spring as a CSS `linear()` easing and its settle `duration` in ms, for WAAPI (`el.animate(kf, springCurve("snappy"))`)
 * or a style. The curve is sampled every ms and kept within 0.2% of the travel; under reduced motion `duration` is 0.
 */
export function springCurve(
	spring: SpringInput,
	options: SpringOptions = {}
): { easing: string; duration: number } {
	const settle = springSettle(spring, options.restDelta);
	const ys = Array.from({ length: settle + 1 }, (_, ms) =>
		ms === settle ? 1 : springPosition(spring, ms)
	);
	const stops = simplify(ys, TOLERANCE).map((i) =>
		i === 0 ? "0" : i === settle ? "1" : `${num(ys[i], 3)} ${num((i / settle) * 100, 2)}%`
	);
	return {
		easing: `linear(${stops.join(", ")})`,
		duration: prefersReduced(options.reducedMotion) ? 0 : settle,
	};
}

/**
 * The spring as an easing function over its settle `duration` in ms, for Svelte's `Tween` and transitions
 * (`new Tween(0, springTween("soft"))`, `transition:fly={{ y: 16, ...springTween("snappy") }}`). 0 ms under reduced motion.
 */
export function springTween(
	spring: SpringInput,
	options: SpringOptions = {}
): { easing: (t: number) => number; duration: number } {
	const settle = springSettle(spring, options.restDelta);
	return {
		easing: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : springPosition(spring, t * settle)),
		duration: prefersReduced(options.reducedMotion) ? 0 : settle,
	};
}

/** The preset whose curve is closest to `spring`, and the largest gap between the two curves (fraction of the travel). Maps an existing spring onto a name. */
export function nearestSpring(spring: SpringConfig): { name: SpringName; distance: number } {
	let best: { name: SpringName; distance: number } | undefined;
	for (const name of Object.keys(springs) as SpringName[]) {
		const end = Math.max(springSettle(spring), springSettle(name));
		let distance = 0;
		for (let ms = 0; ms <= end; ms++)
			distance = Math.max(
				distance,
				Math.abs(springPosition(spring, ms) - springPosition(name, ms))
			);
		if (!best || distance < best.distance) best = { name, distance };
	}
	return best as { name: SpringName; distance: number };
}
