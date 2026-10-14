// ─── Z-index scale ────────────────────────────────────────────────────────────

/** Stacking scale (`base` 0 up to `tooltip`). Mirrors `--ca-z-*`; use it instead of literal z-index values. */
export const zIndex = {
	base: 0,
	raised: 10,
	nav: 100,
	dropdown: 1000,
	sticky: 1020,
	fixed: 1030,
	drawer: 1200,
	modal: 1300,
	snackbar: 1400,
	tooltip: 1500,
} as const;

export type ZIndexKey = keyof typeof zIndex;
