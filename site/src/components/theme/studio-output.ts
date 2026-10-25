// ─── Studio output: everything derived from a StudioState ────────────────────
// Live CSS for the preview island, CSS for the whole site, the code a user pastes, the AI prompt
// and the contrast findings. All pure functions of the state.

import {
	contrast,
	type DesignStyleId,
	defineTheme,
	designStyle,
	type PresetContrastIssue,
	presetContrastIssues,
	presetTokens,
	THEME_PRESETS,
	type ThemeOptions,
	themeCSS,
} from "./engine";
import {
	encodeState,
	prune,
	STUDIO_PRESET,
	type StudioState,
	toThemeOptions,
} from "./studio-state";

/** Class of the preview islands. Everything `themeCSS` emits is rewritten to it. */
export const ISLAND = "te-island";

/** The recipe flattened under the user's options: what the engine actually receives. */
export function resolveOptions(s: StudioState): ThemeOptions {
	const mine = toThemeOptions(s);
	return s.base === "default" ? mine : designStyle(s.base, mine);
}

/**
 * CSS for a preview island. `themeCSS` targets `:root` (knobs, raw overrides) and brand presets keyed
 * on `[data-preset]`; the `:root` selectors are rewritten to the island so the page never changes.
 */
export function islandCSS(s: StudioState): string {
	return themeCSS(defineTheme(resolveOptions(s)))
		.replace(':root,\n[data-theme-scope="light"] {', `.${ISLAND} {`)
		.replace(
			':root.dark,\n:root [data-theme-scope="dark"] {',
			`.${ISLAND}[data-theme-scope="dark"] {`
		);
}

/** CSS that restyles the whole page (the "apply to site" payload). Same text a real app would ship. */
export function siteCSS(s: StudioState): string {
	return themeCSS(defineTheme(resolveOptions(s)));
}

// ─── Code ────────────────────────────────────────────────────────────────────

const KEY = /^[A-Za-z_$][\w$]*$/;
const str = (v: string) => JSON.stringify(v);

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
 * The exact `src/lib/theme.ts`. A chosen recipe is referenced through `designStyle(id, …)` so the
 * app keeps following the package; only the user's own options are written out.
 */
export function themeSource(s: StudioState): string {
	const mine = prune(toThemeOptions(s));
	const body = mine ? literal(mine, 0) : "{}";
	if (s.base === "default")
		return `import type { ThemeOptions } from "@codeatlasdev/ui";\n\nexport const theme: ThemeOptions = ${body};\n`;
	return `import { designStyle, type ThemeOptions } from "@codeatlasdev/ui";\n\nexport const theme: ThemeOptions = designStyle(${str(s.base)}, ${body});\n`;
}

/** Where the theme goes in a SvelteKit app and an Astro app (the two integrations the package ships). */
export function wiringSource(kind: "kit" | "astro"): string {
	if (kind === "astro")
		return `// astro.config.mjs\nimport { caUI } from "@codeatlasdev/ui/astro";\nimport { theme } from "./src/theme.ts";\n\nexport default defineConfig({\n\tintegrations: [caUI({ theme })],\n});\n`;
	return `// vite.config.ts\nimport { caErrorPlugin, caThemePlugin } from "@codeatlasdev/ui/vite";\nimport { theme } from "./src/lib/theme.ts";\n\nexport default defineConfig({\n\tplugins: [sveltekit(), caThemePlugin(theme), caErrorPlugin({ scaffold: true, theme })],\n});\n\n// src/hooks.server.ts\nimport { sequence } from "@sveltejs/kit/hooks";\nimport { caThemeHandle, createErrorHandler } from "@codeatlasdev/ui/kit";\nimport { theme } from "$lib/theme";\n\nexport const handle = sequence(caThemeHandle(theme));\nexport const handleError = createErrorHandler();\n`;
}

/** The CSS the theme compiles to, for apps that paste CSS instead of using the plugin. */
export function cssSource(s: StudioState): string {
	const css = siteCSS(s);
	return css || "/* Every value is a package default: no CSS to ship. */";
}

/** Share link for the current state. `base` is the page URL without a hash. */
export function shareURL(s: StudioState, base: string): string {
	return `${base.replace(/#.*$/, "")}#t=${encodeState(s)}`;
}

/**
 * A prompt a coding agent can follow without reading the docs: the theme object, where it goes,
 * and the rules that keep it correct.
 */
export function agentPrompt(s: StudioState): string {
	return `Apply this @codeatlasdev/ui theme to the project.

1. Create \`src/lib/theme.ts\` (SvelteKit) or \`src/theme.ts\` (Astro) with exactly:

\`\`\`ts
${themeSource(s).trimEnd()}
\`\`\`

2. Wire it once.

SvelteKit:
\`\`\`ts
${wiringSource("kit").trimEnd()}
\`\`\`

Astro:
\`\`\`ts
${wiringSource("astro").trimEnd()}
\`\`\`

Rules:
- The file is a plain \`ThemeOptions\` object: use \`import type\` only, because vite.config and astro.config load it in Node.
- Import the CSS once: \`import "@codeatlasdev/ui/styles/global.css";\`
- To change a token later, edit \`theme.ts\`. Do not write \`!important\` or override \`.ca-*\` classes.
- Local overrides go on \`:root\` as \`--ca-*\` custom properties.
- Docs: https://ui.codeatlas.com.br/docs/getting-started/theming/
`;
}

// ─── Contrast findings ───────────────────────────────────────────────────────

export interface ContrastFinding {
	scheme: "light" | "dark";
	/** What is measured, e.g. "Brand text on surface". */
	label: string;
	/** Token of the foreground role, so a panel can show the finding next to its field. */
	role: string;
	ratio: number;
	/** Ratio that counts as passing: 4.5 for text, 3 for UI parts. */
	min: number;
	pass: boolean;
}

/** [label, role, foreground token, background token, minimum ratio] */
const PAIRS: [string, string, string, string, number][] = [
	["Body text on page", "text", "--ca-text-primary", "--ca-surface-base", 4.5],
	["Body text on cards", "text", "--ca-text-primary", "--ca-surface-raised", 4.5],
	["Secondary text on cards", "textSecondary", "--ca-text-secondary", "--ca-surface-raised", 4.5],
	["Brand text on surface", "brand", "--ca-brand-text", "--ca-surface-raised", 4.5],
	["Button label on brand fill", "brandContrast", "--ca-brand-contrast", "--ca-brand-fill", 4.5],
	["Field outline on page", "border", "--ca-outline-control", "--ca-surface-base", 3],
];

/**
 * Always-on contrast readout of the resolved palette, from the same tokens the stylesheet declares.
 * A pair the build cannot evaluate (a `var()` role) is skipped, never guessed.
 */
export function contrastReport(s: StudioState): ContrastFinding[] {
	const src =
		s.preset === STUDIO_PRESET
			? (resolveOptions(s).presets ?? []).find((p) => p.id === STUDIO_PRESET)
			: THEME_PRESETS.find((p) => p.id === s.preset);
	if (!src) return [];
	const tokens = presetTokens("hue" in src ? src : (src as Parameters<typeof presetTokens>[0]));
	const out: ContrastFinding[] = [];
	for (const scheme of ["light", "dark"] as const) {
		const vars = tokens[scheme];
		for (const [label, role, fg, bg, min] of PAIRS) {
			const [a, b] = [vars[fg as keyof typeof vars], vars[bg as keyof typeof vars]];
			const ratio = a && b ? contrast(a, b) : null;
			if (ratio !== null) out.push({ scheme, label, role, ratio, min, pass: ratio >= min });
		}
	}
	return out;
}

/** The engine's own findings for hand-set roles (the same ones `caThemePlugin` prints at build). */
export function engineIssues(s: StudioState): PresetContrastIssue[] {
	const t = defineTheme(resolveOptions(s));
	return presetContrastIssues(t);
}

export type { DesignStyleId };
