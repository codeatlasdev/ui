// ─── Transition / easing tokens ───────────────────────────────────────────────

/** Transition durations in ms (`shortest` 120 to `complex` 320, plus `enteringScreen` and `leavingScreen`). Mirrors `--ca-duration-*`. */
export const duration = {
	shortest: 120,
	shorter: 160,
	short: 200,
	standard: 240,
	complex: 320,
	enteringScreen: 220,
	leavingScreen: 180,
} as const;

/** Cubic-bezier easing strings (`standard`, `decelerate`, `accelerate`, `spring`). Mirrors `--ca-ease-*`. */
export const easing = {
	// Apple-aligned curves
	standard: "cubic-bezier(0.4, 0, 0.2, 1)", // ease-in-out
	decelerate: "cubic-bezier(0, 0, 0.2, 1)", // ease-out — enter
	accelerate: "cubic-bezier(0.4, 0, 1, 1)", // ease-in  — exit
	sharp: "cubic-bezier(0.4, 0, 0.6, 1)", // snappy
	spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;
