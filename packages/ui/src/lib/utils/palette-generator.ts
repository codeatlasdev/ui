/**
 * @codeatlas/ui — Parametric palette generator
 *
 * Single source of truth for the token formula.
 * Amber = generate(55, 0.21, 0.54)
 * Ocean = generate(260, 0.22, 0.50)
 * Crimson = generate(26, 0.23, 0.44)
 */

export interface PresetTokens {
	// ── Light ──────────────────────────────────────────────────
	brandMain: string;
	brandLight: string;
	brandDark: string;
	brandContrast: string;
	/** Background for brand-filled controls; `brandContrast` text on it is >= WCAG AA (4.5:1). */
	brandFill: string;
	/** Hover/pressed variant of `brandFill`, also >= 4.5:1 against `brandContrast`. */
	brandFillHover: string;

	surfaceSunken: string;
	surfaceBase: string;
	surfaceRaised: string;
	surfaceOverlay: string;

	textPrimary: string;
	textSecondary: string;
	textDisabled: string;
	textHint: string;

	outlineSubtle: string;
	outlineDefault: string;
	outlineStrong: string;
	/** Boundary of a field/control: >= 3:1 on every surface and on the 5% text tint of a field (WCAG 1.4.11). */
	outlineControl: string;
	/** Keyboard focus ring: >= 3:1 on every surface and on hover/selected fills (it floats 2px off a brand fill). */
	focusRing: string;
	/** Text on `--ca-semantic-error-fill` (>= 4.5:1), the pair of `brandContrast`/`brandFill`. */
	semanticErrorContrast: string;

	glassBg: string;
	glassTintUltraThin: string;
	glassTintThin: string;
	glassTint: string;
	glassTintThick: string;
	glassTintChrome: string;
	glassTintSolid: string;
	glassBorder: string;
	glassShadow: string;

	glowPrimary: string;
	glowPrimaryStrong: string;

	vibrancyLabel: string;
	vibrancySecondary: string;
	vibrancyTertiary: string;
	vibrancyFill: string;
	vibrancySeparator: string;

	scrimColor: string;
	tooltipFg: string;

	// ── Dark ───────────────────────────────────────────────────
	dark: {
		brandMain: string;
		brandLight: string;
		brandDark: string;
		brandContrast: string;
		brandFill: string;
		brandFillHover: string;

		surfaceSunken: string;
		surfaceBase: string;
		surfaceRaised: string;
		surfaceOverlay: string;

		textPrimary: string;
		textSecondary: string;
		textDisabled: string;
		textHint: string;

		outlineControl: string;
		focusRing: string;
		semanticErrorContrast: string;

		glassBg: string;

		glowPrimary: string;
		glowPrimaryStrong: string;

		vibrancyLabel: string;
		vibrancySecondary: string;
		vibrancyTertiary: string;
		vibrancyFill: string;
		vibrancySeparator: string;

		tooltipFg: string;
	};
}

/** Round to 3 decimal places */
function r(n: number) {
	return Math.round(n * 1000) / 1000;
}

/** Clamp 0–1 */
function cl(n: number) {
	return Math.max(0, Math.min(1, n));
}

// ── WCAG contrast ────────────────────────────────────────────────────────────

const WHITE = "oklch(1 0 0)";
const INK = "oklch(0.10 0 0)";
/** WCAG AA for normal text. */
const AA = 4.5;

/** OKLCH → linear sRGB (clamped to gamut). */
function oklchToLinear(L: number, C: number, H: number): [number, number, number] {
	const hr = (H * Math.PI) / 180;
	const a = C * Math.cos(hr);
	const b = C * Math.sin(hr);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		cl(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		cl(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		cl(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
}

/** WCAG relative luminance of an OKLCH colour. */
function luminance(L: number, C: number, H: number): number {
	const [R, G, B] = oklchToLinear(L, C, H);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

const INK_LUMINANCE = luminance(0.1, 0, 0);

/** WCAG contrast ratio (1–21) of white or ink text on an OKLCH fill. */
function contrastOn(L: number, C: number, H: number, text: "white" | "ink"): number {
	const y = luminance(L, C, H);
	const t = text === "white" ? 1 : INK_LUMINANCE;
	return (Math.max(y, t) + 0.05) / (Math.min(y, t) + 0.05);
}

/** Largest lightness drop allowed when darkening a fill so white text reaches AA. */
const MAX_FILL_DARKEN = 0.12;

/**
 * Text colour and fill lightness for a brand-filled control. White text is
 * preferred: if it misses AA the fill is darkened (hue and chroma kept) by at
 * most `MAX_FILL_DARKEN`. Only when that still fails (very light brands such as
 * yellow) and ink reaches AA is ink used on the original fill. `hoverL` is the
 * hover/pressed fill, also AA against the chosen text.
 */
function brandFillPair(
	L: number,
	C: number,
	H: number
): { fillL: number; hoverL: number; contrast: string } {
	let fillL = L;
	while (fillL > L - MAX_FILL_DARKEN && contrastOn(fillL, C, H, "white") < AA) {
		fillL = r(fillL - 0.005);
	}
	const useInk = contrastOn(fillL, C, H, "white") < AA && contrastOn(L, C, H, "ink") >= AA;
	if (useInk) fillL = L;
	const text = useInk ? "ink" : "white";
	// White text: hover darkens. Ink text: hover lightens. Back off if AA would be lost.
	const dir = useInk ? 1 : -1;
	let hoverL = r(cl(fillL + dir * 0.06));
	while (contrastOn(hoverL, C, H, text) < AA && hoverL !== fillL) {
		hoverL = r(hoverL - dir * 0.005);
	}
	return { fillL, hoverL, contrast: useInk ? INK : WHITE };
}

// ── Role solvers (WCAG 1.4.3 / 1.4.11) ───────────────────────────────────────
// Tokens that must hold a ratio against known neighbours are solved, not guessed: the lightness
// is walked until the real gamut-clipped sRGB ratio clears the target on every background.

type RGB = [number, number, number];

/** OKLCH → encoded sRGB 0..1 (gamut-clipped), the space browsers blend alpha in. */
function encoded(L: number, C: number, H: number): RGB {
	const hex = oklchToHex(`oklch(${L} ${C} ${H})`);
	return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;
}
const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lumOf = (c: RGB) =>
	0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2]);
const ratioOf = (a: RGB, b: RGB) => {
	const [hi, lo] = [lumOf(a), lumOf(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg: RGB, a: number, bg: RGB): RGB =>
	fg.map((v, i) => v * a + bg[i] * (1 - a)) as RGB;

/** Static action fills (tokens.css): the neighbours a control is drawn next to. */
const ACTION = {
	light: { ink: [0.2, 0.2, 0.2] as RGB, hover: 0.055, selected: 0.09, disabledBg: 0.08 },
	dark: { ink: [1, 1, 1] as RGB, hover: 0.075, selected: 0.13, disabledBg: 0.1 },
};

/** Safety margin over the WCAG floor, so rounding to 3 decimals never lands under it. */
const MARGIN = 0.15;

/**
 * Walk lightness from `from` toward `dir` (+1 lighter, -1 darker) until `pass(L)` holds.
 * Returns the first passing step; the search range ends at pure black/white.
 */
function lift(from: number, dir: 1 | -1, pass: (L: number) => boolean): number {
	let L = from;
	while (!pass(L) && L > 0 && L < 1) L = r(cl(L + dir * 0.005));
	return L;
}

interface Neighbours {
	surfaces: RGB[];
	/** Hover/selected/disabled fills composited over each surface. */
	fills: RGB[];
}

function neighbours(scheme: "light" | "dark", surfaces: RGB[]): Neighbours {
	const a = ACTION[scheme];
	const fills = surfaces.flatMap((s) => [
		blend(a.ink, a.hover, s),
		blend(a.ink, a.selected, s),
		blend(a.ink, a.disabledBg, s),
	]);
	return { surfaces, fills };
}

/**
 * Disabled label: >= 3:1 on every surface and on the disabled fill over it (so a disabled
 * control stays legible without opacity). Same hue/chroma family as the text ramp.
 */
function solveTextDisabled(scheme: "light" | "dark", h: number, n: Neighbours): string {
	const c = scheme === "light" ? 0.008 : 0.007;
	const bgs = [...n.surfaces, ...n.fills];
	const L = lift(scheme === "light" ? 0.62 : 0.5, scheme === "light" ? -1 : 1, (l) =>
		bgs.every((b) => ratioOf(encoded(l, c, h), b) >= 3 + MARGIN)
	);
	return `oklch(${L.toFixed(3)} ${c} ${h})`;
}

/**
 * Field/control boundary: opaque ink >= 3:1 on every surface and on the 5% text tint a field
 * is filled with. Opaque (not alpha) so it does not depend on what is behind.
 */
function solveOutlineControl(scheme: "light" | "dark", h: number, n: Neighbours): string {
	const a = ACTION[scheme];
	const bgs = [...n.surfaces, ...n.surfaces.map((s) => blend(a.ink, 0.05, s))];
	const c = 0.008;
	const L = lift(scheme === "light" ? 0.62 : 0.5, scheme === "light" ? -1 : 1, (l) =>
		bgs.every((b) => ratioOf(encoded(l, c, h), b) >= 3 + MARGIN)
	);
	return `oklch(${L.toFixed(3)} ${c} ${h})`;
}

/**
 * Focus ring: brand hue, >= 3:1 on every surface and on the hover/selected fills it is drawn
 * next to. Starts at brand-main and moves toward the surface-contrast direction until it clears.
 * On a filled control the ring floats `--ca-focus-ring-offset` (2px) off the fill, so the page
 * shows between them and the fill is not an adjacent colour (WCAG 2.4.11 measures the ring
 * against the pixels next to it).
 */
function solveFocusRing(
	scheme: "light" | "dark",
	brandL: number,
	c: number,
	h: number,
	n: Neighbours
): string {
	const bgs = [...n.surfaces, ...n.fills];
	const ok = (l: number) => bgs.every((b) => ratioOf(encoded(l, c, h), b) >= 3 + MARGIN);
	const L = lift(brandL, scheme === "light" ? -1 : 1, ok);
	return `oklch(${L.toFixed(3)} ${c} ${h})`;
}

/** White or ink text on the error fill, whichever reads better (>= 4.5:1). */
export function onFill(fillL: number, fillC: number, fillH: number): string {
	return contrastOn(fillL, fillC, fillH, "white") >= contrastOn(fillL, fillC, fillH, "ink")
		? WHITE
		: INK;
}

/** Static error fills (tokens.css): the same in both schemes. */
const ERROR_FILL = { l: 0.52, c: 0.2, h: 22 };

/**
 * Convert `#rrggbb` (sRGB) to OKLCH via OKLab (Björn Ottosson's matrices).
 * Hue is 0 for achromatic colors.
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
	const [R, G, B] = [1, 3, 5].map((i) => {
		const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
	const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
	const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
	const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
	const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
	const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
	const c = Math.hypot(a, b);
	const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
	return { l: r(L), c: r(c), h: r(h) };
}

/** Convert an opaque `oklch(L C H)` string to `#rrggbb` (gamut-clipped). For browser chrome/canvas. */
export function oklchToHex(color: string): string {
	const m = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
	if (!m) throw new Error(`[codeatlasdev/ui] not an oklch() color: ${color}`);
	const [L, C, H] = [+m[1], +m[2], (+m[3] * Math.PI) / 180];
	const a = C * Math.cos(H);
	const b = C * Math.sin(H);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const lin = [
		4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
	];
	return `#${lin
		.map((v) => {
			const x = Math.max(0, Math.min(1, v));
			const g = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
			return Math.round(g * 255)
				.toString(16)
				.padStart(2, "0");
		})
		.join("")}`;
}

/**
 * Generate a complete @codeatlas/ui preset from a single primary colour.
 *
 * @param hue     0–360   — dominant hue angle (OKLCH H)
 * @param chroma  0–0.32  — brand saturation; 0.21 is the amber baseline
 * @param lightL  0–1     — brand-main lightness in light mode; 0.54 baseline
 */
export function generatePreset(hue: number, chroma = 0.21, lightL = 0.54): PresetTokens {
	const h = r(hue % 360);
	const c = r(cl(chroma));
	const L = r(cl(lightL));

	// ── Light-mode brand ────────────────────────────────────────
	const lightFill = brandFillPair(L, c, h);

	// ── Dark-mode brand (brighter so it reads on dark bg) ───────
	const darkL = r(cl(L + 0.09));
	const darkC = r(c * 0.98);
	// Fill chroma matches brand-main; text on the fill is chosen by real WCAG contrast.
	const darkFill = brandFillPair(darkL, darkC, h);

	// Role colours solved against the surfaces they sit on (see "Role solvers").
	const surfacesL = [
		encoded(0.93, 0.003, h),
		encoded(0.955, 0.002, h),
		encoded(0.98, 0.001, h),
		encoded(0.995, 0.001, h),
	];
	const surfacesD = [
		encoded(0.115, 0.002, h),
		encoded(0.15, 0.002, h),
		encoded(0.19, 0.002, h),
		encoded(0.235, 0.002, h),
	];
	const nL = neighbours("light", surfacesL);
	const nD = neighbours("dark", surfacesD);
	const lightRing = solveFocusRing("light", L, c, h, nL);
	const darkRing = solveFocusRing("dark", darkL, darkC, h, nD);
	const errorContrast = onFill(ERROR_FILL.l, ERROR_FILL.c, ERROR_FILL.h);

	// Glass bg uses hue for light, neutral for dark
	const glassBg = `oklch(${r(cl(0.97))} 0.003 ${h} / 0.82)`;

	return {
		// ── Light brand ───────────────────────────────────────────
		brandMain: `oklch(${L} ${c} ${h})`,
		brandLight: `oklch(${r(cl(L + 0.09))} ${r(c * 0.9)} ${h})`,
		brandDark: `oklch(${r(cl(L - 0.11))} ${r(c * 0.95)} ${h})`,
		brandContrast: lightFill.contrast,
		brandFill: `oklch(${lightFill.fillL} ${c} ${h})`,
		brandFillHover: `oklch(${lightFill.hoverL} ${r(c * 0.95)} ${h})`,

		// ── Light surfaces (very low chroma tint) ─────────────────
		surfaceSunken: `oklch(0.930 0.003 ${h})`,
		surfaceBase: `oklch(0.955 0.002 ${h})`,
		surfaceRaised: `oklch(0.980 0.001 ${h})`,
		surfaceOverlay: `oklch(0.995 0.001 ${h})`,

		// ── Light text ────────────────────────────────────────────
		textPrimary: `oklch(0.200 0.004 ${h})`,
		textSecondary: `oklch(0.420 0.010 ${h})`,
		textDisabled: solveTextDisabled("light", h, nL),
		textHint: `oklch(0.420 0.010 ${h})`,

		// ── Outlines ─────────────────────────────────────────────
		outlineSubtle: "oklch(0 0 0 / 0.08)",
		outlineDefault: "oklch(0 0 0 / 0.16)",
		outlineStrong: "oklch(0 0 0 / 0.30)",
		outlineControl: solveOutlineControl("light", h, nL),
		focusRing: lightRing,
		semanticErrorContrast: errorContrast,

		// ── Glass (light) ─────────────────────────────────────────
		glassBg,
		glassTintUltraThin: `oklch(0.970 0.003 ${h} / 0.15)`,
		glassTintThin: `oklch(0.970 0.003 ${h} / 0.22)`,
		glassTint: `oklch(0.970 0.003 ${h} / 0.32)`,
		glassTintThick: `oklch(0.975 0.003 ${h} / 0.52)`,
		glassTintChrome: `oklch(0.980 0.002 ${h} / 0.72)`,
		glassTintSolid: `oklch(0.960 0.004 ${h})`,
		glassBorder: "oklch(0.700 0 0 / 0.28)",
		glassShadow: "0 2px 8px oklch(0 0 0 / 0.06)",

		// ── Glow (light) ──────────────────────────────────────────
		glowPrimary: `oklch(${L} ${c} ${h} / 0.12)`,
		glowPrimaryStrong: `oklch(${L} ${c} ${h} / 0.22)`,

		// ── Vibrancy (light) ──────────────────────────────────────
		vibrancyLabel: `oklch(0.18 0.010 ${h} / 0.85)`,
		vibrancySecondary: `oklch(0.18 0.010 ${h} / 0.50)`,
		vibrancyTertiary: `oklch(0.18 0.010 ${h} / 0.25)`,
		vibrancyFill: `oklch(0.18 0.010 ${h} / 0.10)`,
		vibrancySeparator: `oklch(0.18 0.010 ${h} / 0.05)`,

		scrimColor: `oklch(0.12 0.010 ${h} / 0.38)`,
		tooltipFg: `oklch(0.970 0.003 ${h})`,

		// ── Dark ──────────────────────────────────────────────────
		dark: {
			brandMain: `oklch(${darkL} ${r(c * 0.98)} ${h})`,
			brandLight: `oklch(${r(cl(darkL + 0.09))} ${r(c * 0.87)} ${h})`,
			brandDark: `oklch(${r(cl(darkL - 0.11))} ${r(c * 0.97)} ${h})`,
			brandContrast: darkFill.contrast,
			brandFill: `oklch(${darkFill.fillL} ${darkC} ${h})`,
			brandFillHover: `oklch(${darkFill.hoverL} ${r(c * 0.97)} ${h})`,

			surfaceSunken: `oklch(0.115 0.002 ${h})`,
			surfaceBase: `oklch(0.150 0.002 ${h})`,
			surfaceRaised: `oklch(0.190 0.002 ${h})`,
			surfaceOverlay: `oklch(0.235 0.002 ${h})`,

			textPrimary: `oklch(0.940 0.003 ${h})`,
			textSecondary: `oklch(0.730 0.007 ${h})`,
			textDisabled: solveTextDisabled("dark", h, nD),
			textHint: `oklch(0.700 0.008 ${h})`,

			outlineControl: solveOutlineControl("dark", h, nD),
			focusRing: darkRing,
			semanticErrorContrast: errorContrast,

			glassBg: "oklch(0.14 0 0 / 0.80)",

			glowPrimary: `oklch(${darkL} ${c} ${h} / 0.16)`,
			glowPrimaryStrong: `oklch(${darkL} ${c} ${h} / 0.32)`,

			vibrancyLabel: `oklch(0.93 0.005 ${h} / 0.85)`,
			vibrancySecondary: `oklch(0.93 0.005 ${h} / 0.50)`,
			vibrancyTertiary: `oklch(0.93 0.005 ${h} / 0.25)`,
			vibrancyFill: `oklch(0.93 0.005 ${h} / 0.10)`,
			vibrancySeparator: `oklch(0.93 0.005 ${h} / 0.05)`,

			tooltipFg: `oklch(0.93 0.005 ${h})`,
		},
	};
}

/** CSS custom properties of one preset, per scheme. */
export type TokenMap = Record<`--ca-${string}`, string>;

// camelCase PresetTokens key → --ca-kebab-case
const cssVar = (k: string) => `--ca-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}` as const;

/** Neutral dark tokens re-declared in every dark block so light preset values never cascade in. */
export const NEUTRAL_DARK: TokenMap = {
	"--ca-outline-subtle": "oklch(1 0 0 / 0.08)",
	"--ca-outline-default": "oklch(1 0 0 / 0.14)",
	"--ca-outline-strong": "oklch(1 0 0 / 0.26)",
	"--ca-glass-tint-ultra-thin": "oklch(0.20 0 0 / 0.22)",
	"--ca-glass-tint-thin": "oklch(0.22 0 0 / 0.34)",
	"--ca-glass-tint": "oklch(0.24 0 0 / 0.44)",
	"--ca-glass-tint-thick": "oklch(0.20 0 0 / 0.65)",
	"--ca-glass-tint-chrome": "oklch(0.16 0 0 / 0.85)",
	"--ca-glass-tint-solid": "oklch(0.18 0 0)",
	"--ca-glass-border": "oklch(1 0 0 / 0.18)",
	"--ca-glass-shadow": "0 4px 16px oklch(0 0 0 / 0.35)",
	"--ca-scrim-color": "oklch(0 0 0 / 0.50)",
};

/** Flatten generated tokens into `--ca-*` maps for the light and dark blocks. */
export function presetVars(tokens: PresetTokens): { light: TokenMap; dark: TokenMap } {
	const { dark: d, ...l } = tokens;
	const light: TokenMap = {};
	for (const [k, v] of Object.entries(l)) light[cssVar(k)] = v;
	const dark: TokenMap = {};
	for (const [k, v] of Object.entries(d)) dark[cssVar(k)] = v;
	return { light, dark: { ...dark, ...NEUTRAL_DARK } };
}

/**
 * What the role tokens are for, in the words tooling should show. The built-in preset files carry these
 * as comments in `presets/amber.css` only (scripts/build-themes.ts): that is the canonical file the token
 * manifest reads as `description`. The other presets and the inline brand presets stay comment-free to
 * keep the shipped CSS and the `<head>` small.
 */
export const TOKEN_DOCS: Record<string, string> = {
	"--ca-text-disabled":
		"Label of disabled controls only; never information (use --ca-text-hint to de-emphasise). >= 3:1 on every surface and on the disabled fill.",
	"--ca-outline-control":
		"Boundary of a field or control (text field, select, checkbox box): >= 3:1 on every surface and on the 5% field tint (WCAG 1.4.11). --ca-outline-subtle is for dividers.",
	"--ca-focus-ring":
		"Keyboard focus ring and focus border: >= 3:1 on every surface and on the hover/selected fills. Components read this, never --ca-brand-main.",
	"--ca-semantic-error-contrast":
		"Text colour for --ca-semantic-error-fill (>= 4.5:1), the way --ca-brand-contrast pairs with --ca-brand-fill. Re-theming the fill means re-setting this.",
};

/** Render one CSS rule from a declaration map. */
export function cssBlock(
	selector: string,
	vars: Record<string, string>,
	docs?: Record<string, string>
): string {
	const body = Object.entries(vars)
		.map(([k, v]) => (docs?.[k] ? `  /* ${docs[k]} */\n  ${k}: ${v};` : `  ${k}: ${v};`))
		.join("\n");
	return `${selector} {\n${body}\n}`;
}

/** Emit the CSS block for a named preset (or null for inline injection).
 *  Pass rootSel/darkSel to use custom selectors (e.g. for scoped preview). */
export function tokensToCSS(
	tokens: PresetTokens,
	name: string | null,
	rootSel?: string,
	darkSel?: string
): string {
	const sel = rootSel ?? (name ? `[data-preset="${name}"]` : ":root");
	const dsel = darkSel ?? (name ? `.dark[data-preset="${name}"]` : ".dark");
	const { light, dark } = presetVars(tokens);
	return `${cssBlock(sel, light)}\n${cssBlock(dsel, dark)}`;
}
