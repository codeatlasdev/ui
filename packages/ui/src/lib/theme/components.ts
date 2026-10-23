/**
 * Component tokens: the theme-level shortcut for per-component `--ca-<component>-*` custom
 * properties. One naming convention for every component (documented in the theming guide):
 *
 *   --ca-<component>-<property>              the component, every size/part
 *   --ca-<component>-<size|part>-<property>  one size or part (wins over the line above)
 *
 * Properties are spelled like the CSS they drive (`font-weight`, `letter-spacing`, `line-height`,
 * `padding-x`, `gap`, `size`). Unset, a component draws exactly what it drew before the token
 * existed, so a theme that sets none emits no CSS.
 */

/** A CSS value: a length, number or `var(--ca-*)` reference. Numbers are unitless (weights, line-heights). */
export type CssValue = string | number;

/** Typography and box tokens of one Button size. */
export interface ButtonSizeTokens {
	/** `--ca-btn-<size>-height`. */
	height?: CssValue;
	/** `--ca-btn-<size>-padding-x`. */
	paddingX?: CssValue;
	/** `--ca-btn-<size>-font-size`. */
	fontSize?: CssValue;
	/** `--ca-btn-<size>-font-weight`. */
	weight?: CssValue;
	/** `--ca-btn-<size>-letter-spacing`. */
	tracking?: CssValue;
}

export interface ButtonTokens extends ButtonSizeTokens {
	/** `--ca-btn-font-weight`, every size. @default 500 */
	weight?: CssValue;
	/** `--ca-btn-letter-spacing`, every size. @default the label tracking */
	tracking?: CssValue;
	/** `--ca-btn-line-height` (unitless or length). @default inherited */
	leading?: CssValue;
	/** `--ca-btn-gap` between icon and label. @default `--ca-space-1-5` */
	gap?: CssValue;
	/** `--ca-btn-ghost-border-width`: `0px` makes a ghost button as wide as a text button. @default `--ca-border-width` */
	ghostBorderWidth?: CssValue;
	/** `--ca-btn-disabled-bg`: background of a disabled button. @default `--ca-action-disabled-bg` */
	disabledBg?: CssValue;
	/** `--ca-btn-touch-height`: the `pointer: coarse` minimum height. @default 44px */
	touchHeight?: CssValue;
	sm?: ButtonSizeTokens;
	md?: ButtonSizeTokens;
	lg?: ButtonSizeTokens;
}

export interface IconButtonTokens {
	/** `--ca-icon-btn-font-weight`. @default inherited */
	weight?: CssValue;
	/** `--ca-icon-btn-size-<size>`: width and height. @default 32px / 40px / 48px */
	size?: { sm?: CssValue; md?: CssValue; lg?: CssValue };
	/** `--ca-icon-btn-touch-size`: the `pointer: coarse` minimum side. @default 44px */
	touchSize?: CssValue;
}

export interface KbdTokens {
	/** `--ca-kbd-size`: square keycap (minimum width and height). @default the keycap hugs its label */
	size?: CssValue;
	/** `--ca-kbd-font-size`. @default `--ca-font-size-micro` */
	fontSize?: CssValue;
	/** `--ca-kbd-line-height`. @default `--ca-line-height-snug` */
	leading?: CssValue;
}

/** `ThemeOptions.components`: component tokens, emitted on `:root`. */
export interface ComponentTokens {
	button?: ButtonTokens;
	iconButton?: IconButtonTokens;
	kbd?: KbdTokens;
}

const SIZES = ["sm", "md", "lg"] as const;

function put(out: Record<string, string>, name: string, v: CssValue | undefined): void {
	if (v !== undefined) out[name] = String(v);
}

function buttonSize(out: Record<string, string>, prefix: string, t: ButtonSizeTokens): void {
	put(out, `${prefix}-height`, t.height);
	put(out, `${prefix}-padding-x`, t.paddingX);
	put(out, `${prefix}-font-size`, t.fontSize);
	put(out, `${prefix}-font-weight`, t.weight);
	put(out, `${prefix}-letter-spacing`, t.tracking);
}

/** `ThemeOptions.components` → custom properties. Only what is set. */
export function componentTokens(c: ComponentTokens | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	if (!c) return out;
	const b = c.button;
	if (b) {
		put(out, "--ca-btn-font-weight", b.weight);
		put(out, "--ca-btn-letter-spacing", b.tracking);
		put(out, "--ca-btn-line-height", b.leading);
		put(out, "--ca-btn-gap", b.gap);
		put(out, "--ca-btn-ghost-border-width", b.ghostBorderWidth);
		put(out, "--ca-btn-disabled-bg", b.disabledBg);
		put(out, "--ca-btn-touch-height", b.touchHeight);
		for (const s of SIZES) if (b[s]) buttonSize(out, `--ca-btn-${s}`, b[s]);
	}
	const i = c.iconButton;
	if (i) {
		put(out, "--ca-icon-btn-font-weight", i.weight);
		put(out, "--ca-icon-btn-touch-size", i.touchSize);
		for (const s of SIZES) put(out, `--ca-icon-btn-size-${s}`, i.size?.[s]);
	}
	const k = c.kbd;
	if (k) {
		put(out, "--ca-kbd-size", k.size);
		put(out, "--ca-kbd-font-size", k.fontSize);
		put(out, "--ca-kbd-line-height", k.leading);
	}
	return out;
}

/** Deep merge of two `components` blocks: `b` wins per token, blocks and sizes are merged, not replaced. */
export function mergeComponents(
	a: ComponentTokens | undefined,
	b: ComponentTokens | undefined
): ComponentTokens | undefined {
	if (!a || !b) return a ?? b;
	const out: Record<string, Record<string, unknown>> = {};
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof ComponentTokens>) {
		const x = a[key] as Record<string, unknown> | undefined;
		const y = b[key] as Record<string, unknown> | undefined;
		const merged: Record<string, unknown> = { ...x, ...y };
		for (const nested of [...SIZES, "size"])
			if (
				x?.[nested] &&
				y?.[nested] &&
				typeof x[nested] === "object" &&
				typeof y[nested] === "object"
			)
				merged[nested] = { ...(x[nested] as object), ...(y[nested] as object) };
		out[key] = merged;
	}
	return out as ComponentTokens;
}
