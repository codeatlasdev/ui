/**
 * The opaque-surface contract (#1158): a panel that carries text (Dialog, Sheet, Popover...) keeps a
 * fill opaque enough that the page behind cannot pull its text below its contrast. Pure reads of
 * computed styles, no runner and no axe: `expectOpaqueSurface` in `./index.ts` adds the settle and
 * the assertion.
 */

/** The floor of the contract: below alpha 0.9 the page behind shows through the text. */
export const OPAQUE_SURFACE_MIN = 0.9;

const COLOR_FUNCTIONS = new Set([
	"rgb",
	"rgba",
	"hsl",
	"hsla",
	"hwb",
	"lab",
	"lch",
	"oklab",
	"oklch",
	"color",
]);
/** Keywords that only an element resolves: a computed value never holds them, a raw one might. */
const UNRESOLVED = new Set([
	"currentcolor",
	"inherit",
	"initial",
	"unset",
	"revert",
	"revert-layer",
]);
const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%?)$/;

function unreadable(color: string): TypeError {
	return new TypeError(
		`cannot read the alpha of "${color}": pass a computed color (getComputedStyle(el).backgroundColor)`
	);
}

function alphaOf(raw: string, color: string): number {
	const value = raw.trim();
	if (value === "none") return 0;
	const m = NUMBER.exec(value);
	if (!m) throw unreadable(color);
	return Math.min(1, Math.max(0, Number(m[1]) / (m[2] ? 100 : 1)));
}

/**
 * The alpha (0 to 1) of a CSS color as `getComputedStyle` serializes it: `rgb()`/`rgba()` (legacy
 * commas or `/ a`), `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(<space> ...)`,
 * hex (`#rgba`, `#rrggbbaa`), `transparent` and named or system colors. Chromium resolves
 * `color-mix()` and relative colors to one of these (`oklab(... / 0.94)`, `color(srgb ... / 0.5)`).
 * Throws a `TypeError` on what it cannot resolve (`currentcolor`, `var()`, `calc()`, an unresolved
 * `color-mix()`, a gradient) instead of guessing opaque.
 */
export function colorAlpha(color: string): number {
	const c = color.trim().toLowerCase();
	if (c === "transparent") return 0;
	if (c.startsWith("#")) {
		const hex = c.slice(1);
		if (!/^[\da-f]+$/.test(hex) || ![3, 4, 6, 8].includes(hex.length)) throw unreadable(color);
		if (hex.length === 4) return Number.parseInt(hex.slice(3).repeat(2), 16) / 255;
		if (hex.length === 8) return Number.parseInt(hex.slice(6), 16) / 255;
		return 1;
	}
	if (/^[a-z]+$/.test(c)) {
		if (UNRESOLVED.has(c)) throw unreadable(color);
		return 1;
	}
	const fn = /^([a-z-]+)\(([^()]*)\)$/.exec(c);
	if (!fn || !COLOR_FUNCTIONS.has(fn[1])) throw unreadable(color);
	const [, name, args] = fn;
	const slash = args.split("/");
	if (slash.length > 2) throw unreadable(color);
	if (slash.length === 2) return alphaOf(slash[1], color);
	const commas = args.split(",");
	if (commas.length === 4 && /^(rgb|hsl)a?$/.test(name)) return alphaOf(commas[3], color);
	if (commas.length !== 1 && commas.length !== 3) throw unreadable(color);
	return 1;
}

/**
 * How opaque `el` is now: the alpha of its computed `background-color` times its own `opacity`.
 * A `background-image` (a gradient fill) is not measured.
 */
export function surfaceAlpha(el: Element): number {
	const cs = getComputedStyle(el);
	const opacity = Number(cs.opacity === "" ? 1 : cs.opacity);
	// Rounded so a message reads "0.94", not "0.9400000000000001".
	return Math.round(colorAlpha(cs.backgroundColor) * opacity * 1e4) / 1e4;
}

/** `dialog.ca-overlay.ca-dialog`: the tag, id and classes (Svelte's scoping hash left out). */
export function describeElement(el: Element): string {
	const id = el.id ? `#${el.id}` : "";
	const classes = [...el.classList]
		.filter((c) => !c.startsWith("svelte-"))
		.map((c) => `.${c}`)
		.join("");
	return `${el.localName}${id}${classes}`;
}
