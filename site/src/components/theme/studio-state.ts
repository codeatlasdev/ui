// ─── Theme Studio state ──────────────────────────────────────────────────────
// One plain, serializable object is the whole editor. `toThemeOptions` maps it 1:1 onto the lib's
// `ThemeOptions`; nothing in the studio invents a knob the engine does not have. Pure and DOM-free,
// so the codec, the history and the mapping are unit-testable.

import type {
	ColorScheme,
	Density,
	DesignStyleId,
	ElevationModel,
	Paper,
	SurfaceStyle,
	ThemeOptions,
} from "./engine";

/**
 * Ids of the built-in presets. Kept literal so this module has no runtime import of the package
 * barrel (it pulls Svelte components) and stays testable under plain `bun test`; `studio.test.ts`
 * asserts it equals the package's own `THEME_PRESETS` ids, so a new built-in cannot drift.
 */
export const BUILTIN_PRESETS_IDS = [
	"amber",
	"ocean",
	"crimson",
	"cyan",
	"violet",
	"emerald",
	"rose",
	"slate",
];

/** Preset id the studio gives the user's own brand. Never clashes with a built-in. */
export const STUDIO_PRESET = "studio";

/** Roles a user can hand-pick per scheme (a subset of the engine's `SchemeColors`). */
export const COLOR_ROLES = [
	"brandFill",
	"brandFillHover",
	"brandContrast",
	"background",
	"sunken",
	"surface",
	"overlay",
	"text",
	"textSecondary",
	"textHint",
	"textDisabled",
	"borderSubtle",
	"border",
	"borderStrong",
	"success",
	"warning",
	"info",
	"error",
] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** Hand-picked colors for one scheme. A missing role keeps the generated value. */
export type RoleColors = Partial<Record<ColorRole, string>>;

/** Font pair ids from `fonts.ts`; `custom` keeps the user's three stacks. */
export interface FontChoice {
	body?: string;
	display?: string;
	mono?: string;
}

export interface TypeRoleEdit {
	size?: string;
	leading?: number;
	tracking?: string;
	weight?: number;
}

export interface StudioState {
	/** Design-style recipe the edits sit on top of. */
	base: DesignStyleId;
	/** `studio` = the user's own brand, else a built-in preset id. */
	preset: string;
	/** Brand color as `#rrggbb`; generates the full `studio` preset. */
	brand: string;
	/** Optional separate brand for dark mode. */
	brandDark?: string;
	colors: { light: RoleColors; dark: RoleColors };
	scheme: ColorScheme;
	/** Surface material. */
	surface: SurfaceStyle;
	radius: number;
	controlRadius: "xs" | "sm" | "md" | "lg" | "xl" | "pill";
	density: Density;
	borderWidth: number;
	borderStrong: number;
	elevation: ElevationModel;
	paper: Paper;
	noise: number;
	fonts: FontChoice;
	/** Multiplier on the whole UI type scale. */
	fontScale: number;
	headingWeight: number;
	headingTracking: string;
	headingCase: "none" | "uppercase";
	labelCase: "none" | "uppercase";
	lineHeight: number;
	type: Partial<Record<"title" | "heading" | "body" | "label" | "caption" | "num", TypeRoleEdit>>;
	motionScale: number;
	motionEasing: "standard" | "emphasized" | "spring" | "linear" | "steps";
	motionEnter: "default" | "none";
	iconStroke: number;
	/** Button/field component tokens (a small, real subset of `ThemeOptions.components`). */
	buttonWeight?: number;
	buttonTracking?: string;
	buttonGap?: string;
}

/** What a brand-new studio shows: the package default with a neutral blue brand. */
export const DEFAULT_STATE: StudioState = {
	base: "default",
	preset: STUDIO_PRESET,
	brand: "#2b5fd9",
	colors: { light: {}, dark: {} },
	scheme: "dark",
	surface: "solid",
	radius: 0.8,
	controlRadius: "md",
	density: "comfortable",
	borderWidth: 1,
	borderStrong: 2,
	elevation: "soft",
	paper: "plain",
	noise: 0,
	fonts: {},
	fontScale: 1,
	headingWeight: 600,
	headingTracking: "",
	headingCase: "none",
	labelCase: "none",
	lineHeight: 1.55,
	type: {},
	motionScale: 1,
	motionEasing: "standard",
	motionEnter: "default",
	iconStroke: 1.75,
};

/**
 * The state of a bare design recipe, for pages that apply a recipe to the site ("Apply to site" on
 * a style page). It compiles to exactly `designStyle(id)`: the recipe's own `defaultStyle` is kept
 * (`recipeSurface`, the recipe's `theme.defaultStyle`), and no custom brand is injected, so the
 * visitor keeps the site's built-in brand (`preset`, default `amber`) under the recipe.
 */
export function stateFromRecipe(
	id: DesignStyleId,
	recipeSurface: SurfaceStyle | undefined,
	preset = "amber"
): StudioState {
	return {
		...clone(DEFAULT_STATE),
		base: id,
		preset,
		surface: recipeSurface ?? DEFAULT_STATE.surface,
	};
}

export const clone = <T>(v: T): T => structuredClone(v);

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is `#${string}` => typeof v === "string" && HEX.test(v);

const isPlain = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** Drop `undefined` and empty groups so printed code and share URLs carry only meaningful keys. */
export function prune<T>(v: T): T | undefined {
	if (Array.isArray(v)) return (v.length ? v.map(prune) : undefined) as T | undefined;
	if (!isPlain(v)) return v === undefined || v === "" ? undefined : v;
	const out: Record<string, unknown> = {};
	for (const [k, x] of Object.entries(v)) {
		const p = prune(x);
		if (p !== undefined) out[k] = p;
	}
	return (Object.keys(out).length ? out : undefined) as T | undefined;
}

/**
 * The state as `ThemeOptions`, exactly what the user pastes into `theme.ts`. Values equal to the
 * engine default are left out (the engine emits no CSS for them either). `base` is not applied
 * here: the printed code references the recipe through `designStyle(base, …)` so the app keeps
 * following it, while `resolveThemeOptions` flattens it for the live preview.
 */
export function toThemeOptions(s: StudioState): ThemeOptions {
	const d = DEFAULT_STATE;
	const custom = s.preset === STUDIO_PRESET;
	const roles = (c: RoleColors) => (Object.keys(c).length ? c : undefined);
	const light = {
		...(s.brand ? { brand: s.brand as `#${string}` } : {}),
		...roles(s.colors.light),
	};
	const dark = {
		...(s.brandDark ? { brand: s.brandDark as `#${string}` } : {}),
		...roles(s.colors.dark),
	};
	const t = (k: keyof StudioState) => (s[k] !== d[k] ? s[k] : undefined);
	const options: ThemeOptions = {
		...(custom
			? {
					presets: [
						{
							id: STUDIO_PRESET,
							label: "Studio",
							color: s.brand as `#${string}`,
							colors: {
								...(Object.keys(light).length > 1 ? { light } : {}),
								...(Object.keys(dark).length ? { dark } : {}),
							},
						},
					],
				}
			: {}),
		defaultPreset: s.preset,
		defaultScheme: s.scheme,
		defaultStyle: s.surface,
		radius: t("radius") as number | undefined,
		controlRadius: t("controlRadius") as StudioState["controlRadius"] | undefined,
		density: t("density") as Density | undefined,
		border:
			s.borderWidth !== d.borderWidth || s.borderStrong !== d.borderStrong
				? { width: s.borderWidth, strong: s.borderStrong }
				: undefined,
		elevation: t("elevation") as ElevationModel | undefined,
		paper: t("paper") as Paper | undefined,
		noise: t("noise") as number | undefined,
		iconStroke: t("iconStroke") as number | undefined,
		fonts: {
			body: s.fonts.body,
			display: s.fonts.display,
			mono: s.fonts.mono,
		},
		typography: {
			scale: s.fontScale !== 1 ? s.fontScale : undefined,
			weights: s.headingWeight !== d.headingWeight ? { heading: s.headingWeight } : undefined,
			headingTracking: s.headingTracking || undefined,
			headingCase: s.headingCase !== "none" ? s.headingCase : undefined,
			labelCase: s.labelCase !== "none" ? s.labelCase : undefined,
			lineHeight: s.lineHeight !== d.lineHeight ? s.lineHeight : undefined,
		},
		type: s.type,
		motion: {
			scale: s.motionScale !== 1 ? s.motionScale : undefined,
			easing: s.motionEasing !== "standard" ? s.motionEasing : undefined,
			enter: s.motionEnter !== "default" ? s.motionEnter : undefined,
		},
		components: {
			button: {
				weight: s.buttonWeight,
				tracking: s.buttonTracking,
				gap: s.buttonGap,
			},
		},
	};
	// A built-in preset is only named, never redefined.
	if (!custom && !BUILTIN_PRESETS_IDS.includes(s.preset)) options.defaultPreset = "amber";
	return prune(options) ?? {};
}

// ─── Share URL ───────────────────────────────────────────────────────────────

const VERSION = "1";

/** Keys of `StudioState` whose value differs from the default (the share payload). */
export function diffFromDefault(s: StudioState): Partial<StudioState> {
	const out: Record<string, unknown> = {};
	// Union of keys: optional fields (`brandDark`, `buttonWeight`) are absent from the default.
	for (const k of new Set([...Object.keys(DEFAULT_STATE), ...Object.keys(s)]) as Set<
		keyof StudioState
	>) {
		if (JSON.stringify(s[k]) !== JSON.stringify(DEFAULT_STATE[k])) out[k] = s[k];
	}
	return out as Partial<StudioState>;
}

const b64 = {
	enc: (s: string) =>
		btoa(String.fromCharCode(...new TextEncoder().encode(s)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, ""),
	dec: (s: string) => {
		const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
	},
};

/** `v1.<base64url(JSON diff)>`: short for a default theme, stable, and safe in a URL hash. */
export function encodeState(s: StudioState): string {
	return `v${VERSION}.${b64.enc(JSON.stringify(diffFromDefault(s)))}`;
}

const SCHEMES = ["light", "dark", "system"];
const SURFACES = [
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
const RADII = ["xs", "sm", "md", "lg", "xl", "pill"];
const ELEVATIONS = ["soft", "none", "hard", "glow"];
const PAPERS = ["mesh", "plain", "grid", "dots", "lines"];
const EASINGS = ["standard", "emphasized", "spring", "linear", "steps"];
const DENSITIES = ["compact", "comfortable", "airy"];

const num = (v: unknown, lo: number, hi: number) =>
	typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
const oneOf = (v: unknown, list: readonly string[]) => typeof v === "string" && list.includes(v);
/** A value safe to print inside a CSS declaration or a string literal. */
const safeText = (v: unknown, max = 200): v is string =>
	typeof v === "string" && v.length <= max && !/[;{}<>\\`]/.test(v);

function roleColors(v: unknown): RoleColors {
	if (!isPlain(v)) return {};
	const out: RoleColors = {};
	for (const role of COLOR_ROLES) {
		const c = v[role];
		if (typeof c === "string" && safeText(c, 80) && c.trim()) out[role] = c.trim();
	}
	return out;
}

/**
 * Validate an untrusted partial state (from a URL, storage or a generator) onto the default. Every
 * field is checked individually, so one bad key never discards the rest. Strings that reach CSS or
 * code are screened for declaration breakouts.
 */
export function sanitizeState(raw: unknown): StudioState {
	const s = clone(DEFAULT_STATE);
	if (!isPlain(raw)) return s;
	const r = raw as Record<string, unknown>;
	if (
		oneOf(r.base, [
			"default",
			"liquid",
			"swiss",
			"brutalism",
			"neumorphism",
			"glassmorphism",
			"material",
			"fluent",
			"apple",
			"bento",
			"claymorphism",
			"y2k",
			"editorial",
			"terminal",
			"sketchbook",
		])
	)
		s.base = r.base as DesignStyleId;
	if (
		r.preset === STUDIO_PRESET ||
		(typeof r.preset === "string" && BUILTIN_PRESETS_IDS.includes(r.preset))
	)
		s.preset = r.preset as string;
	if (isHex(r.brand)) s.brand = r.brand.toLowerCase();
	if (isHex(r.brandDark)) s.brandDark = r.brandDark.toLowerCase();
	if (isPlain(r.colors))
		s.colors = { light: roleColors(r.colors.light), dark: roleColors(r.colors.dark) };
	if (oneOf(r.scheme, SCHEMES)) s.scheme = r.scheme as ColorScheme;
	if (oneOf(r.surface, SURFACES)) s.surface = r.surface as SurfaceStyle;
	if (num(r.radius, 0, 3)) s.radius = r.radius as number;
	if (oneOf(r.controlRadius, RADII))
		s.controlRadius = r.controlRadius as StudioState["controlRadius"];
	if (oneOf(r.density, DENSITIES) || num(r.density, 0.5, 2)) s.density = r.density as Density;
	if (num(r.borderWidth, 0, 6)) s.borderWidth = r.borderWidth as number;
	if (num(r.borderStrong, 0, 8)) s.borderStrong = r.borderStrong as number;
	if (oneOf(r.elevation, ELEVATIONS)) s.elevation = r.elevation as ElevationModel;
	if (oneOf(r.paper, PAPERS)) s.paper = r.paper as Paper;
	if (num(r.noise, 0, 0.12)) s.noise = r.noise as number;
	if (isPlain(r.fonts)) {
		for (const k of ["body", "display", "mono"] as const)
			if (safeText(r.fonts[k], 160) && (r.fonts[k] as string).trim())
				s.fonts[k] = r.fonts[k] as string;
	}
	if (num(r.fontScale, 0.7, 1.6)) s.fontScale = r.fontScale as number;
	if (num(r.headingWeight, 100, 900)) s.headingWeight = r.headingWeight as number;
	if (safeText(r.headingTracking, 12)) s.headingTracking = r.headingTracking as string;
	if (oneOf(r.headingCase, ["none", "uppercase"]))
		s.headingCase = r.headingCase as "none" | "uppercase";
	if (oneOf(r.labelCase, ["none", "uppercase"])) s.labelCase = r.labelCase as "none" | "uppercase";
	if (num(r.lineHeight, 1, 2.4)) s.lineHeight = r.lineHeight as number;
	if (isPlain(r.type)) {
		for (const role of ["title", "heading", "body", "label", "caption", "num"] as const) {
			const spec = r.type[role];
			if (!isPlain(spec)) continue;
			const e: TypeRoleEdit = {};
			if (safeText(spec.size, 16)) e.size = spec.size as string;
			if (num(spec.leading, 0.8, 3)) e.leading = spec.leading as number;
			if (safeText(spec.tracking, 16)) e.tracking = spec.tracking as string;
			if (num(spec.weight, 1, 1000)) e.weight = spec.weight as number;
			if (Object.keys(e).length) s.type[role] = e;
		}
	}
	if (num(r.motionScale, 0, 3)) s.motionScale = r.motionScale as number;
	if (oneOf(r.motionEasing, EASINGS))
		s.motionEasing = r.motionEasing as StudioState["motionEasing"];
	if (oneOf(r.motionEnter, ["default", "none"]))
		s.motionEnter = r.motionEnter as "default" | "none";
	if (num(r.iconStroke, 0.5, 3)) s.iconStroke = r.iconStroke as number;
	if (num(r.buttonWeight, 100, 900)) s.buttonWeight = r.buttonWeight as number;
	if (safeText(r.buttonTracking, 12)) s.buttonTracking = r.buttonTracking as string;
	if (safeText(r.buttonGap, 12)) s.buttonGap = r.buttonGap as string;
	return s;
}

/** Inverse of `encodeState`. Null for anything that is not a v1 payload. */
export function decodeState(code: string): StudioState | null {
	const m = /^v(\d+)\.([\w-]+)$/.exec(code.trim());
	if (!m || m[1] !== VERSION) return null;
	try {
		return sanitizeState(JSON.parse(b64.dec(m[2] as string)));
	} catch {
		return null;
	}
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface History {
	past: StudioState[];
	present: StudioState;
	future: StudioState[];
	/** Key of the last coalesced edit (`radius`, `brand`): same key within `COALESCE_MS` extends one step. */
	key?: string;
	at: number;
}

export const HISTORY_LIMIT = 100;
export const COALESCE_MS = 600;

export const createHistory = (present: StudioState): History => ({
	past: [],
	present,
	future: [],
	at: 0,
});

/** Commit `next`. Consecutive edits of the same `key` inside `COALESCE_MS` become one undo step. */
export function commit(h: History, next: StudioState, key?: string, now = Date.now()): History {
	if (JSON.stringify(next) === JSON.stringify(h.present)) return h;
	const merge = key !== undefined && key === h.key && now - h.at < COALESCE_MS && h.past.length > 0;
	return {
		past: merge ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT),
		present: next,
		future: [],
		key,
		at: now,
	};
}

export function undo(h: History): History {
	const prev = h.past[h.past.length - 1];
	if (!prev) return h;
	return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future], at: 0 };
}

export function redo(h: History): History {
	const [next, ...rest] = h.future;
	if (!next) return h;
	return { past: [...h.past, h.present], present: next, future: rest, at: 0 };
}
