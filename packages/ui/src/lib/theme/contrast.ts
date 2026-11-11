// ─── Build-time contrast findings for hand-set preset roles ──────────────────
// Used by caThemePlugin and caUI at build time, and by theme editors in the browser through the
// package barrel. The runtime entries (seo/pwa.ts) never import it, so the color evaluation stays
// out of the bundles that only need `defineTheme` for its defaults.

import type { ParsedColor } from "../utils/css-color.js";
import { compositeOver, evalColor } from "../utils/css-color-mix.js";
import { contrastRatio } from "../utils/palette-generator.js";
import { presetTokens, type ResolvedTheme, ROLE_TOKENS } from "./define.js";

export interface PresetContrastIssue {
	preset: string;
	scheme: "light" | "dark";
	ratio: number;
	message: string;
	/** The role that fell short, when it is a hand-set text role (`brandContrast` issues leave it out). */
	role?: TextRole;
}

/** WCAG AA for normal text: the floor for a label on a brand fill. */
const AA = 4.5;

/** Label roles on a solid fill, measured as a pair at 4.5:1. `fallback`: the stylesheet fill when the preset sets only the label. */
const FILL_PAIRS = [
	{ fill: "brandFill", label: "brandContrast", use: "button", fallback: "" },
	{ fill: "errorFill", label: "errorContrast", use: "button", fallback: "oklch(0.52 0.200 22)" },
] as const;

/** Roles the build measures on every surface after compositing alpha, with the WCAG floor of each: text 4.5:1, a control edge 3:1 (1.4.11). */
const MEASURED_ROLES = [
	{ role: "text", min: AA, use: "text" },
	{ role: "textSecondary", min: AA, use: "text" },
	{ role: "textHint", min: AA, use: "text" },
	{ role: "borderControl", min: 3, use: "a control edge" },
] as const;
type TextRole = Exclude<(typeof MEASURED_ROLES)[number]["role"], "borderControl">;
const SURFACE_TOKENS = [
	"--ca-surface-sunken",
	"--ca-surface-base",
	"--ca-surface-raised",
	"--ca-surface-overlay",
] as const;

/** WCAG ratio between two opaque encoded-sRGB colors. */
function rgbRatio(a: [number, number, number], b: [number, number, number]): number {
	const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	const lum = (c: [number, number, number]) =>
		0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/**
 * Hand-set roles of a brand preset that miss WCAG AA, as findings:
 * - `brandContrast` on `brandFill` under 4.5:1 (a role left unset is measured from the generated
 *   fill/contrast of that scheme, so a lone `brandContrast` is checked against the fill it will sit on);
 * - `text`, `textSecondary` or `textHint` under 4.5:1 on any of the four surfaces **after
 *   compositing their alpha** over that surface (a translucent role is only as readable as what is
 *   behind it). Surfaces a preset hand-sets are used as written; the rest are the generated ones.
 * Colors the build cannot evaluate (`var()`, other keywords) are skipped, never guessed.
 */
export function presetContrastIssues(t: Pick<ResolvedTheme, "presets">): PresetContrastIssue[] {
	const issues: PresetContrastIssue[] = [];
	for (const p of t.presets) {
		const tokens = presetTokens(p);
		for (const scheme of ["light", "dark"] as const) {
			const set = p.colors?.[scheme];
			const vars = tokens[scheme];
			for (const pair of FILL_PAIRS) {
				if (!set?.[pair.fill] && !set?.[pair.label]) continue;
				const fill = vars[ROLE_TOKENS[pair.fill]] ?? pair.fallback;
				const text = vars[ROLE_TOKENS[pair.label]];
				const ratio = fill && text ? contrastRatio(fill, text) : null;
				if (ratio !== null && ratio < AA)
					issues.push({
						preset: p.id,
						scheme,
						ratio,
						message: `preset "${p.id}" (${scheme}): ${pair.label} ${text} on ${pair.fill} ${fill} is ${ratio.toFixed(2)}:1, under the 4.5:1 WCAG AA minimum for ${pair.use} text. Pick a darker/lighter pair.`,
					});
			}
			if (!set) continue;
			const surfaces = SURFACE_TOKENS.map((s) => evalColor(vars[s] ?? ""))
				.filter((c): c is ParsedColor => c !== null)
				.map((c) => compositeOver(c, [1, 1, 1]));
			for (const { role, min, use } of MEASURED_ROLES) {
				if (set[role] === undefined) continue;
				const color = evalColor(vars[ROLE_TOKENS[role]] ?? "");
				if (!color || surfaces.length === 0) continue;
				const worst = Math.min(...surfaces.map((s) => rgbRatio(compositeOver(color, s), s)));
				if (worst >= min) continue;
				issues.push({
					preset: p.id,
					scheme,
					...(role === "borderControl" ? {} : { role }),
					ratio: worst,
					message: `preset "${p.id}" (${scheme}): ${role} ${vars[ROLE_TOKENS[role]]} is ${worst.toFixed(2)}:1 on its surface after compositing alpha, under the ${min}:1 WCAG minimum for ${use}. Raise its opacity or lighten/darken it.`,
				});
			}
		}
	}
	return issues;
}

/** Print `presetContrastIssues` once per finding. Build tooling (`caThemePlugin`, `caUI`) calls it with the app's theme. */
export function warnPresetContrast(t: Pick<ResolvedTheme, "presets">, tool: string): void {
	for (const issue of presetContrastIssues(t))
		console.warn(`\n[codeatlasdev/ui] ${tool}: ${issue.message}\n`);
}
