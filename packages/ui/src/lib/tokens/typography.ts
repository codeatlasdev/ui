// ─── Typography tokens (framework-agnostic) ───────────────────────────────────

/** Font stacks: `sans` (Inter) and `mono` (JetBrains Mono). */
export const fontFamily = {
	sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
	mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
} as const;

/** Font weights: light 300, regular 400, medium 500, bold 600. */
export const fontWeight = {
	light: 300,
	regular: 400,
	medium: 500,
	bold: 600,
} as const;

// All sizes in rem (base = 16px)
/** Type scale in rem (base 16px): h1..h6, body1, body2, caption, label, button. Mirrors `--ca-font-size-*`. */
export const fontSize = {
	h1: "2.25rem", // 36px
	h2: "1.875rem", // 30px
	h3: "1.5rem", // 24px
	h4: "1.25rem", // 20px
	h5: "1.0625rem", // 17px
	h6: "0.9375rem", // 15px
	body1: "0.9375rem", // 15px — primary reading size
	body2: "0.8125rem", // 13px
	subtitle1: "0.9375rem",
	subtitle2: "0.8125rem",
	caption: "0.75rem", // 12px
	overline: "0.6875rem", // 11px
	button: "0.875rem", // 14px
	label: "0.8125rem", // 13px
} as const;

/** Unitless line-heights for headings h1..h6, `body1`, `body2` and `ui` (controls). */
export const lineHeight = {
	h1: 1.1,
	h2: 1.15,
	h3: 1.2,
	h4: 1.25,
	h5: 1.3,
	h6: 1.35,
	body1: 1.55,
	body2: 1.5,
	ui: 1.4,
} as const;

/** Letter-spacing scale: `tight`, `snug`, `normal`, `relaxed`, `wide`. */
export const letterSpacing = {
	tight: "-0.03em",
	snug: "-0.02em",
	normal: "-0.011em",
	relaxed: "0em",
	wide: "0.08em",
} as const;
