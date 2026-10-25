/** Design tokens (`--ca-*` custom properties) and surface styles (`[data-style]` blocks of materials.css). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STYLES, type SurfaceStyle } from "../../src/lib/theme/define.ts";
import { DESIGN_STYLES } from "../../src/lib/theme/styles.ts";
import { LIB } from "./paths.ts";

// ── tokens ────────────────────────────────────────────────────────────────────

export interface ManifestToken {
	name: string;
	/** Value in `:root` (light / default). */
	value: string;
	/** Value under `.dark`, when it differs. */
	dark?: string;
	/** Where it is defined: `tokens.css` or `presets/<id>.css`. */
	source: string;
	/** Nearest preceding section comment, e.g. "Spacing scale". */
	group?: string;
	/** Comment immediately above the declaration: what the token is for and its guarantees. */
	description?: string;
}

/** `── Spacing scale (base 4 px) ──` section dividers inside CSS comments. */
const SECTION = /^\s*──\s*([^─(\n*]+?)\s*(?:\(|─|\*|$)/m;

/** Parse `--ca-*: value;` declarations per rule, keeping `:root` and `.dark` values apart. */
export function extractTokens(css: string, source: string, out: Map<string, ManifestToken>) {
	let group: string | undefined;
	for (const rule of css.matchAll(/(?:\/\*[\s\S]*?\*\/\s*)*([^{}/]+)\{([^{}]*)\}/g)) {
		const selector = rule[1].trim();
		// `.dark` rules (also `.dark[data-preset=..]`, `.dark [data-preset=..]`) fill the dark value.
		const isDark = /\.dark\b|data-theme-scope="dark"/.test(selector);
		// Walk the body so section comments between declarations update `group` in order.
		let note: string | undefined;
		for (const t of rule[2].matchAll(/\/\*([\s\S]*?)\*\/|(--ca-[\w-]+)\s*:\s*([^;]+);/g)) {
			if (t[1] !== undefined) {
				const section = t[1].match(SECTION)?.[1];
				if (section) group = section;
				// A prose comment (not a `── Section ──` divider) documents the declaration right below it.
				else note = t[1].replace(/\s*\n\s*\*?\s*/g, " ").trim() || undefined;
				continue;
			}
			const description = note;
			note = undefined;
			const name = t[2];
			const value = t[3]
				.trim()
				.replace(/\s+/g, " ")
				.replace(/\s*\/\*[\s\S]*?\*\//g, "");
			const prev = out.get(name);
			if (!prev) {
				const t0: ManifestToken = isDark
					? { name, value: "", dark: value, source, group }
					: { name, value, source, group };
				if (description) t0.description = description;
				out.set(name, t0);
			} else {
				if (isDark) prev.dark ??= value;
				else if (prev.value === "") prev.value = value;
				if (description) prev.description ??= description;
			}
		}
	}
}

export function buildTokens(): ManifestToken[] {
	const out = new Map<string, ManifestToken>();
	const styles = join(LIB, "styles");
	extractTokens(readFileSync(join(styles, "tokens.css"), "utf8"), "tokens.css", out);
	// Built-ins repeat the same names per preset; the amber file (`:root` default) is the canonical value.
	const presets = join(styles, "presets");
	extractTokens(readFileSync(join(presets, "amber.css"), "utf8"), "presets/amber.css", out);
	return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ── surfaces ──────────────────────────────────────────────────────────────────

export interface ManifestSurface {
	/** Value of `<html data-style>` (and `colorScheme.setStyle`). */
	id: SurfaceStyle;
	/** The comment above the `[data-style="id"]` block in materials.css. */
	description?: string;
	/**
	 * What the style does to every `--ca-blur-*` token: `full` leaves the `:root` glass blur,
	 * `reduced` rewrites it to a lighter blur, `none` turns it off (opaque surfaces).
	 */
	blur: "full" | "reduced" | "none";
	/** Every custom property the `[data-style]` blocks of this id rewrite, in first-seen order. */
	tokens: string[];
	/** The package default (`defineTheme` without `defaultStyle`). */
	packageDefault: boolean;
	/** Design recipes (`designStyle(id)`) whose `defaultStyle` is this one. */
	recipes: string[];
}

/** `[data-style="x"]` selectors of a rule, with or without a `.dark`/`html` prefix. */
const STYLE_SELECTOR = /\[data-style="([a-z]+)"\]/g;
const BLUR_TOKEN = /^--ca-(?:blur-[a-z-]+|(?:overlay|panel|chrome|upload)-blur)$/;

/** Read the surface styles out of `[data-style]` rules: blur behaviour, rewritten tokens, description. */
export function extractSurfaces(
	css: string
): Pick<ManifestSurface, "id" | "description" | "blur" | "tokens">[] {
	const acc = new Map<
		string,
		{ description?: string; own?: boolean; tokens: Map<string, string> }
	>();
	for (const rule of css.matchAll(/((?:\/\*[\s\S]*?\*\/\s*)*)([^{}/]+)\{([^{}]*)\}/g)) {
		const ids = [...rule[2].matchAll(STYLE_SELECTOR)].map((m) => m[1]);
		if (!ids.length) continue;
		// The nearest comment above the block: `── Solid — opaque, no blur ── ` → "Solid — opaque, no blur".
		const note = [...rule[1].matchAll(/\/\*([\s\S]*?)\*\//g)].pop()?.[1];
		const description = note
			?.replace(/^[\s*─-]*|[\s*─-]*$/g, "")
			.replace(/\s*\n\s*\*?\s*/g, " ")
			.replace(/\s*─+.*$/, "")
			.trim();
		const decls = [...rule[3].matchAll(/(--ca-[\w-]+)\s*:\s*([^;]+);/g)];
		for (const id of ids) {
			const cur = acc.get(id) ?? { tokens: new Map<string, string>() };
			// A style's own block comment beats the comment of a grouped rule that lists it with others.
			if (description && (cur.description === undefined || (ids.length === 1 && !cur.own))) {
				cur.description = description;
				cur.own = ids.length === 1;
			}
			for (const d of decls) if (!cur.tokens.has(d[1])) cur.tokens.set(d[1], d[2].trim());
			acc.set(id, cur);
		}
	}
	return [...acc].map(([id, v]) => {
		const blurs = [...v.tokens].filter(([name]) => BLUR_TOKEN.test(name));
		const blur = !blurs.length
			? "full"
			: blurs.every(([, value]) => value === "none")
				? "none"
				: "reduced";
		return {
			id: id as SurfaceStyle,
			description: v.description,
			blur,
			tokens: [...v.tokens.keys()],
		};
	});
}

/** Styles with no `[data-style]` block: glass is the `:root` token set every other style rewrites (it is opt-in; the package default is solid). */
const GLASS_DESCRIPTION: Partial<Record<SurfaceStyle, string>> = {
	glass:
		"Glass (opt-in): the :root tokens untouched, full blur, translucent tints, glow and rim (the look of the liquid recipe)",
};

/**
 * Every surface style, from `materials.css`: the `[data-style]` blocks give the blur and the tokens,
 * `STYLES` gives the valid ids (glass is the `:root` set, it has no block), `DESIGN_STYLES` the recipes.
 */
export function buildSurfaces(): ManifestSurface[] {
	const found = new Map(
		extractSurfaces(readFileSync(join(LIB, "styles/materials.css"), "utf8")).map((s) => [s.id, s])
	);
	return STYLES.map((id) => {
		const f = found.get(id);
		const description = f?.description ?? GLASS_DESCRIPTION[id];
		return {
			id,
			...(description ? { description } : {}),
			blur: f?.blur ?? "full",
			tokens: f?.tokens ?? [],
			packageDefault: id === "solid",
			recipes: Object.values(DESIGN_STYLES)
				.filter((d) => (d.theme.defaultStyle ?? "solid") === id)
				.map((d) => d.id),
		};
	});
}
