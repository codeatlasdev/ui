// ─── haptic: a short vibration as a second signal ─────────────────────────────
// Its own channel with its own preference (`ca-haptic`): independent of sound (`ca-sound`) and of
// reduced motion, which is about what moves on screen. A no-op where `navigator.vibrate` does not
// exist (iOS, desktop Safari and Firefox), so it is never the only signal.

/** What happened: a light tap, a completed action, a failed one. */
export type HapticKind = "tap" | "success" | "error";

const KEY = "ca-haptic";

/** Vibration patterns in ms (on, off, on…): one pulse, a short double, a heavier triple. */
const PATTERNS: Record<HapticKind, number | number[]> = {
	tap: 10,
	success: [10, 60, 20],
	error: [40, 60, 40, 60, 40],
};

const supported = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

function enabled(): boolean {
	try {
		return JSON.parse(localStorage.getItem(KEY) ?? "null")?.enabled !== false;
	} catch {
		return true;
	}
}

function play(kind: HapticKind = "tap"): boolean {
	if (!supported() || !enabled()) return false;
	try {
		return navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap);
	} catch {
		return false;
	}
}

const api = {
	/** True where the device can vibrate (`navigator.vibrate` exists). */
	get supported() {
		return supported();
	},
	/** The user's choice, persisted under `ca-haptic`. On unless they turned it off. */
	get enabled() {
		return enabled();
	},
	/** Turn haptics on or off for this user (persisted). Sound and motion are not touched. */
	enable(on = true) {
		try {
			localStorage.setItem(KEY, JSON.stringify({ enabled: on }));
		} catch {}
	},
};

/**
 * Vibrates a short pattern: `haptic("tap")`, `haptic("success")`, `haptic("error")`. Returns whether
 * the device accepted it; `false` without `navigator.vibrate` or when the user turned haptics off
 * (`haptic.enable(false)`). Ignores the sound toggle and `prefers-reduced-motion`.
 */
export const haptic = Object.defineProperties(
	play,
	Object.getOwnPropertyDescriptors(api)
) as typeof play & typeof api;
