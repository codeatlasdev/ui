/**
 * `codeatlas-ui tokens import` (#383): turns the color tokens of an existing design system into a
 * typed `theme.ts`. Alpha is never silently dropped: a translucent token is composited over the
 * background of its own theme, listed in the report, and the result is measured (WCAG 4.5:1 for
 * text, 3:1 for outlines) so a flattened pair that no longer reads is named.
 *
 * Input: a CSS file (custom properties per selector: `:root`, `.dark`, `[data-theme="x"]`) or a
 * `tokens.json` of `{ theme: { token: color } }`. A Tailwind config is JavaScript: export its colors
 * to one of these two first.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { contrastRatio, oklchToHex } from "../lib/utils/palette-generator.ts";

export interface ParsedColor {
	hex: string;
	alpha: number;
}

const byte = (v: number) =>
	Math.round(Math.max(0, Math.min(255, v)))
		.toString(16)
		.padStart(2, "0");
const toHex = (r: number, g: number, b: number) => `#${byte(r)}${byte(g)}${byte(b)}`;
const num = (s: string) => (s.endsWith("%") ? Number.parseFloat(s) / 100 : Number.parseFloat(s));

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `hsl()` and `oklch()`, each with an optional alpha. Null for anything else. */
export function parseColor(input: string): ParsedColor | null {
	const v = input.trim().toLowerCase();
	const hex = v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
	if (hex) {
		const h = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
		const alpha = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
		return { hex: `#${h.slice(0, 6)}`, alpha };
	}
	const fn = v.match(/^(rgba?|hsla?|oklch)\(\s*([^)]*)\)$/);
	if (!fn) return null;
	const [body, alphaPart] = fn[2].split("/").map((s) => s.trim());
	const parts = body.split(/[\s,]+/).filter(Boolean);
	// The legacy comma form puts alpha as the 4th argument.
	const legacyAlpha = parts.length === 4 ? parts.pop() : undefined;
	const alphaText = alphaPart ?? legacyAlpha;
	const alpha = alphaText === undefined ? 1 : Math.max(0, Math.min(1, num(alphaText)));
	if (parts.length !== 3 || parts.some((p) => Number.isNaN(Number.parseFloat(p)))) return null;
	if (fn[1].startsWith("rgb")) {
		const ch = parts.map((p) =>
			p.endsWith("%") ? (Number.parseFloat(p) / 100) * 255 : Number.parseFloat(p)
		);
		return { hex: toHex(ch[0], ch[1], ch[2]), alpha };
	}
	if (fn[1].startsWith("hsl")) {
		const h = (((Number.parseFloat(parts[0]) % 360) + 360) % 360) / 360;
		const s = num(parts[1].endsWith("%") ? parts[1] : `${parts[1]}%`);
		const l = num(parts[2].endsWith("%") ? parts[2] : `${parts[2]}%`);
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		const chan = (t0: number) => {
			const t = (t0 + 1) % 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		return { hex: toHex(chan(h + 1 / 3) * 255, chan(h) * 255, chan(h - 1 / 3) * 255), alpha };
	}
	const [l, c, h] = parts.map((p) => num(p));
	return { hex: oklchToHex(`oklch(${l} ${c} ${h})`), alpha };
}

/** Roles of `SchemeColors` this importer fills, with the shadcn token that usually carries each. */
export const SHADCN_MAP: Record<string, string> = {
	background: "--background",
	text: "--foreground",
	surface: "--card",
	overlay: "--popover",
	sunken: "--muted",
	textSecondary: "--muted-foreground",
	border: "--border",
	brandFill: "--primary",
	brandContrast: "--primary-foreground",
	error: "--destructive",
};

export type RoleMap = Record<string, string>;

/** Composite `fg` (with `alpha`) over opaque `bg`, in encoded sRGB like a browser. */
function flatten(fg: string, alpha: number, bg: string): string {
	const ch = (hex: string, i: number) => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
	return toHex(
		ch(fg, 0) * alpha + ch(bg, 0) * (1 - alpha),
		ch(fg, 1) * alpha + ch(bg, 1) * (1 - alpha),
		ch(fg, 2) * alpha + ch(bg, 2) * (1 - alpha)
	);
}

export interface ImportedTheme {
	name: string;
	colors: Record<string, string>;
}
export interface Flattened {
	theme: string;
	role: string;
	alpha: number;
	over: "background";
	hex: string;
}
export interface ContrastCheck {
	theme: string;
	pair: string;
	ratio: number;
	min: number;
	pass: boolean;
}
export interface ImportResult {
	themes: ImportedTheme[];
	flattened: Flattened[];
	contrast: ContrastCheck[];
	missing: { theme: string; role: string; token: string }[];
	unresolved: { theme: string; role: string; token: string; value: string }[];
	radius?: number;
	source: string;
}

/** Pairs measured after flattening: text roles need 4.5:1 on the background, outlines 3:1. */
const PAIRS: { role: string; on: string; min: number }[] = [
	{ role: "text", on: "background", min: 4.5 },
	{ role: "textSecondary", on: "background", min: 4.5 },
	{ role: "text", on: "surface", min: 4.5 },
	{ role: "brandContrast", on: "brandFill", min: 4.5 },
	{ role: "border", on: "background", min: 3 },
];

/** `theme -> { token -> raw value }` from custom properties per selector, or from a tokens.json. */
function readTokens(source: string, format: "css" | "json"): Map<string, Record<string, string>> {
	const themes = new Map<string, Record<string, string>>();
	if (format === "json") {
		const data: unknown = JSON.parse(source);
		if (!data || typeof data !== "object")
			throw new Error("tokens.json must be { theme: { token: color } }");
		for (const [name, tokens] of Object.entries(data))
			if (tokens && typeof tokens === "object")
				themes.set(
					name,
					Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, String(v)]))
				);
		return themes;
	}
	const bare = source.replace(/\/\*[\s\S]*?\*\//g, "");
	for (const rule of bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const decls = Object.fromEntries(
			[...rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)].map((m) => [m[1], m[2].trim()])
		);
		if (!Object.keys(decls).length) continue;
		// `[data-theme="paper"]` -> paper; `.dark` -> dark; `:root` -> root. A group of selectors keeps its first name.
		const sel = rule[1].split(",").map((s) => s.trim());
		const named = sel.find((s) => /\[data-theme=|^\.[\w-]+$/.test(s)) ?? sel[0];
		const name = named.match(/data-theme=["']?([\w-]+)/)?.[1] ?? named.replace(/^[.:]/, "");
		themes.set(name, { ...themes.get(name), ...decls });
	}
	return themes;
}

export function importTokens(
	source: string,
	{ map = SHADCN_MAP, format = "css" }: { map?: RoleMap; format?: "css" | "json" } = {}
): ImportResult {
	const raw = readTokens(source, format);
	const themes: ImportedTheme[] = [];
	const result: ImportResult = {
		themes,
		flattened: [],
		contrast: [],
		missing: [],
		unresolved: [],
		source: "",
	};
	let radius: number | undefined;
	for (const [name, tokens] of raw) {
		const colors: Record<string, string> = {};
		const translucent: { role: string; token: string; value: string; color: ParsedColor }[] = [];
		for (const [role, token] of Object.entries(map)) {
			const value = tokens[token];
			if (value === undefined) {
				result.missing.push({ theme: name, role, token });
				continue;
			}
			const color = parseColor(value);
			if (!color) result.unresolved.push({ theme: name, role, token, value });
			else if (color.alpha < 1) translucent.push({ role, token, value, color });
			else colors[role] = color.hex;
		}
		for (const t of translucent) {
			// A translucent color means "over whatever is behind it": the theme's background is the only honest answer.
			if (!colors.background) {
				result.unresolved.push({ theme: name, role: t.role, token: t.token, value: t.value });
				continue;
			}
			const hex = flatten(t.color.hex, t.color.alpha, colors.background);
			colors[t.role] = hex;
			result.flattened.push({
				theme: name,
				role: t.role,
				alpha: t.color.alpha,
				over: "background",
				hex,
			});
		}
		for (const p of PAIRS) {
			const [a, b] = [colors[p.role], colors[p.on]];
			const ratio = a && b ? contrastRatio(a, b) : null;
			if (ratio === null) continue;
			const rounded = Math.round(ratio * 100) / 100;
			result.contrast.push({
				theme: name,
				pair: `${p.role} on ${p.on}`,
				ratio: rounded,
				min: p.min,
				pass: rounded >= p.min,
			});
		}
		const r = tokens["--radius"]?.match(/([\d.]+)(rem|px)/);
		if (r && radius === undefined)
			radius = (Number.parseFloat(r[1]) * (r[2] === "rem" ? 16 : 1)) / 10;
		themes.push({ name, colors });
	}
	result.radius = radius;
	result.source = themeSource(themes, radius);
	return result;
}

const ROLE_ORDER = [
	"brandFill",
	"brandContrast",
	"background",
	"sunken",
	"surface",
	"overlay",
	"text",
	"textSecondary",
	"border",
	"error",
];

/** `theme.ts` text: each imported theme is a preset; the brand color generates the ramp, the roles pin the rest. */
function themeSource(themes: ImportedTheme[], radius: number | undefined): string {
	const q = (s: string) => JSON.stringify(s);
	const presets = themes.map((t) => {
		const colors = ROLE_ORDER.filter((r) => t.colors[r])
			.map((r) => `${r}: ${q(t.colors[r])}`)
			.join(", ");
		const brand = t.colors.brandFill ?? "#2563eb";
		const dark = Number.parseInt(t.colors.background?.slice(1, 3) ?? "ff", 16) < 128;
		return `\t\t{ id: ${q(t.name)}, color: ${q(brand)}, colors: { ${dark ? "dark" : "light"}: { ${colors} } } },`;
	});
	const first = themes[0];
	const scheme =
		Number.parseInt(first?.colors.background?.slice(1, 3) ?? "00", 16) < 128 ? "dark" : "light";
	return [
		'import type { ThemeOptions } from "@codeatlasdev/ui/vite";',
		"",
		"export const theme: ThemeOptions = {",
		"\tpresets: [",
		...presets,
		"\t],",
		`\tdefaultPreset: ${q(first?.name ?? "app")},`,
		`\tdefaultScheme: ${q(scheme)},`,
		...(radius === undefined ? [] : [`\tradius: ${Math.round(radius * 100) / 100},`]),
		"};",
		"",
	].join("\n");
}

export interface TokensImportOptions {
	map?: string;
	out?: string;
	force?: boolean;
	strict?: boolean;
	cwd?: string;
	log?: (line: string) => void;
}

/** CLI body: 0, or 1 when `--out` exists without `--force`, or with `strict` while a pair is under its threshold. */
export function runTokensImport(
	input: string,
	{
		map,
		out,
		force = false,
		strict = false,
		cwd = process.cwd(),
		log = console.log,
	}: TokensImportOptions = {}
): number {
	const file = resolve(cwd, input);
	if (!existsSync(file)) {
		log(`tokens import: ${input} not found`);
		return 1;
	}
	const roleMap: RoleMap = map ? JSON.parse(readFileSync(resolve(cwd, map), "utf8")) : SHADCN_MAP;
	const result = importTokens(readFileSync(file, "utf8"), {
		map: roleMap,
		format: file.endsWith(".json") ? "json" : "css",
	});
	if (!map)
		log("no --map: using the shadcn token names (--background, --foreground, --primary, ...)");
	for (const f of result.flattened)
		log(`flattened ${f.theme} ${f.role}: alpha ${f.alpha} over ${f.over} -> ${f.hex}`);
	for (const m of result.missing) log(`missing ${m.theme} ${m.role}: no ${m.token}`);
	for (const u of result.unresolved)
		log(`unresolved ${u.theme} ${u.role}: ${u.token} is ${u.value}`);
	const low = result.contrast.filter((c) => !c.pass);
	for (const c of low) log(`${c.theme} ${c.pair}: ${c.ratio}:1, below ${c.min}:1`);
	log(
		`${result.themes.length} theme${result.themes.length === 1 ? "" : "s"}, ${result.flattened.length} flattened, ${low.length} pair${low.length === 1 ? "" : "s"} under the threshold.`
	);
	if (out) {
		const dest = resolve(cwd, out);
		if (existsSync(dest) && !force) {
			log(`${relative(cwd, dest)} exists: pass --force to overwrite it`);
			return 1;
		}
		writeFileSync(dest, result.source);
		log(`wrote ${relative(cwd, dest)}`);
	}
	return strict && low.length ? 1 : 0;
}
