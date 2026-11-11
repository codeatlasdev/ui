/**
 * `codeatlas-ui lint` (#383): the UI guard an app runs next to its linter. Biome and ESLint do not
 * read what a Svelte template renders, so these rules read the markup and the style blocks:
 *
 *   hex            a literal `#rrggbb` color: use a `--ca-*` token
 *   px             a raw `Npx` size (0 and 1px hairlines excepted): use a `--ca-space-*` / radius token
 *   inline-style   a `style=""` that sets anything but a custom property
 *   global-ca      `:global(.ca-*)` outside the allow-list: use a documented part, variable or data attribute
 *   i18n-literal   visible text in a `.svelte`/`.astro` template: read it from your messages
 *   layout-css     padding, margin or gap in rem/em off the spacing scale: use --ca-space-* (#920)
 *   breakpoint     a @media width off the 600 / 900 / 1200 / 1536 scale (a @container may use any)
 *   vh-offset      calc(var(--ca-vh) - <length>): a magic offset; use the shell's inset tokens
 *   fixed-width-row a growing (flex: 1) nowrap item without min-width: 0, so it cannot shrink
 *   nested-surface a Card or Surface directly inside another: one frame per group
 *
 * The layout rules follow /docs/getting-started/layout-principles/.
 * A `ca-ui-workaround(#n)` marker on the line or the one above excuses it. Exit 1 on any finding.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse } from "svelte/compiler";

export const GUARD_RULES = [
	"hex",
	"px",
	"inline-style",
	"global-ca",
	"i18n-literal",
	"layout-css",
	"breakpoint",
	"vh-offset",
	"fixed-width-row",
	"nested-surface",
] as const;
export type GuardRule = (typeof GUARD_RULES)[number];

export interface GuardViolation {
	file: string;
	line: number;
	rule: GuardRule;
	message: string;
}

export interface GuardOptions {
	/** Files (relative to cwd) where `:global(.ca-*)` is allowed: the app's one override sheet. */
	allow?: string[];
	/** Only these rules (default: all). */
	rules?: readonly GuardRule[];
}

const MARKER = /ca-ui-workaround\(#\d+\)/;
const lineOf = (s: string, i: number) => s.slice(0, i).split("\n").length;
/** Blank comments but keep newlines, so offsets and line numbers stay those of the file. */
const blank = (s: string) =>
	s.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " "));

/** Regions of a file that hold CSS: the whole `.css` file, or the `<style>` blocks of a component. */
function cssRegions(file: string, src: string): { text: string; offset: number }[] {
	if (file.endsWith(".css")) return [{ text: src, offset: 0 }];
	return [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
		text: m[1] ?? "",
		offset: (m.index ?? 0) + m[0].indexOf(">") + 1,
	}));
}

/** Text a template renders: words, not code, numbers or symbols. */
const HAS_WORDS = /\p{L}{2,}/u;
/** Attributes whose string value is shown to people. */
const TEXT_ATTRS: Record<string, true> = {
	label: true,
	title: true,
	placeholder: true,
	description: true,
	alt: true,
	"aria-label": true,
	helperText: true,
	emptyText: true,
	confirmLabel: true,
	cancelLabel: true,
};

interface TemplateNode {
	type: string;
	start: number;
	end: number;
	data?: string;
	name?: string;
	attributes?: { type: string; name?: string; start: number; value?: unknown }[];
	[key: string]: unknown;
}

function templateText(src: string): { index: number; text: string }[] {
	const out: { index: number; text: string }[] = [];
	const ast = parse(src, { modern: true });
	const walk = (node: unknown, inScript: boolean) => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			for (const n of node) walk(n, inScript);
			return;
		}
		const n = node as TemplateNode;
		if (n.type === "Text" && n.data && HAS_WORDS.test(n.data))
			out.push({ index: n.start, text: n.data.trim() });
		if (n.type === "RegularElement" || n.type === "Component")
			for (const a of n.attributes ?? []) {
				if (a.type !== "Attribute" || !a.name || !(a.name in TEXT_ATTRS)) continue;
				const v = a.value;
				const nodes = Array.isArray(v) ? v : [];
				// A plain string attribute is `[Text]`; `label={t.save}` is an ExpressionTag and is fine.
				if (nodes.length === 1 && nodes[0].type === "Text" && HAS_WORDS.test(nodes[0].data ?? ""))
					out.push({ index: a.start, text: nodes[0].data });
			}
		for (const key of Object.keys(n)) {
			if (key === "parent" || key === "expression" || key === "attributes") continue;
			const v = n[key];
			if (v && typeof v === "object") walk(v, inScript);
		}
	};
	walk(ast.fragment, false);
	return out;
}

export function guardSource(
	file: string,
	src: string,
	{ allow = [], rules }: GuardOptions = {}
): GuardViolation[] {
	const out: GuardViolation[] = [];
	const lines = src.split("\n");
	const excused = (line: number) =>
		[lines[line - 1], lines[line - 2]].some((l) => l !== undefined && MARKER.test(l));
	const add = (index: number, rule: GuardRule, message: string) => {
		if (rules && !rules.includes(rule)) return;
		const line = lineOf(src, index);
		if (!excused(line)) out.push({ file, line, rule, message });
	};

	const bare = blank(src);
	for (const { text, offset } of cssRegions(file, bare)) {
		for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g))
			add(offset + (m.index ?? 0), "hex", "literal color: use a --ca-* token");
		// A declaration value only: not a media query, and not the fallback inside var(--x, 12px).
		// At-rule preludes (`@media (min-width: 900px)`) are conditions, not sizes: blank them, keep offsets.
		const values = text.replace(/@(?:media|container|supports)[^{]*/g, (c) => " ".repeat(c.length));
		for (const decl of values.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]?/g)) {
			if (decl[1].startsWith("--")) continue;
			const value = decl[2].replace(/var\([^)]*\)/g, "");
			const px = value
				.match(/(?<![\w.-])(\d*\.?\d+)px\b/g)
				?.filter((p) => p !== "0px" && p !== "1px");
			if (px?.length)
				add(
					offset + (decl.index ?? 0),
					"px",
					`raw size ${px[0]}: use a --ca-space-* or radius token`
				);
		}
		// The scale (600 / 900 / 1200 / 1536); max-width sits 0.02px below a step so both sides never
		// match at the exact width (#916): `max-width: 899.98px`, `min-width: 900px`.
		const scale = [600, 900, 1200, 1536];
		for (const m of text.matchAll(/@media[^{]*?\((max|min)-width:\s*([0-9.]+)px\)/g)) {
			const w = Number(m[2]);
			const ok =
				m[1] === "max" ? scale.some((s) => Math.abs(w - (s - 0.02)) < 0.001) : scale.includes(w);
			if (ok) continue;
			const near = scale.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
			const fix = m[1] === "max" ? `${near - 0.02}px` : `${near}px`;
			add(
				offset + (m.index ?? 0),
				"breakpoint",
				`@media ${m[1]}-width ${m[2]}px: use ${m[1]}-width ${fix} (the 600 / 900 / 1200 / 1536 scale, max-width 0.02px below), or @container`
			);
		}
		for (const decl of values.matchAll(
			/(padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?\s*:\s*([^;{}]+)[;}]?/g
		)) {
			const value = decl[2].replace(/var\([^)]*\)/g, "");
			if (/(?<![\w.-])\d*\.?\d+(rem|em)\b/.test(value))
				add(
					offset + (decl.index ?? 0),
					"layout-css",
					`${decl[1]} off the spacing scale: use --ca-space-*`
				);
		}
		for (const m of text.matchAll(/calc\(\s*var\(--ca-vh\)\s*-\s*[\d.]+(?:rem|px|em)/g))
			add(
				offset + (m.index ?? 0),
				"vh-offset",
				"magic offset from the viewport height: use the shell inset tokens (--ca-shell-inset-*)"
			);
		for (const block of text.matchAll(/\{([^{}]*)\}/g)) {
			const body = block[1] ?? "";
			if (
				/white-space\s*:\s*nowrap/.test(body) &&
				/flex\s*:\s*1\b|flex-grow\s*:\s*[1-9]/.test(body) &&
				!/min-width\s*:\s*0/.test(body)
			)
				add(
					offset + (block.index ?? 0),
					"fixed-width-row",
					"a growing nowrap item needs min-width: 0 (and an ellipsis) to shrink"
				);
		}
		for (const m of text.matchAll(/:global\(\s*\.ca-[\w-]+/g))
			if (!allow.includes(file))
				add(
					offset + (m.index ?? 0),
					"global-ca",
					"targets a .ca-* class outside the allow-list: use a documented part, variable or data attribute"
				);
	}

	if (/\.(svelte|astro)$/.test(file)) {
		const markup = bare.replace(/<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/g, (c) =>
			c.replace(/[^\n]/g, " ")
		);
		for (const m of markup.matchAll(/\sstyle=("([^"]*)"|'([^']*)')/g)) {
			const value = m[2] ?? m[3] ?? "";
			// Dynamic custom properties are the one allowed use: `style="--bar-w:{pct}%"`.
			const props = value
				.split(";")
				.map((p) => p.trim())
				.filter(Boolean);
			if (props.some((p) => !p.startsWith("--")))
				add(
					m.index ?? 0,
					"inline-style",
					"inline style: use a class with tokens (only --custom-properties may be inline)"
				);
		}
	}
	if (/\.(svelte|astro)$/.test(file)) {
		const markup = bare.replace(/<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/g, (c) =>
			c.replace(/[^\n]/g, " ")
		);
		for (const m of markup.matchAll(/<(?:Card|Surface)\b[^>]*>\s*(<(?:Card|Surface)\b)/g))
			add(
				(m.index ?? 0) + m[0].lastIndexOf(m[1] ?? "<"),
				"nested-surface",
				"a surface directly inside another: separate with a divider or spacing, one frame per group"
			);
	}
	if (file.endsWith(".svelte"))
		try {
			for (const t of templateText(src))
				add(
					t.index,
					"i18n-literal",
					`visible text "${t.text.slice(0, 30)}": read it from your messages`
				);
		} catch {
			// A file svelte cannot parse is the compiler's error to report, not the guard's.
		}
	return out;
}

const SOURCE = /\.(svelte|astro|css)$/;
function collect(path: string): string[] {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? collect(join(path, e.name))
				: SOURCE.test(e.name)
					? [join(path, e.name)]
					: []
	);
}

export interface RunGuardOptions extends GuardOptions {
	cwd?: string;
	log?: (line: string) => void;
}

/** 0 on a clean tree, 1 when any rule fired. */
export function runGuard(
	targets: string[],
	{ cwd = process.cwd(), log = console.log, allow = [], rules }: RunGuardOptions = {}
): number {
	const files = [...new Set(targets.flatMap((t) => collect(resolve(cwd, t))))];
	let count = 0;
	for (const file of files) {
		const rel = relative(cwd, file);
		for (const v of guardSource(rel, readFileSync(file, "utf8"), { allow, rules })) {
			log(`${v.file}:${v.line} ${v.rule} ${v.message}`);
			count++;
		}
	}
	log(count ? `\n${count} finding${count === 1 ? "" : "s"}.` : "ui guard: clean.");
	return count ? 1 : 0;
}
