/**
 * `codeatlas-ui lint` (#383): the UI guard an app runs next to its linter. Biome and ESLint do not
 * read what a Svelte template renders, so these rules read the markup and the style blocks:
 *
 *   hex            a literal `#rrggbb` color: use a `--ca-*` token
 *   px             a raw `Npx` size (0 and 1px hairlines excepted): use a `--ca-space-*` / radius token
 *   inline-style   a `style=""` that sets anything but a custom property
 *   global-ca      `:global(.ca-*)` outside the allow-list: use a documented part, variable or data attribute
 *   i18n-literal   visible text in a `.svelte`/`.astro` template: read it from your messages
 *
 * A `ca-ui-workaround(#n)` marker on the line or the one above excuses it. Exit 1 on any finding.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse } from "svelte/compiler";

export type GuardRule = "hex" | "px" | "inline-style" | "global-ca" | "i18n-literal";

export interface GuardViolation {
	file: string;
	line: number;
	rule: GuardRule;
	message: string;
}

export interface GuardOptions {
	/** Files (relative to cwd) where `:global(.ca-*)` is allowed: the app's one override sheet. */
	allow?: string[];
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
	{ allow = [] }: GuardOptions = {}
): GuardViolation[] {
	const out: GuardViolation[] = [];
	const lines = src.split("\n");
	const excused = (line: number) =>
		[lines[line - 1], lines[line - 2]].some((l) => l !== undefined && MARKER.test(l));
	const add = (index: number, rule: GuardRule, message: string) => {
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
	{ cwd = process.cwd(), log = console.log, allow = [] }: RunGuardOptions = {}
): number {
	const files = [...new Set(targets.flatMap((t) => collect(resolve(cwd, t))))];
	let count = 0;
	for (const file of files) {
		const rel = relative(cwd, file);
		for (const v of guardSource(rel, readFileSync(file, "utf8"), { allow })) {
			log(`${v.file}:${v.line} ${v.rule} ${v.message}`);
			count++;
		}
	}
	log(count ? `\n${count} finding${count === 1 ? "" : "s"}.` : "ui guard: clean.");
	return count ? 1 : 0;
}
