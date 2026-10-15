// ─── defineTheme: typed theme object → deterministic CSS ─────────────────────
// MUI-style: `defineTheme()` resolves a partial definition once; `themeCSS()`
// compiles it to one CSS string (same input → same output), injected by
// themeHead before any stylesheet. No runtime style insertion per render.

import {
	cssBlock,
	generatePreset,
	hexToOklch,
	oklchToHex,
	onFill,
	presetVars,
	type TokenMap,
} from "../utils/palette-generator.js";
import { BUILTIN_PRESETS, type BuiltinPresetSource } from "./builtins.js";

export type ColorScheme = "light" | "dark" | "system";
/** Surface material. glass/frosted blur the backdrop; the rest are opaque. */
export type SurfaceStyle =
	| "glass"
	| "frosted"
	| "solid"
	| "flat"
	| "outlined"
	| "neumorphic"
	| "clay"
	| "tonal"
	| "chrome";

export const SCHEMES: readonly ColorScheme[] = ["light", "dark", "system"];
export const STYLES: readonly SurfaceStyle[] = [
	"glass",
	"frosted",
	"solid",
	"flat",
	"outlined",
	"neumorphic",
	"clay",
	"tonal",
	"chrome",
];
/**
 * Deps that must be bundled for SSR: they ship raw .svelte files or extensionless ESM.
 * Vite's own Svelte-library detection misses them when the package manager links them from
 * a global store (bun's isolated linker), and Node then fails on `.svelte`.
 */
export const SSR_NO_EXTERNAL = [
	"@lucide/svelte",
	"@tanstack/svelte-table",
	"@tanstack/table-core",
	"shiki",
];

export const BUILTIN_IDS: readonly string[] = BUILTIN_PRESETS.map((p) => p.id);

/**
 * Hand-picked colors for one scheme of a preset, by role. Every role is optional: unset roles
 * keep the generated value. Use it to port an existing palette (a terminal or editor theme)
 * without touching raw `--ca-*` tokens.
 */
export interface SchemeColors {
	/** Brand for this scheme as `#rrggbb`; brand fills, text and glows are regenerated from it. */
	brand?: `#${string}`;
	/** Page background (--ca-surface-base, also the browser chrome color): `#rrggbb` or `oklch()`. */
	background?: string;
	/** Wells, inputs, code blocks (--ca-surface-sunken). */
	sunken?: string;
	/** Cards and panels (--ca-surface-raised). */
	surface?: string;
	/** Menus, dialogs, popovers (--ca-surface-overlay). */
	overlay?: string;
	text?: string;
	textSecondary?: string;
	textHint?: string;
	textDisabled?: string;
	borderSubtle?: string;
	border?: string;
	borderStrong?: string;
	success?: string;
	warning?: string;
	info?: string;
	error?: string;
}

const ROLE_TOKENS: Record<Exclude<keyof SchemeColors, "brand">, string> = {
	background: "--ca-surface-base",
	sunken: "--ca-surface-sunken",
	surface: "--ca-surface-raised",
	overlay: "--ca-surface-overlay",
	text: "--ca-text-primary",
	textSecondary: "--ca-text-secondary",
	textHint: "--ca-text-hint",
	textDisabled: "--ca-text-disabled",
	borderSubtle: "--ca-outline-subtle",
	border: "--ca-outline-default",
	borderStrong: "--ca-outline-strong",
	success: "--ca-semantic-success",
	warning: "--ca-semantic-warning",
	info: "--ca-semantic-info",
	error: "--ca-semantic-error",
};

/** A preset generated from one sRGB hex color (e.g. the logo color). */
export interface PresetDefinition {
	/** Value for `data-preset`. Must not clash with a built-in preset id. */
	id: string;
	/** Brand color as `#rrggbb`. Hue, chroma and lightness are derived from it. */
	color: `#${string}`;
	label?: string;
	/** Per-scheme role colors on top of the generated palette. */
	colors?: { light?: SchemeColors; dark?: SchemeColors };
}

/** Page background pattern. mesh = brand glow gradients (drawn by the glass and frosted materials); the rest are flat paper. */
export type Paper = "mesh" | "plain" | "grid" | "dots" | "lines";

/** Metrics of the fallback face, from the font's own tables, so the swap does not shift layout. */
export interface FontFallbackMetrics {
	/** `size-adjust`, e.g. `"104.6%"` or `1.046`. */
	sizeAdjust?: string | number;
	/** `ascent-override`, e.g. `"92%"`. */
	ascent?: string;
	/** `descent-override`, e.g. `"24%"`. */
	descent?: string;
	/** `line-gap-override`, e.g. `"0%"`. */
	lineGap?: string;
}

/** A self-hosted web font. Emits `@font-face`, an optional preload and a metric-matched fallback face. */
export interface FontDescriptor {
	/** Family name used in `font-family`. */
	family: string;
	/** URL of the woff2 file. */
	src: string;
	/** A single weight or a variable range, e.g. `400` or `"100 900"`. @default 400 */
	weight?: number | string;
	/** @default "normal" */
	style?: "normal" | "italic";
	/** @default "swap" */
	display?: "auto" | "block" | "swap" | "fallback" | "optional";
	/** Emit `<link rel="preload" as="font" crossorigin>` in `themeHead`. Use for above-the-fold fonts only. @default false */
	preload?: boolean;
	/** System font the fallback face is built from, e.g. `"Arial"`. Needed for `fallbackMetrics`. */
	fallback?: string;
	/** With `fallback`: declares `"<family> Fallback"` with these metrics (zero layout shift on swap). */
	fallbackMetrics?: FontFallbackMetrics;
	/** Generic family appended last. @default "sans-serif" */
	generic?: string;
}

/** A font stack string (existing behavior) or a self-hosted font descriptor. */
export type FontSpec = string | FontDescriptor;

/** Spacing density: a multiplier of the 4px unit, or a named step. */
export type Density = "compact" | "comfortable" | "airy" | number;

/** Shadow model: how elevation is drawn. */
export type ElevationModel = "soft" | "none" | "hard" | "glow";

export interface TypographyOptions {
	/** Multiplier on the whole UI type scale. @default 1 */
	scale?: number;
	weights?: Partial<Record<"regular" | "medium" | "semibold" | "bold" | "heading", number>>;
	/** Heading letter-spacing, e.g. "-0.02em" (tight) or "0.04em" (wide). */
	headingTracking?: string;
	headingCase?: "none" | "uppercase";
	labelTracking?: string;
	labelCase?: "none" | "uppercase";
	/** Body line-height. @default 1.55 */
	lineHeight?: number;
	/** Max line length for prose, e.g. "65ch". */
	measure?: string;
}

export interface MotionOptions {
	/** Multiplier on every duration (0 = instant, 1.5 = slower). @default 1 */
	scale?: number;
	/** Default easing personality for --ca-ease-standard. */
	easing?: "standard" | "emphasized" | "spring" | "linear" | "steps";
}

export interface ThemeDefinition {
	/** Brand presets, emitted inline so they paint with the first frame. Built-ins are always available. */
	presets: PresetDefinition[];
	/** Preset applied until the user picks one. @default "amber" */
	defaultPreset: string;
	/** Scheme applied until the user picks one. @default "dark" */
	defaultScheme: ColorScheme;
	/** Surface material applied until the user picks one. @default "solid" */
	defaultStyle: SurfaceStyle;
	/** Fonts for --ca-font-sans (body), --ca-font-mono and --ca-font-display. A string is a plain stack. */
	fonts: { display?: FontSpec; body?: FontSpec; mono?: FontSpec };
	/** Radius multiplier (0 = square corners, 2 = very round). 0.8 makes `--ca-radius-md` 8px. @default 0.8 */
	radius: number;
	/** Corner role used by buttons, fields and chips. @default "md" */
	controlRadius: "xs" | "sm" | "md" | "lg" | "xl" | "pill";
	/** Spacing density. compact = 0.75, comfortable = 1, airy = 1.25. @default "comfortable" */
	density: Density;
	/** Border weights in px. @default { width: 1, strong: 2 } */
	border: { width?: number; strong?: number };
	typography: TypographyOptions;
	/** How elevation is drawn. hard = offset shadows with no blur (Neobrutalism). @default "soft" */
	elevation: ElevationModel;
	motion: MotionOptions;
	/** Icon stroke width (Lucide). @default 1.75 */
	iconStroke: number;
	/** Film-grain texture over the page background, 0 to 0.12. @default 0 */
	noise: number;
	/** Page background pattern. Flat patterns use --ca-outline-subtle, so they follow the preset. @default "plain" */
	paper: Paper;
	/** Raw token overrides per scheme. Applied last. */
	overrides: { light?: TokenMap; dark?: TokenMap };
}

export interface ResolvedTheme extends ThemeDefinition {
	/** Every valid `data-preset` value: built-ins + brand presets. */
	known: string[];
	/** Hex of --ca-surface-base per preset and scheme, for `<meta name="theme-color">`. */
	themeColor: Record<string, { light: string; dark: string }>;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Stylesheet defaults of the knobs below (tokens.css): a theme that keeps them emits no CSS for them. */
const DEFAULT_RADIUS = 0.8;
const DEFAULT_ICON_STROKE = 1.75;
const DEFAULT_HEADING_WEIGHT = 600;
/** Materials whose stylesheet draws the page mesh (base.css); `paper: "plain"` must switch it off there. */
const MESH_STYLES: readonly SurfaceStyle[] = ["glass", "frosted"];

/**
 * `--ca-semantic-error-contrast` for a map that sets `--ca-semantic-error-fill` to a colour of its
 * own: white or ink, whichever reads better on it, like `--ca-brand-contrast` for the brand fill.
 * Maps that leave the fill alone keep the preset's pair.
 */
function withErrorContrast<T extends Record<string, string>>(vars: T): T {
	const fill = vars["--ca-semantic-error-fill"];
	if (!fill || "--ca-semantic-error-contrast" in vars) return vars;
	const m = fill.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
	if (!m) return vars;
	return { ...vars, "--ca-semantic-error-contrast": onFill(+m[1], +m[2], +m[3]) };
}

/** Light/dark token maps (with `color-scheme`) for a built-in or brand preset. */
function presetTokens(src: BuiltinPresetSource | PresetDefinition) {
	let vars: { light: TokenMap; dark: TokenMap };
	if ("hue" in src) {
		const g = presetVars(generatePreset(src.hue, src.chroma, src.lightL));
		vars = {
			light: { ...g.light, ...withErrorContrast({ ...src.overrides.light }) },
			dark: { ...g.dark, ...withErrorContrast({ ...src.overrides.dark }) },
		};
	} else {
		if (!HEX.test(src.color))
			throw new Error(`[codeatlasdev/ui] preset "${src.id}": color must be #rrggbb`);
		const { l, c, h } = hexToOklch(src.color);
		const g = presetVars(generatePreset(h, c, l));
		vars = {
			light: {
				"--ca-chart-brand": src.color,
				...g.light,
				...withErrorContrast(roleTokens(src, "light")),
			},
			dark: { ...g.dark, ...withErrorContrast(roleTokens(src, "dark")) },
		};
	}
	const light: Record<string, string> = { "color-scheme": "light", ...vars.light };
	const dark: Record<string, string> = { "color-scheme": "dark", ...vars.dark };
	return { light, dark };
}

/** Tokens for a preset's hand-picked role colors in one scheme (see SchemeColors). */
function roleTokens(src: PresetDefinition, scheme: "light" | "dark"): TokenMap {
	const colors = src.colors?.[scheme];
	if (!colors) return {};
	const out: TokenMap = {};
	if (colors.brand) {
		if (!HEX.test(colors.brand))
			throw new Error(
				`[codeatlasdev/ui] preset "${src.id}": colors.${scheme}.brand must be #rrggbb`
			);
		const { l, c, h } = hexToOklch(colors.brand);
		// Generated with the brand as the light anchor: take that side's brand/glow ramp.
		const g = presetVars(generatePreset(h, c, l)).light;
		for (const [k, v] of Object.entries(g) as [keyof TokenMap, string][])
			if (k.startsWith("--ca-brand-") || k.startsWith("--ca-glow-")) out[k] = v;
		if (scheme === "light") out["--ca-chart-brand"] = colors.brand;
	}
	for (const [role, token] of Object.entries(ROLE_TOKENS) as [
		keyof typeof ROLE_TOKENS,
		keyof TokenMap,
	][]) {
		const v = colors[role];
		if (v) out[token] = v;
	}
	// A hand-picked error colour also owns the destructive fill, so its label is derived with it.
	if (colors.error && /^oklch\(/.test(colors.error)) out["--ca-semantic-error-fill"] = colors.error;
	return out;
}

/**
 * Neutral tokens for `prefers-contrast: more`, tinted with the preset hue like the
 * base set. Text L is picked so text-secondary/hint reach >= 7:1 (WCAG AAA) on the
 * darkest light surface (L .930) and the lightest dark surface (L .235) at any hue;
 * outlines are opaque enough to clear 3:1 (strong >= 7:1) against those surfaces.
 * tests/theme-script.test.ts measures both.
 */
function contrastTokens(src: BuiltinPresetSource | PresetDefinition, scheme: "light" | "dark") {
	const h = "hue" in src ? src.hue : hexToOklch(src.color).h;
	return scheme === "light"
		? {
				"--ca-text-secondary": `oklch(0.340 0.010 ${h})`,
				"--ca-text-hint": `oklch(0.340 0.010 ${h})`,
				"--ca-outline-subtle": `oklch(0.200 0.010 ${h} / 0.60)`,
				"--ca-outline-default": `oklch(0.200 0.010 ${h} / 0.70)`,
				"--ca-outline-strong": `oklch(0.200 0.010 ${h} / 0.85)`,
				"--ca-outline-control": `oklch(0.200 0.010 ${h} / 0.85)`,
				"--ca-text-disabled": `oklch(0.420 0.010 ${h})`,
			}
		: {
				"--ca-text-secondary": `oklch(0.820 0.007 ${h})`,
				"--ca-text-hint": `oklch(0.820 0.007 ${h})`,
				"--ca-outline-subtle": "oklch(1 0 0 / 0.45)",
				"--ca-outline-default": "oklch(1 0 0 / 0.60)",
				"--ca-outline-strong": "oklch(1 0 0 / 0.75)",
				"--ca-outline-control": "oklch(1 0 0 / 0.75)",
				"--ca-text-disabled": `oklch(0.700 0.008 ${h})`,
			};
}

/**
 * CSS for one preset. A preset applies on `<html>` or on any element (`data-preset`
 * islands), and `[data-theme-scope="light"|"dark"]` re-applies a scheme inside it.
 * Covered contexts, nearest wins:
 * - `html.dark` around a preset island → dark;
 * - scope on the same element as the preset, or a scope inside the preset;
 * - a preset island inside a scope island;
 * - a scope inside a preset island nested in another preset (the page or an outer island).
 * Selectors cannot express proximity, so three or more alternating scope levels
 * around one preset, or one preset at two nesting levels with another one between them,
 * are not supported.
 * - root: also the default (amber) tokens for `:root`, `.dark` and bare scopes.
 * - brand: emitted unlayered by themeHead, so it wins over the layered built-ins.
 */
export function presetCSS(
	src: BuiltinPresetSource | PresetDefinition,
	kind: "root" | "builtin" | "brand",
	docs?: Record<string, string>
): string {
	const { light, dark } = presetTokens(src);
	const P = `[data-preset="${src.id}"]`;
	const L = '[data-theme-scope="light"]';
	const D = '[data-theme-scope="dark"]';
	// A scope inside this preset re-applies it, unless the scope carries its own preset or sits
	// inside a nearer island of another preset (that preset wins; brand rules are unlayered and
	// would beat a built-in one, and between built-ins file order would decide).
	const inside = (scope: string) =>
		`${P} ${scope}:not([data-preset],${P} [data-preset]:not(${P}) *)`;
	const lightSel = [
		...(kind === "root" ? [":root", L] : []),
		P,
		inside(L),
		// Doubled attributes: beat `.dark ${P}` (0,2,0) when the light scope is closer.
		`${P}${L}${L}`,
		`${L}${L} ${P}`,
	];
	const darkSel = [
		...(kind === "root" ? [".dark", D] : []),
		`.dark${P}`,
		`.dark ${P}`,
		inside(D),
		`${P}${D}${D}`,
		`${D} ${P}`,
	];
	// prefers-contrast: more — same selectors, after the base blocks, so it wins at equal specificity.
	const more = `@media (prefers-contrast: more) {\n${cssBlock(lightSel.join(",\n"), contrastTokens(src, "light"))}\n${cssBlock(darkSel.join(",\n"), contrastTokens(src, "dark"))}\n}`;
	return `${cssBlock(lightSel.join(",\n"), light, docs)}\n${cssBlock(darkSel.join(",\n"), dark)}\n${more}`;
}

/** Resolve a partial definition: fills defaults, validates ids, precomputes theme-color hexes. */
export function defineTheme(def: Partial<ThemeDefinition> = {}): ResolvedTheme {
	const presets = def.presets ?? [];
	for (const p of presets) {
		if (BUILTIN_IDS.includes(p.id))
			throw new Error(`[codeatlasdev/ui] preset "${p.id}" clashes with a built-in preset`);
		if (!HEX.test(p.color))
			throw new Error(`[codeatlasdev/ui] preset "${p.id}": color must be #rrggbb`);
	}
	const known = [...BUILTIN_IDS, ...presets.map((p) => p.id)];
	const defaultPreset = def.defaultPreset ?? "amber";
	if (!known.includes(defaultPreset))
		throw new Error(`[codeatlasdev/ui] defaultPreset "${defaultPreset}" is not a known preset`);
	const themeColor: ResolvedTheme["themeColor"] = {};
	for (const src of [...BUILTIN_PRESETS, ...presets]) {
		const { light, dark } = presetTokens(src);
		// Role colors may already be hex (SchemeColors.background); generated ones are oklch().
		const hex = (c: string) => (HEX.test(c) ? c : oklchToHex(c));
		themeColor[src.id] = {
			light: hex(light["--ca-surface-base"]),
			dark: hex(dark["--ca-surface-base"]),
		};
	}
	return {
		presets,
		defaultPreset,
		defaultScheme: def.defaultScheme ?? "dark",
		defaultStyle: def.defaultStyle ?? "solid",
		fonts: def.fonts ?? {},
		radius: def.radius ?? DEFAULT_RADIUS,
		controlRadius: def.controlRadius ?? "md",
		density: def.density ?? "comfortable",
		border: def.border ?? {},
		typography: {
			...def.typography,
			weights: { heading: DEFAULT_HEADING_WEIGHT, ...def.typography?.weights },
		},
		elevation: def.elevation ?? "soft",
		motion: def.motion ?? {},
		iconStroke: def.iconStroke ?? DEFAULT_ICON_STROKE,
		noise: def.noise ?? 0,
		paper: def.paper ?? "plain",
		overrides: def.overrides ?? {},
		known,
		themeColor,
	};
}

const quote = (family: string) => `"${family.replace(/["\\]/g, "")}"`;

/** `font-family` value for a font spec: plain strings pass through, descriptors get a fallback chain. */
function fontStack(f: FontSpec): string {
	if (typeof f === "string") return f;
	const parts = [quote(f.family)];
	if (f.fallback && f.fallbackMetrics) parts.push(quote(`${f.family} Fallback`));
	parts.push(f.generic ?? "sans-serif");
	return parts.join(", ");
}

/** `@font-face` rules for a descriptor: the web font, plus the metric-matched fallback when configured. */
function fontFaceCSS(f: FontDescriptor): string {
	const weight = f.weight ?? 400;
	const rules = [
		cssBlock("@font-face", {
			"font-family": quote(f.family),
			src: `url("${f.src.replace(/["\\\n]/g, "")}") format("woff2")`,
			"font-weight": String(weight),
			"font-style": f.style ?? "normal",
			"font-display": f.display ?? "swap",
		}),
	];
	if (f.fallback && f.fallbackMetrics) {
		const m = f.fallbackMetrics;
		const face: Record<string, string> = {
			"font-family": quote(`${f.family} Fallback`),
			src: `local(${quote(f.fallback)})`,
			"font-weight": String(weight),
			"font-style": f.style ?? "normal",
		};
		if (m.sizeAdjust !== undefined)
			face["size-adjust"] =
				typeof m.sizeAdjust === "number" ? `${+(m.sizeAdjust * 100).toFixed(2)}%` : m.sizeAdjust;
		if (m.ascent) face["ascent-override"] = m.ascent;
		if (m.descent) face["descent-override"] = m.descent;
		if (m.lineGap) face["line-gap-override"] = m.lineGap;
		rules.push(cssBlock("@font-face", face));
	}
	return rules.join("\n");
}

/**
 * Resolved `--ca-*` token maps of the theme's default preset, light and dark, as the stylesheet
 * declares them. For tools that need literal colors outside CSS (favicons, social cards).
 */
export function defaultPresetTokens(t: ResolvedTheme): { light: TokenMap; dark: TokenMap } {
	const src = [...BUILTIN_PRESETS, ...t.presets].find((p) => p.id === t.defaultPreset);
	if (!src)
		throw new Error(`[codeatlasdev/ui] defaultPreset "${t.defaultPreset}" is not a known preset`);
	return presetTokens(src);
}

/** `<link rel="preload" as="font">` tags for every descriptor with `preload: true` (deduplicated by URL). */
export function fontPreloads(t: Pick<ResolvedTheme, "fonts">): string {
	const urls = new Set<string>();
	for (const f of Object.values(t.fonts))
		if (typeof f === "object" && f.preload) urls.add(f.src.replace(/["<>\\]/g, ""));
	return [...urls]
		.map((u) => `<link rel="preload" as="font" type="font/woff2" href="${u}" crossorigin>`)
		.join("");
}

const DENSITY: Record<Exclude<Density, number>, number> = {
	compact: 0.75,
	comfortable: 1,
	airy: 1.25,
};

const PAPER_INK = "var(--ca-outline-subtle)";
const PAPER: Record<Exclude<Paper, "mesh">, string> = {
	plain: "none",
	grid: `linear-gradient(${PAPER_INK} 1px, transparent 1px) 0 0 / 100% 28px, linear-gradient(90deg, ${PAPER_INK} 1px, transparent 1px) 0 0 / 28px 100%`,
	dots: `radial-gradient(${PAPER_INK} 1.2px, transparent 1.4px) 0 0 / 20px 20px`,
	lines: `linear-gradient(${PAPER_INK} 1px, transparent 1px) 0 0 / 100% 28px`,
};

const EASING: Record<NonNullable<MotionOptions["easing"]>, string> = {
	standard: "cubic-bezier(0.4, 0, 0.2, 1)",
	emphasized: "cubic-bezier(0.2, 0, 0, 1)",
	spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
	linear: "linear",
	steps: "steps(4, end)",
};

/** Shadow tokens for an elevation model (soft is the stylesheet default, so it emits nothing). */
function elevationTokens(model: ElevationModel): Record<string, string> {
	if (model === "soft") return {};
	const steps = { xs: 1, sm: 2, md: 3, lg: 4, xl: 6 } as const;
	const shadow = (n: number) =>
		model === "none"
			? "none"
			: model === "hard"
				? `${n * 2}px ${n * 2}px 0 0 var(--ca-border-color)`
				: `0 0 ${n * 6}px color-mix(in oklab, var(--ca-brand-main) ${10 + n * 4}%, transparent)`;
	const out: Record<string, string> = {};
	for (const [k, n] of Object.entries(steps)) out[`--ca-shadow-${k}`] = shadow(n);
	const mat = { "ultra-thin": 1, thin: 2, regular: 3, thick: 4, chrome: 1 } as const;
	for (const [k, n] of Object.entries(mat))
		out[`--ca-mat-${k}-shadow`] = model === "none" ? "0 0 #0000" : shadow(n);
	return out;
}

/** Design knobs → root custom properties. Only values that differ from the stylesheet defaults. */
export function designTokens(
	t: Pick<
		ResolvedTheme,
		| "radius"
		| "controlRadius"
		| "density"
		| "border"
		| "typography"
		| "elevation"
		| "motion"
		| "iconStroke"
		| "noise"
		| "paper"
		| "defaultStyle"
	>
): Record<string, string> {
	const root: Record<string, string> = {};
	if (t.radius !== DEFAULT_RADIUS) root["--ca-radius-scale"] = String(t.radius);
	if (t.controlRadius !== "md") root["--ca-radius-control"] = `var(--ca-radius-${t.controlRadius})`;
	const density = typeof t.density === "number" ? t.density : DENSITY[t.density];
	if (density !== 1) root["--ca-density"] = String(density);
	if (t.border.width !== undefined) root["--ca-border-width"] = `${t.border.width}px`;
	if (t.border.strong !== undefined) root["--ca-border-width-strong"] = `${t.border.strong}px`;
	const ty = t.typography;
	if (ty.scale !== undefined && ty.scale !== 1) root["--ca-font-scale"] = String(ty.scale);
	for (const [k, v] of Object.entries(ty.weights ?? {}))
		if (k !== "heading" || v !== DEFAULT_HEADING_WEIGHT) root[`--ca-font-weight-${k}`] = String(v);
	if (ty.headingTracking) root["--ca-heading-tracking"] = ty.headingTracking;
	if (ty.headingCase) root["--ca-heading-case"] = ty.headingCase;
	if (ty.labelTracking) root["--ca-label-tracking"] = ty.labelTracking;
	if (ty.labelCase) root["--ca-label-case"] = ty.labelCase;
	if (ty.lineHeight !== undefined) {
		root["--ca-line-height-body"] = String(ty.lineHeight);
		root["--ca-line-height-prose"] = String(ty.lineHeight);
	}
	if (ty.measure) root["--ca-measure"] = ty.measure;
	Object.assign(root, elevationTokens(t.elevation));
	if (t.motion.scale !== undefined && t.motion.scale !== 1)
		root["--ca-motion-scale"] = String(t.motion.scale);
	if (t.motion.easing && t.motion.easing !== "standard")
		root["--ca-ease-standard"] = EASING[t.motion.easing];
	if (t.iconStroke !== DEFAULT_ICON_STROKE) root["--ca-icon-stroke"] = String(t.iconStroke);
	if (t.noise) root["--ca-noise-opacity"] = String(Math.min(0.12, Math.max(0, t.noise)));
	// `mesh` leaves the page to the material (base.css); `plain` only needs saying where the material draws one.
	if (t.paper !== "mesh" && (t.paper !== "plain" || MESH_STYLES.includes(t.defaultStyle)))
		root["--ca-page-mesh"] = PAPER[t.paper];
	return root;
}

/**
 * Compile a resolved theme to CSS: brand presets, @font-face rules, design knobs and raw
 * overrides. Deterministic: same theme → same string. Empty when every value is a default.
 * Preload links for descriptor fonts come from `fontPreloads`.
 */
export function themeCSS(t: ResolvedTheme): string {
	const out = t.presets.map((p) => presetCSS(p, "brand"));
	const root: Record<string, string> = {};
	for (const f of [t.fonts.body, t.fonts.mono, t.fonts.display])
		if (typeof f === "object") out.push(fontFaceCSS(f));
	if (t.fonts.body) root["--ca-font-sans"] = fontStack(t.fonts.body);
	if (t.fonts.mono) root["--ca-font-mono"] = fontStack(t.fonts.mono);
	if (t.fonts.display) root["--ca-font-display"] = fontStack(t.fonts.display);
	Object.assign(root, designTokens(t));
	Object.assign(root, withErrorContrast({ ...t.overrides.light }));
	if (Object.keys(root).length) out.push(cssBlock(':root,\n[data-theme-scope="light"]', root));
	if (t.overrides.dark && Object.keys(t.overrides.dark).length)
		out.push(
			cssBlock(
				':root.dark,\n:root [data-theme-scope="dark"]',
				withErrorContrast({ ...t.overrides.dark })
			)
		);
	return out.join("\n");
}
