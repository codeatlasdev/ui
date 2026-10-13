// ─── defineTheme: typed theme object → deterministic CSS ─────────────────────
// MUI-style: `defineTheme()` resolves a partial definition once; `themeCSS()`
// compiles it to one CSS string (same input → same output), injected by
// themeHead before any stylesheet. No runtime style insertion per render.

import {
	cssBlock,
	generatePreset,
	hexToOklch,
	oklchToHex,
	presetVars,
	type TokenMap,
} from "../utils/palette-generator.js";
import { BUILTIN_PRESETS, type BuiltinPresetSource } from "./builtins.js";

export type ColorScheme = "light" | "dark" | "system";
export type SurfaceStyle = "glass" | "frosted" | "solid" | "flat";

export const SCHEMES: readonly ColorScheme[] = ["light", "dark", "system"];
export const STYLES: readonly SurfaceStyle[] = ["glass", "frosted", "solid", "flat"];
/** Deps that must be bundled for SSR (extensionless .svelte imports, ESM-only). */
export const SSR_NO_EXTERNAL = ["@tanstack/svelte-table", "@tanstack/table-core", "shiki"];

export const BUILTIN_IDS: readonly string[] = BUILTIN_PRESETS.map((p) => p.id);

/** A preset generated from one sRGB hex color (e.g. the logo color). */
export interface PresetDefinition {
	/** Value for `data-preset`. Must not clash with a built-in preset id. */
	id: string;
	/** Brand color as `#rrggbb`. Hue, chroma and lightness are derived from it. */
	color: `#${string}`;
	label?: string;
}

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

export interface ThemeDefinition {
	/** Brand presets, emitted inline so they paint with the first frame. Built-ins are always available. */
	presets: PresetDefinition[];
	/** Preset applied until the user picks one. @default "amber" */
	defaultPreset: string;
	/** Scheme applied until the user picks one. @default "dark" */
	defaultScheme: ColorScheme;
	/** Surface style applied until the user picks one. @default "glass" */
	defaultStyle: SurfaceStyle;
	/** Fonts for --ca-font-sans (body), --ca-font-mono and --ca-font-display. A string is a plain stack. */
	fonts: { display?: FontSpec; body?: FontSpec; mono?: FontSpec };
	/** Radius multiplier. @default 1 */
	radius: number;
	/** @default "comfortable" */
	density: "compact" | "comfortable";
	/** Raw token overrides per scheme. */
	overrides: { light?: TokenMap; dark?: TokenMap };
}

export interface ResolvedTheme extends ThemeDefinition {
	/** Every valid `data-preset` value: built-ins + brand presets. */
	known: string[];
	/** Hex of --ca-surface-base per preset and scheme, for `<meta name="theme-color">`. */
	themeColor: Record<string, { light: string; dark: string }>;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Light/dark token maps (with `color-scheme`) for a built-in or brand preset. */
function presetTokens(src: BuiltinPresetSource | PresetDefinition) {
	let vars: { light: TokenMap; dark: TokenMap };
	if ("hue" in src) {
		const g = presetVars(generatePreset(src.hue, src.chroma, src.lightL));
		vars = {
			light: { ...g.light, ...src.overrides.light },
			dark: { ...g.dark, ...src.overrides.dark },
		};
	} else {
		if (!HEX.test(src.color))
			throw new Error(`[codeatlasdev/ui] preset "${src.id}": color must be #rrggbb`);
		const { l, c, h } = hexToOklch(src.color);
		const g = presetVars(generatePreset(h, c, l));
		vars = { light: { "--ca-chart-brand": src.color, ...g.light }, dark: g.dark };
	}
	const light: Record<string, string> = { "color-scheme": "light", ...vars.light };
	const dark: Record<string, string> = { "color-scheme": "dark", ...vars.dark };
	return { light, dark };
}

/**
 * CSS for one preset. A preset applies on `<html>` or on any element (`data-preset`
 * islands), and `[data-theme-scope="light"|"dark"]` re-applies a scheme inside it.
 * Covered contexts, nearest wins:
 * - `html.dark` around a preset island → dark;
 * - scope on the same element as the preset, or a scope inside the preset;
 * - a preset island inside a scope island.
 * Selectors cannot express proximity, so three or more alternating scope levels
 * around one preset are not supported.
 * - root: also the default (amber) tokens for `:root`, `.dark` and bare scopes.
 * - brand: emitted unlayered by themeHead, so it wins over the layered built-ins.
 */
export function presetCSS(
	src: BuiltinPresetSource | PresetDefinition,
	kind: "root" | "builtin" | "brand"
): string {
	const { light, dark } = presetTokens(src);
	const P = `[data-preset="${src.id}"]`;
	const L = '[data-theme-scope="light"]';
	const D = '[data-theme-scope="dark"]';
	const lightSel = [
		...(kind === "root" ? [":root", L] : []),
		P,
		`${P} ${L}`,
		// Doubled attributes: beat `.dark ${P}` (0,2,0) when the light scope is closer.
		`${P}${L}${L}`,
		`${L}${L} ${P}`,
	];
	const darkSel = [
		...(kind === "root" ? [".dark", D] : []),
		`.dark${P}`,
		`.dark ${P}`,
		`${P} ${D}`,
		`${P}${D}${D}`,
		`${D} ${P}`,
	];
	return `${cssBlock(lightSel.join(",\n"), light)}\n${cssBlock(darkSel.join(",\n"), dark)}`;
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
		themeColor[src.id] = {
			light: oklchToHex(light["--ca-surface-base"]),
			dark: oklchToHex(dark["--ca-surface-base"]),
		};
	}
	return {
		presets,
		defaultPreset,
		defaultScheme: def.defaultScheme ?? "dark",
		defaultStyle: def.defaultStyle ?? "glass",
		fonts: def.fonts ?? {},
		radius: def.radius ?? 1,
		density: def.density ?? "comfortable",
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

/** `<link rel="preload" as="font">` tags for every descriptor with `preload: true` (deduplicated by URL). */
export function fontPreloads(t: Pick<ResolvedTheme, "fonts">): string {
	const urls = new Set<string>();
	for (const f of Object.values(t.fonts))
		if (typeof f === "object" && f.preload) urls.add(f.src.replace(/["<>\\]/g, ""));
	return [...urls]
		.map((u) => `<link rel="preload" as="font" type="font/woff2" href="${u}" crossorigin>`)
		.join("");
}

const RADII = { xs: 4, sm: 6, md: 10, lg: 14, xl: 20 } as const;

/**
 * Compile a resolved theme to CSS: brand presets, then structural tokens
 * (fonts, radius, density) and raw overrides. Deterministic: same theme → same string.
 * Descriptor fonts add their `@font-face` rules (preload links come from `fontPreloads`).
 * Empty string when the theme only uses built-in defaults.
 */
export function themeCSS(t: ResolvedTheme): string {
	const out = t.presets.map((p) => presetCSS(p, "brand"));
	const root: Record<string, string> = {};
	for (const f of [t.fonts.body, t.fonts.mono, t.fonts.display])
		if (typeof f === "object") out.push(fontFaceCSS(f));
	if (t.fonts.body) root["--ca-font-sans"] = fontStack(t.fonts.body);
	if (t.fonts.mono) root["--ca-font-mono"] = fontStack(t.fonts.mono);
	if (t.fonts.display) root["--ca-font-display"] = fontStack(t.fonts.display);
	if (t.radius !== 1)
		for (const [k, v] of Object.entries(RADII))
			root[`--ca-radius-${k}`] = `${+(v * t.radius).toFixed(2)}px`;
	if (t.density === "compact") {
		root["--ca-card-padding"] = "14px";
		root["--ca-page-gap"] = "14px";
		root["--ca-page-pt"] = "14px";
		root["--ca-page-px"] = "16px";
	}
	Object.assign(root, t.overrides.light);
	if (Object.keys(root).length) out.push(cssBlock(':root,\n[data-theme-scope="light"]', root));
	if (t.overrides.dark && Object.keys(t.overrides.dark).length)
		out.push(cssBlock(':root.dark,\n:root [data-theme-scope="dark"]', t.overrides.dark));
	return out.join("\n");
}
