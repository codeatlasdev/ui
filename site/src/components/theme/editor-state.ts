import {
	DESIGN_STYLES,
	type DesignStyleId,
	defineTheme,
	designStyle,
	type ElevationModel,
	type SurfaceStyle,
	type ThemeDefinition,
	themeCSS,
} from "@codeatlasdev/ui";

/** Everything the editor persists: the chosen recipe plus the user's edits on top of it. */
export interface EditorState {
	style: DesignStyleId;
	/** Overrides on top of `designStyle(style)`. Only keys the user touched. */
	edits: Partial<ThemeDefinition>;
	/** Scheme the preview island renders in (never touches the page). */
	scheme: "light" | "dark";
}

export const STORAGE_KEY = "ca-theme-def";

export const SURFACES: SurfaceStyle[] = [
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
export const ELEVATIONS: ElevationModel[] = ["soft", "none", "hard", "glow"];
export const RADII = ["xs", "sm", "md", "lg", "xl", "pill"] as const;
export const DENSITIES = ["compact", "comfortable", "airy"] as const;
export const EASINGS = ["standard", "emphasized", "spring", "linear", "steps"] as const;
export const CASES = ["none", "uppercase"] as const;

export const DEFAULT_STATE: EditorState = { style: "default", edits: {}, scheme: "dark" };

export const isStyleId = (v: unknown): v is DesignStyleId =>
	typeof v === "string" && v in DESIGN_STYLES;

/** Recipe + edits: what the preview renders and what the output prints. */
export function resolveDefinition(state: EditorState): Partial<ThemeDefinition> {
	return designStyle(state.style, state.edits);
}

/**
 * Parse stored state. Anything that is not an object of the right shape resolves to the
 * default; a definition `defineTheme` rejects (bad preset, bad hex) does too.
 */
export function parseState(raw: string | null): EditorState {
	if (!raw) return { ...DEFAULT_STATE, edits: {} };
	try {
		const v = JSON.parse(raw) as Partial<EditorState> | null;
		if (!v || typeof v !== "object" || !isStyleId(v.style)) throw new Error("style");
		if (!v.edits || typeof v.edits !== "object" || Array.isArray(v.edits)) throw new Error("edits");
		const scheme = v.scheme === "light" ? "light" : "dark";
		const state: EditorState = { style: v.style, edits: v.edits, scheme };
		defineTheme(resolveDefinition(state));
		return state;
	} catch {
		return { ...DEFAULT_STATE, edits: {} };
	}
}

// ── Output ───────────────────────────────────────────────────────────────

const isPlain = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** Drop undefined/empty entries recursively so the printed code only has meaningful keys. */
function prune(v: unknown): unknown {
	if (Array.isArray(v)) return v.length ? v.map(prune) : undefined;
	if (!isPlain(v)) return v === undefined ? undefined : v;
	const out: Record<string, unknown> = {};
	for (const [k, x] of Object.entries(v)) {
		const p = prune(x);
		if (p !== undefined) out[k] = p;
	}
	return Object.keys(out).length ? out : undefined;
}

const KEY = /^[A-Za-z_$][\w$]*$/;
const str = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function literal(v: unknown, depth: number): string {
	const pad = "\t".repeat(depth + 1);
	const end = "\t".repeat(depth);
	if (typeof v === "string") return str(v);
	if (typeof v !== "object" || v === null) return String(v);
	if (Array.isArray(v))
		return `[\n${v.map((x) => `${pad}${literal(x, depth + 1)},`).join("\n")}\n${end}]`;
	const rows = Object.entries(v).map(
		([k, x]) => `${pad}${KEY.test(k) ? k : str(k)}: ${literal(x, depth + 1)},`
	);
	return `{\n${rows.join("\n")}\n${end}}`;
}

/**
 * The exact code a user pastes into `src/lib/theme.ts`. A chosen design style is referenced
 * through `designStyle(id, …)`, so the app keeps following the package recipe; only the
 * user's own edits are written out.
 */
export function themeSource(state: EditorState): string {
	if (state.style === "default") {
		const def = prune(state.edits) as Record<string, unknown> | undefined;
		const body = def ? literal(def, 0) : "{}";
		return `import { defineTheme } from "@codeatlasdev/ui";\n\nexport const theme = defineTheme(${body});\n`;
	}
	const edits = prune(state.edits) as Record<string, unknown> | undefined;
	const args = edits ? `"${state.style}", ${literal(edits, 0)}` : `"${state.style}"`;
	return `import { defineTheme, designStyle } from "@codeatlasdev/ui";\n\nexport const theme = defineTheme(designStyle(${args}));\n`;
}

// ── Preview scoping ──────────────────────────────────────────────────────

/** Class of the preview island. Everything `themeCSS` emits is rewritten to it. */
export const ISLAND = "te-island";

/**
 * `themeCSS` targets `:root` (knobs, raw overrides) and brand presets keyed on
 * `[data-preset]`. Rewrite the `:root` selectors to the island so the page never changes;
 * brand presets already work on any element carrying `data-preset`.
 */
export function islandCSS(def: Partial<ThemeDefinition>): string {
	return themeCSS(defineTheme(def))
		.replace(':root,\n[data-theme-scope="light"] {', `.${ISLAND} {`)
		.replace(
			':root.dark,\n:root [data-theme-scope="dark"] {',
			`.${ISLAND}[data-theme-scope="dark"] {`
		);
}
