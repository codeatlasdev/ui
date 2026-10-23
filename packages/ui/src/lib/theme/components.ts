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

export interface AvatarFallbackTokens {
	/** `--ca-avatar-fallback-bg`. @default the name-derived palette (or `--ca-surface-overlay` with `tone="neutral"`) */
	fallbackBg?: CssValue;
	/** `--ca-avatar-fallback-color`. @default the palette ink (or `--ca-text-secondary` with `tone="neutral"`) */
	fallbackColor?: CssValue;
	/** `--ca-avatar-fallback-size`: initials font size. @default 36% of the avatar (42% for one letter) */
	fallbackSize?: CssValue;
	/** `--ca-avatar-fallback-weight`. @default 600 */
	fallbackWeight?: CssValue;
}

export interface AvatarTokens extends AvatarFallbackTokens {
	/** One avatar size (`xs`, `sm`, `md`, `lg`, `xl`): `--ca-avatar-<size>-fallback-{size,weight}`. */
	size?: Partial<
		Record<
			"xs" | "sm" | "md" | "lg" | "xl",
			Pick<AvatarFallbackTokens, "fallbackSize" | "fallbackWeight">
		>
	>;
}

export interface FieldTokens {
	/** `--ca-<tf|ta|field>-gap`: space between label, box and hint. @default `--ca-space-1` */
	gap?: CssValue;
	/** `--ca-<tf|ta|field>-label-line-height`. @default `--ca-line-height-snug` */
	labelLeading?: CssValue;
}

export interface TextAreaTokens extends FieldTokens {
	/** `--ca-ta-min-height`: the height of the visible box, border included. @default rows-based */
	minHeight?: CssValue;
}

export interface CardTokens {
	/** `--ca-card-bg`: a solid fill. @default the material fill */
	bg?: CssValue;
	/** `--ca-card-radius`. @default the surface radius */
	radius?: CssValue;
	/** `--ca-card-border`: a full border shorthand, e.g. `1px solid var(--ca-outline-subtle)`. @default none */
	border?: CssValue;
	/** `--ca-card-shadow`: a `box-shadow`, `none` for flat. @default the material shadow */
	shadow?: CssValue;
}

export interface SegmentedItemTokens {
	/** `--ca-seg-item-padding-x`. @default `--ca-space-3` (sm) / `--ca-space-4` (md) */
	itemPaddingX?: CssValue;
	/** `--ca-seg-item-font-size`. @default `--ca-font-size-caption` (sm) / `--ca-font-size-body2` (md) */
	itemFontSize?: CssValue;
	/** `--ca-seg-item-line-height`. @default inherited */
	itemLeading?: CssValue;
}

export interface SegmentedTokens extends SegmentedItemTokens {
	/** One size: `--ca-seg-<sm|md>-item-*`. */
	sm?: SegmentedItemTokens;
	md?: SegmentedItemTokens;
}

export interface EmptyStateTokens {
	/** `--ca-empty-padding`: a padding shorthand. @default `--ca-space-12 --ca-space-6` */
	padding?: CssValue;
	/** `--ca-empty-title-size`. @default `--ca-font-size-body1` (`--ca-font-size-h6` for `hero`) */
	titleSize?: CssValue;
	/** `--ca-empty-title-weight`. @default semibold (heading weight for `hero`) */
	titleWeight?: CssValue;
}

/** `ThemeOptions.components`: component tokens, emitted on `:root`. */
export interface ComponentTokens {
	button?: ButtonTokens;
	iconButton?: IconButtonTokens;
	kbd?: KbdTokens;
	avatar?: AvatarTokens;
	/** `--ca-field-*`: shared by `TextField` and `TextArea`; the per-component keys win. */
	field?: FieldTokens;
	textField?: FieldTokens;
	textArea?: TextAreaTokens;
	card?: CardTokens;
	segmented?: SegmentedTokens;
	emptyState?: EmptyStateTokens;
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
	const a = c.avatar;
	if (a) {
		put(out, "--ca-avatar-fallback-bg", a.fallbackBg);
		put(out, "--ca-avatar-fallback-color", a.fallbackColor);
		put(out, "--ca-avatar-fallback-size", a.fallbackSize);
		put(out, "--ca-avatar-fallback-weight", a.fallbackWeight);
		for (const [size, t] of Object.entries(a.size ?? {})) {
			put(out, `--ca-avatar-${size}-fallback-size`, t.fallbackSize);
			put(out, `--ca-avatar-${size}-fallback-weight`, t.fallbackWeight);
		}
	}
	for (const [prefix, f] of [
		["--ca-field", c.field],
		["--ca-tf", c.textField],
		["--ca-ta", c.textArea],
	] as const) {
		if (!f) continue;
		put(out, `${prefix}-gap`, f.gap);
		put(
			out,
			`${prefix}-${prefix === "--ca-field" ? "label-leading" : "label-line-height"}`,
			f.labelLeading
		);
	}
	put(out, "--ca-ta-min-height", c.textArea?.minHeight);
	const card = c.card;
	if (card) {
		put(out, "--ca-card-bg", card.bg);
		put(out, "--ca-card-radius", card.radius);
		put(out, "--ca-card-border", card.border);
		put(out, "--ca-card-shadow", card.shadow);
	}
	const seg = c.segmented;
	if (seg) {
		segmentedItem(out, "--ca-seg-item", seg);
		for (const s of ["sm", "md"] as const)
			if (seg[s]) segmentedItem(out, `--ca-seg-${s}-item`, seg[s]);
	}
	const e = c.emptyState;
	if (e) {
		put(out, "--ca-empty-padding", e.padding);
		put(out, "--ca-empty-title-size", e.titleSize);
		put(out, "--ca-empty-title-weight", e.titleWeight);
	}
	return out;
}

function segmentedItem(out: Record<string, string>, prefix: string, t: SegmentedItemTokens): void {
	put(out, `${prefix}-padding-x`, t.itemPaddingX);
	put(out, `${prefix}-font-size`, t.itemFontSize);
	put(out, `${prefix}-line-height`, t.itemLeading);
}

type Nested = Record<string, unknown>;

/** `b` over `a`, merging nested plain objects (avatar `size.sm`) instead of replacing them. */
function mergeDeep(a: Nested, b: Nested): Nested {
	const out: Nested = { ...a, ...b };
	for (const k of Object.keys(b)) {
		const x = a[k];
		const y = b[k];
		if (x && y && typeof x === "object" && typeof y === "object")
			out[k] = mergeDeep(x as Nested, y as Nested);
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
				merged[nested] = mergeDeep(x[nested] as Nested, y[nested] as Nested);
		out[key] = merged;
	}
	return out as ComponentTokens;
}
