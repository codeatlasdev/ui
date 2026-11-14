/**
 * `codeatlas-ui lint` (#383): the UI guard an app runs next to its linter. Biome and ESLint do not
 * read what a Svelte template renders, so these rules read the markup and the style blocks:
 *
 *   hex            a literal `#rrggbb` color: use a `--ca-*` token
 *   px             a raw `Npx` size (0 and 1px hairlines excepted): use a `--ca-space-*` / radius token
 *   inline-style   a `style=""` that sets anything but a custom property
 *   global-ca      `:global(.ca-*)` outside the allow-list: use a documented part, variable or data attribute
 *   i18n-literal   visible text in a `.svelte`/`.astro` template: read it from your messages
 *   forbidden-term a word the app bans (`forbiddenTerms` in ui-guard.config.json) in the visible text
 *                  of a `.svelte` template: whole word, any case unless `caseSensitive` (#1156)
 *   layout-css     padding, margin or gap in rem/em off the spacing scale: use --ca-space-* (#920)
 *   breakpoint     a @media width off the 600 / 900 / 1200 / 1536 scale (a @container may use any)
 *   vh-offset      calc(var(--ca-vh) - <length>): a magic offset; use the shell's inset tokens
 *   fixed-width-row a growing (flex: 1) nowrap item without min-width: 0, so it cannot shrink
 *   nested-surface a Card or Surface directly inside another: one frame per group
 *
 * The layout rules follow /docs/getting-started/layout-principles/.
 * A `ca-ui-workaround(#n)` (or `ca-ui-workaround(pending: reason)`) marker on the line or the one above excuses it. Exit 1 on any finding.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "svelte/compiler";
import { BREAKPOINTS } from "../lib/components/Layout/layout.ts";
import { WORKAROUND_MARKER } from "./markers.ts";
import { relPosix } from "./paths.ts";

export const GUARD_RULES = [
	"hex",
	"px",
	"inline-style",
	"global-ca",
	"i18n-literal",
	"forbidden-term",
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

/** A word or phrase the app's copy must not use, with the one to write instead (#1156). */
export interface ForbiddenTermEntry {
	term: string;
	/** Shown in the message: the word to write instead. */
	use?: string;
	/** Match only the case written here (default: any case). */
	caseSensitive?: boolean;
}
export type ForbiddenTerm = string | ForbiddenTermEntry;

export interface GuardOptions {
	/** Files (relative to cwd) where `:global(.ca-*)` is allowed: the app's one override sheet. */
	allow?: string[];
	/** Words the visible text of a template must not contain (`forbidden-term`). */
	forbiddenTerms?: readonly ForbiddenTerm[];
	/** Only these rules (default: all). */
	rules?: readonly GuardRule[];
}

export interface GuardConfig {
	allow: string[];
	forbiddenTerms: ForbiddenTerm[];
}

const TERM_KEYS = new Set(["term", "use", "caseSensitive"]);

/**
 * Reads `ui-guard.config.json` (an absent file is an empty config). Throws naming the file and the
 * index of a `forbiddenTerms` entry that is not a word or `{ term, use?, caseSensitive? }`, so a
 * typo such as `{ "replace": … }` stops the run instead of silently checking nothing.
 */
export function loadGuardConfig(file: string): GuardConfig {
	if (!existsSync(file)) return { allow: [], forbiddenTerms: [] };
	const raw = JSON.parse(readFileSync(file, "utf8")) as {
		allow?: string[];
		forbiddenTerms?: unknown;
	};
	const terms = raw.forbiddenTerms ?? [];
	const name = "ui-guard.config.json";
	if (!Array.isArray(terms)) throw new Error(`${name}: forbiddenTerms must be an array`);
	terms.forEach((t, i) => {
		const ok =
			typeof t === "string"
				? t.trim() !== ""
				: t !== null &&
					typeof t === "object" &&
					typeof t.term === "string" &&
					t.term.trim() !== "" &&
					(t.use === undefined || typeof t.use === "string") &&
					(t.caseSensitive === undefined || typeof t.caseSensitive === "boolean") &&
					Object.keys(t).every((k) => TERM_KEYS.has(k));
		if (!ok)
			throw new Error(
				`${name}: forbiddenTerms[${i}] must be a word or { "term": "word", "use"?: "replacement", "caseSensitive"?: true }`
			);
	});
	return { allow: raw.allow ?? [], forbiddenTerms: terms };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Not a letter, mark or digit on either side: `cliente` does not match `clientes` or `clientela`. */
const WORD_EDGE = "[\\p{L}\\p{M}\\p{N}]";

function termMatchers(terms: readonly ForbiddenTerm[]): { re: RegExp; use?: string }[] {
	return terms.map((t) => {
		const e: ForbiddenTermEntry = typeof t === "string" ? { term: t } : t;
		// A phrase matches across any run of whitespace, line breaks included.
		const words = e.term.normalize("NFC").trim().split(/\s+/).map(escapeRe).join("\\s+");
		const re = new RegExp(
			`(?<!${WORD_EDGE})${words}(?!${WORD_EDGE})`,
			e.caseSensitive ? "gu" : "giu"
		);
		return { re, use: e.use };
	});
}

const MARKER = WORKAROUND_MARKER;
const lineOf = (s: string, i: number) => s.slice(0, i).split("\n").length;
const newlines = (s: string) => s.split("\n").length - 1;
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

interface TemplateText {
	/** Where i18n-literal reports it: the text node, or the attribute it is the value of. */
	index: number;
	/** Offset of `data` in the file, for a line inside a multi-line text. */
	start: number;
	data: string;
	/** A whole text node, or the one plain string of an attribute (what i18n-literal reads). */
	whole: boolean;
}

/** Text a template shows: text nodes and the literal parts of text attributes; never `{…}` or script. */
function templateText(src: string): TemplateText[] {
	const out: TemplateText[] = [];
	const ast = parse(src, { modern: true });
	const walk = (node: unknown) => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			for (const n of node) walk(n);
			return;
		}
		const n = node as TemplateNode;
		if (n.type === "Text" && n.data)
			out.push({ index: n.start, start: n.start, data: n.data, whole: true });
		if (n.type === "RegularElement" || n.type === "Component")
			for (const a of n.attributes ?? []) {
				if (a.type !== "Attribute" || !a.name || !(a.name in TEXT_ATTRS)) continue;
				const v = a.value;
				// A plain string attribute is `[Text]`; `label={t.save}` is an ExpressionTag;
				// `title="Novo {x}"` is `[Text, ExpressionTag]`, whose Text part is still shown.
				const nodes = (Array.isArray(v) ? v : []) as TemplateNode[];
				for (const t of nodes)
					if (t.type === "Text" && t.data)
						out.push({ index: a.start, start: t.start, data: t.data, whole: nodes.length === 1 });
			}
		for (const key of Object.keys(n)) {
			if (key === "parent" || key === "expression" || key === "attributes") continue;
			const v = n[key];
			if (v && typeof v === "object") walk(v);
		}
	};
	walk(ast.fragment);
	return out;
}

const SURFACES = new Set(["Card", "Surface"]);

/** Offsets of a Card/Surface whose first child is another Card/Surface (`<Card skeleton />` has none). */
function nestedSurfaces(src: string): number[] {
	const out: number[] = [];
	const walk = (node: unknown) => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) return void node.forEach(walk);
		const n = node as TemplateNode;
		if (n.type === "Component" && SURFACES.has(n.name ?? "")) {
			const first = (n.fragment as { nodes: TemplateNode[] }).nodes.find(
				(c) => c.type !== "Text" || c.data?.trim()
			);
			if (first?.type === "Component" && SURFACES.has(first.name ?? "")) out.push(first.start);
		}
		for (const key of Object.keys(n)) {
			if (key === "parent" || key === "expression" || key === "attributes") continue;
			const v = n[key];
			if (v && typeof v === "object") walk(v);
		}
	};
	walk(parse(src, { modern: true }).fragment);
	return out;
}

const scale: number[] = Object.values(BREAKPOINTS);

export function guardSource(
	file: string,
	src: string,
	{ allow = [], forbiddenTerms = [], rules }: GuardOptions = {}
): GuardViolation[] {
	const out: GuardViolation[] = [];
	const lines = src.split("\n");
	const excused = (line: number) =>
		[lines[line - 1], lines[line - 2]].some((l) => l !== undefined && MARKER.test(l));
	const report = (line: number, rule: GuardRule, message: string) => {
		if (rules && !rules.includes(rule)) return;
		if (!excused(line)) out.push({ file, line, rule, message });
	};
	const add = (index: number, rule: GuardRule, message: string) =>
		report(lineOf(src, index), rule, message);

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
		// The scale from BREAKPOINTS; max-width sits 0.02px below a step so both sides never
		// match at the exact width (#916): `max-width: 899.98px`, `min-width: 900px`.
		for (const q of text.matchAll(/@media[^{]*/g))
			for (const m of q[0].matchAll(/\((max|min)-width:\s*([0-9.]+)px\)/g)) {
				const w = Number(m[2]);
				const ok =
					m[1] === "max" ? scale.some((s) => Math.abs(w - (s - 0.02)) < 0.001) : scale.includes(w);
				if (ok) continue;
				const near = scale.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
				const fix = m[1] === "max" ? `${near - 0.02}px` : `${near}px`;
				add(
					offset + (q.index ?? 0) + (m.index ?? 0),
					"breakpoint",
					`@media ${m[1]}-width ${m[2]}px: use ${m[1]}-width ${fix} (the ${scale.join(" / ")} scale, max-width 0.02px below), or @container`
				);
			}
		for (const decl of values.matchAll(
			/(?<![\w-])(padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?\s*:\s*([^;{}]+)[;}]?/g
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
				!/min-width\s*:\s*0/.test(body) &&
				// overflow other than visible makes the automatic minimum width 0 already.
				!/overflow(?:-x)?\s*:\s*(?:hidden|auto|scroll|clip)/.test(body)
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
		// .astro has no Svelte AST: an opening tag, minus `=>` in attributes, not self-closing.
		let nested: number[] = [];
		if (file.endsWith(".svelte"))
			try {
				nested = nestedSurfaces(src);
			} catch {
				// A file svelte cannot parse is the compiler's error to report, not the guard's.
			}
		else
			nested = [
				...markup.matchAll(/<(?:Card|Surface)\b(?:[^>]|=>)*?(?<!\/)>\s*(<(?:Card|Surface)\b)/g),
			].map((m) => (m.index ?? 0) + m[0].lastIndexOf(m[1] ?? "<"));
		for (const index of nested)
			add(
				index,
				"nested-surface",
				"a surface directly inside another: separate with a divider or spacing, one frame per group"
			);
	}
	if (file.endsWith(".svelte")) {
		const terms = termMatchers(forbiddenTerms);
		try {
			for (const t of templateText(src)) {
				if (t.whole && HAS_WORDS.test(t.data))
					add(
						t.index,
						"i18n-literal",
						`visible text "${t.data.trim().slice(0, 30)}": read it from your messages`
					);
				// NFC keeps line breaks, so the line is the text's own plus the breaks before the match.
				const text = t.data.normalize("NFC");
				const hits = terms
					.flatMap(({ re, use }) => [...text.matchAll(re)].map((m) => ({ m, use })))
					.sort((a, b) => a.m.index - b.m.index);
				for (const { m, use } of hits)
					report(
						lineOf(src, t.start) + newlines(text.slice(0, m.index)),
						"forbidden-term",
						`"${m[0].replace(/\s+/g, " ")}" is a forbidden term${use ? `: write "${use}"` : ""} (forbiddenTerms in ui-guard.config.json)`
					);
			}
		} catch {
			// A file svelte cannot parse is the compiler's error to report, not the guard's.
		}
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
	{
		cwd = process.cwd(),
		log = console.log,
		allow = [],
		forbiddenTerms,
		rules,
	}: RunGuardOptions = {}
): number {
	const files = [...new Set(targets.flatMap((t) => collect(resolve(cwd, t))))];
	let count = 0;
	for (const file of files) {
		const rel = relPosix(cwd, file);
		for (const v of guardSource(rel, readFileSync(file, "utf8"), {
			allow,
			forbiddenTerms,
			rules,
		})) {
			log(`${v.file}:${v.line} ${v.rule} ${v.message}`);
			count++;
		}
	}
	log(count ? `\n${count} finding${count === 1 ? "" : "s"}.` : "ui guard: clean.");
	return count ? 1 : 0;
}
