/** The override surface of a component, read from its CSS: parts, scoped variables, data attributes, tokens. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIB } from "./paths.ts";

export interface ManifestPart {
	/** Class name without the dot, or a `@keyframes` name. */
	name: string;
	/** `false`: private (`ca-x-` prefix, `@keyframes`); it can be renamed in any release. */
	stable: boolean;
}

export interface ManifestDataAttribute {
	name: string;
	/** Values the component CSS selects on (`[data-size='sm']`); empty when only its presence matters. */
	values: string[];
}

export interface ManifestStyling {
	parts: ManifestPart[];
	/** Component-scoped `--ca-*` custom properties (not global tokens): set on the element to restyle one axis. */
	variables: string[];
	/** `data-*` attributes the component CSS selects on. */
	data: ManifestDataAttribute[];
}

/** CSS text of a component: its `<style>` blocks plus every local `.css` it imports. */
export function componentCss(src: string, dir: string): string {
	const css = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
	for (const m of src.matchAll(/import\s+['"](\.[^'"]+\.css)['"]/g)) {
		const file = join(dir, m[1]);
		if (existsSync(file)) css.push(readFileSync(file, "utf8"));
	}
	return css.join("\n");
}

/** Public `ca-*` class names a component's own CSS defines (descendant `:global()` targets owned elsewhere are skipped). */
export function extractClasses(css: string): string[] {
	const classes = new Set<string>();
	for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g))
		for (const part of rule[1].split(",")) {
			// A selector that starts with `:global(` (or `:global .x`) is the component's own global class.
			const sel = part.trim();
			const owned = sel.startsWith(":global") ? sel : sel.replace(/:global\([^)]*\)/g, "");
			for (const c of owned.matchAll(/\.(ca-[A-Za-z0-9_-]+)/g)) classes.add(c[1]);
		}
	return [...classes].sort();
}

/** A private class: `ca-x-` prefix, so a reader sees it is not a hook (naming rule, #381). */
const INTERNAL_CLASS = /^ca-x-/;

/** Every `--ca-*` the global stylesheets declare: these are tokens, documented in tokens.json. */
let tokenNames: Set<string> | undefined;
export function globalTokens(): Set<string> {
	if (tokenNames) return tokenNames;
	tokenNames = new Set();
	const walk = (dir: string) => {
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			if (e.isDirectory()) walk(join(dir, e.name));
			else if (e.name.endsWith(".css"))
				for (const m of readFileSync(join(dir, e.name), "utf8").matchAll(/(--ca-[\w-]+)\s*:/g))
					tokenNames?.add(m[1]);
		}
	};
	walk(join(LIB, "styles"));
	return tokenNames;
}

/** `data-*` hooks a component CSS selects on, with the values it styles (`[data-size='sm']`). */
export function extractDataAttributes(css: string): ManifestDataAttribute[] {
	const found = new Map<string, Set<string>>();
	for (const m of css
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.matchAll(/\[(data-[a-z][a-z0-9-]*)(?:[~|^$*]?=(?:'([^']*)'|"([^"]*)"|([^\]\s]+)))?\s*\]/g)) {
		const values = found.get(m[1]) ?? new Set<string>();
		const v = m[2] ?? m[3] ?? m[4];
		if (v !== undefined) values.add(v);
		found.set(m[1], values);
	}
	return [...found]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, values]) => ({ name, values: [...values].sort() }));
}

/**
 * The override surface of a component: classes (stable unless `ca-x-` or a `@keyframes` name), the
 * component-scoped custom properties it declares or reads (`tokens` are excluded: they live in tokens.json)
 * and the `data-*` attributes its CSS selects on.
 */
export function extractStyling(
	css: string,
	_source: string,
	tokens = new Set<string>()
): ManifestStyling {
	const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const keyframes = [...bare.matchAll(/@keyframes\s+(ca-[A-Za-z0-9_-]+)/g)].map((m) => m[1]);
	const names = new Set([...extractClasses(css), ...keyframes]);
	// Plain code-unit order, like `extractClasses`: `classes` (the stable subset) keeps its historical order.
	const parts = [...names]
		.sort()
		.map((name) => ({ name, stable: !INTERNAL_CLASS.test(name) && !keyframes.includes(name) }));
	const variables = [
		...new Set(
			[...bare.matchAll(/(--ca-[\w-]+)\s*:|var\(\s*(--ca-[\w-]+)/g)]
				.map((m) => m[1] ?? m[2])
				.filter((v) => !tokens.has(v))
		),
	].sort();
	return { parts, variables, data: extractDataAttributes(css) };
}

/**
 * Component tokens of a component's own CSS: `var(--ca-<stem>-…, fallback)` reads, where `<stem>` is
 * the stem of one of its classes (`ca-icon-btn--sm` → `icon-btn`). The fallback marks an override
 * hook: a token read without one is a global token owned elsewhere (`--ca-space-3`).
 */
export function extractComponentTokens(css: string, classes: string[]): string[] {
	const stems = new Set(classes.map((c) => c.slice(3).split(/--|__/)[0]));
	const tokens = new Set<string>();
	for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/var\((--ca-([a-z0-9-]+?))\s*,/g))
		if ([...stems].some((s) => m[2] === s || m[2].startsWith(`${s}-`))) tokens.add(m[1]);
	return [...tokens].sort();
}
