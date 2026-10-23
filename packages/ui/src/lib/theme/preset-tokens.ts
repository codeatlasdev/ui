// ─── Preset role colors with alpha, and domain tokens (status, tier, channel) ─
// A preset can carry colors that are not UI roles: funnel status, score tier, contact channel, map
// pins. They follow the preset and the scheme like every other token, so an app needs no parallel
// stylesheet. Each token `group.name` emits `--ca-token-<group>-<name>` plus two derived tokens:
//   -subtle     a tint of the token over whatever is behind (badge/row background)
//   -contrast   white or ink text that reads on the token itself (>= 4.5:1)

import { isCssColor, parseCssColor } from "../utils/css-color.js";
import { hexToOklch, onFill } from "../utils/palette-generator.js";

/**
 * One color: any CSS color (`#rrggbb`, `oklch(1 0 0 / 0.62)`, `color-mix(…)`, `rgb(…)`) or an
 * explicit alpha form that keeps the color and the opacity apart.
 */
export type ColorValue = string | { color: string; alpha: number };

/** One domain token: a single color for both schemes, or one per scheme (a missing side uses the other). */
export type TokenValue = string | { light?: string; dark?: string };

/**
 * Registry of domain tokens an app declares, for typed names. Augment it to get autocomplete in
 * `tokenRgba("status.new")`:
 *
 * ```ts
 * declare module "@codeatlasdev/ui" {
 *   interface CaTokenRegistry { "status.new": true; "status.won": true }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: extended by module augmentation
export interface CaTokenRegistry {}

/** Names declared through `CaTokenRegistry`, else any `group.name` string. */
export type CaTokenName = keyof CaTokenRegistry extends never
	? never
	: keyof CaTokenRegistry & string;

/** `group → name → value`. Group and name are CSS identifier fragments (`[a-z][a-z0-9-]*`). */
export type PresetTokenGroups = Record<string, Record<string, TokenValue>>;

const IDENT = /^[a-z][a-z0-9-]*$/i;

/** `--ca-token-status-new` for `("status", "new")`. */
export const tokenVar = (group: string, name: string) =>
	`--ca-token-${group}-${name}`.toLowerCase();

/** Throws unless `value` is one role color, and returns it as a declaration value. */
export function roleColor(preset: string, path: string, value: ColorValue): string {
	if (typeof value === "object" && value !== null) {
		const { color, alpha } = value;
		if (typeof color !== "string" || !isCssColor(color))
			throw new Error(
				`[codeatlasdev/ui] preset "${preset}": ${path}.color must be one CSS color, got ${JSON.stringify(color)}`
			);
		if (typeof alpha !== "number" || !(alpha >= 0 && alpha <= 1))
			throw new Error(
				`[codeatlasdev/ui] preset "${preset}": ${path}.alpha must be a number from 0 to 1, got ${JSON.stringify(alpha)}`
			);
		// The browser blends it, so any color works (hex, oklch, rgb, var()); the contrast check evaluates it.
		return `color-mix(in oklab, ${color.trim()} ${+(alpha * 100).toFixed(2)}%, transparent)`;
	}
	if (typeof value !== "string" || !isCssColor(value))
		throw new Error(
			`[codeatlasdev/ui] preset "${preset}": ${path} must be one CSS color, got ${JSON.stringify(value)}`
		);
	return value.trim();
}

/** White or ink, whichever reads at 4.5:1 on the token (judged as the opaque color it paints). */
function contrastOn(color: string): string | null {
	const p = parseCssColor(color);
	if (!p) return null;
	const hex = `#${p.rgb
		.map((v) =>
			Math.round(v * 255)
				.toString(16)
				.padStart(2, "0")
		)
		.join("")}`;
	const { l, c, h } = hexToOklch(hex);
	return onFill(l, c, h);
}

/**
 * Light and dark declaration maps for a preset's domain tokens, with derived `-subtle` and
 * `-contrast`. Names and values are validated: they land inside a declaration.
 */
export function domainTokens(
	preset: string,
	groups: PresetTokenGroups | undefined
): { light: Record<string, string>; dark: Record<string, string> } {
	const out = { light: {} as Record<string, string>, dark: {} as Record<string, string> };
	for (const [group, names] of Object.entries(groups ?? {})) {
		if (!IDENT.test(group))
			throw new Error(
				`[codeatlasdev/ui] preset "${preset}": tokens group "${group}" must match [a-z][a-z0-9-]*`
			);
		for (const [name, raw] of Object.entries(names)) {
			if (!IDENT.test(name))
				throw new Error(
					`[codeatlasdev/ui] preset "${preset}": tokens.${group} name "${name}" must match [a-z][a-z0-9-]*`
				);
			const sides = typeof raw === "string" ? { light: raw, dark: raw } : raw;
			const light = sides.light ?? sides.dark;
			const dark = sides.dark ?? sides.light;
			if (light === undefined || dark === undefined)
				throw new Error(
					`[codeatlasdev/ui] preset "${preset}": tokens.${group}.${name} needs a light or a dark value`
				);
			const v = tokenVar(group, name);
			for (const [scheme, value] of [
				["light", light],
				["dark", dark],
			] as const) {
				const color = roleColor(preset, `tokens.${group}.${name}.${scheme}`, value);
				out[scheme][v] = color;
				out[scheme][`${v}-subtle`] = `color-mix(in oklab, var(${v}) 16%, transparent)`;
				const text = contrastOn(color);
				if (text) out[scheme][`${v}-contrast`] = text;
			}
		}
	}
	return out;
}
