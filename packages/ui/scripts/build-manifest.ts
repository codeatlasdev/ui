/**
 * Builds the machine-readable API bundle consumed by the MCP server and the agent skill:
 *   dist/components.json  every exported component: props, snippets, public `ca-*` classes
 *   dist/tokens.json      every `--ca-*` custom property (tokens.css + built-in presets + brand)
 *   dist/guides.json      the docs site pages as markdown (offline `get_guide`)
 *   --skill               also rewrites .agents/skills/codeatlas-ui/API.md (props per component)
 *
 *   bun scripts/build-manifest.ts [--check]
 *
 * How: every public entry (`.`, `./charts`, `./table`, `./code`, `./forms`) is
 * parsed with the TypeScript compiler API to find `export { default as X } from
 * "*.svelte"`. Each component goes through svelte2tsx (valid TS for `lang="ts"`,
 * `generics`, runes), then the AST of that output gives the `$props()` type
 * (own members only; inherited HTML attributes are reported as `extends`), the
 * destructuring defaults, JSDoc and which props are `$bindable`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { mdxToMarkdown } from "./mdx-to-markdown.ts";

// CJS require keeps svelte2tsx out of Vite's transform pipeline (its sourceMappingURL points at a file it does not ship).
const { svelte2tsx }: typeof import("svelte2tsx") = createRequire(import.meta.url)("svelte2tsx");
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = join(ROOT, "src/lib");
const PKG = "@codeatlasdev/ui";

/** Public entry points: import specifier → entry file under src/lib. */
const ENTRIES: Record<string, string> = {
	[PKG]: "index.ts",
	[`${PKG}/charts`]: "charts/index.ts",
	[`${PKG}/table`]: "components/DataTable/index.ts",
	[`${PKG}/code`]: "components/CodeSnippet/index.ts",
	[`${PKG}/forms`]: "forms/index.ts",
};

export interface ManifestProp {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	/** `$bindable` prop (use `bind:name`). */
	bindable?: boolean;
	description?: string;
}

export interface ManifestComponent {
	name: string;
	/** Import specifier, e.g. `@codeatlasdev/ui` or `@codeatlasdev/ui/charts`. */
	import: string;
	/** Source file relative to `src/lib`. */
	source: string;
	/** First JSDoc/comment paragraph of the component, when present. */
	description?: string;
	/** Own props. Inherited attributes (e.g. `HTMLAttributes`) are listed in `extends`. */
	props: ManifestProp[];
	/** Props typed as `Snippet`/`Snippet<[...]>`: the holes a caller fills. */
	snippets: ManifestProp[];
	/** Text of the interface `extends` clause: native attributes that also pass through. */
	extends?: string;
	/** Public `ca-*` class names defined in the component `<style>`. */
	classes: string[];
	/** Generic parameters, e.g. `TData extends RowData`. */
	generics?: string;
}

export interface Manifest {
	name: string;
	version: string;
	components: ManifestComponent[];
}

// ── entry parsing ─────────────────────────────────────────────────────────────

interface Found {
	name: string;
	file: string;
	entry: string;
}

/** Resolve `export { default as X } from "./a.svelte"` and `export { X } from "./index.js"` (recursively). */
function collectExports(entryFile: string, entry: string, out: Found[], seen = new Set<string>()) {
	const abs = join(LIB, entryFile);
	if (seen.has(abs) || !existsSync(abs)) return;
	seen.add(abs);
	const sf = ts.createSourceFile(abs, readFileSync(abs, "utf8"), ts.ScriptTarget.ESNext, true);
	const dir = dirname(abs);
	for (const st of sf.statements) {
		if (!ts.isExportDeclaration(st) || st.isTypeOnly || !st.moduleSpecifier) continue;
		if (!ts.isStringLiteral(st.moduleSpecifier) || !st.exportClause) continue;
		if (!ts.isNamedExports(st.exportClause)) continue;
		const spec = st.moduleSpecifier.text;
		if (!spec.startsWith(".")) continue;
		if (spec.endsWith(".svelte")) {
			for (const el of st.exportClause.elements) {
				if (el.isTypeOnly) continue;
				if ((el.propertyName ?? el.name).text === "default")
					out.push({ name: el.name.text, file: relative(LIB, join(dir, spec)), entry });
			}
		} else if (/\/index\.js$/.test(spec) || spec.endsWith("index")) {
			// Re-export of named bindings coming from a sub-barrel (Table, Date): follow it,
			// keeping only the names this entry re-exports.
			const names = new Set(
				st.exportClause.elements.filter((e) => !e.isTypeOnly).map((e) => e.name.text)
			);
			const sub: Found[] = [];
			collectExports(relative(LIB, join(dir, spec.replace(/\.js$/, ".ts"))), entry, sub, seen);
			for (const f of sub) if (names.has(f.name)) out.push(f);
		}
	}
}

// ── props extraction ──────────────────────────────────────────────────────────

/** Last JSDoc comment attached to a node, flattened to one line. */
function jsDoc(node: ts.Node): string | undefined {
	const comment = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc)?.comment;
	const text = typeof comment === "string" ? comment : comment?.map((c) => c.text).join("");
	return text?.replace(/\s*\n\s*/g, " ").trim() || undefined;
}

const propName = (n: ts.PropertyName): string =>
	ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : n.getText();

/** Defaults live in the destructuring: `let { size = 'md', value = $bindable('a') } = $props()`. */
function readDefaults(decl: ts.VariableDeclaration, sf: ts.SourceFile) {
	const defaults = new Map<string, { text?: string; bindable: boolean }>();
	if (!ts.isObjectBindingPattern(decl.name)) return defaults;
	for (const el of decl.name.elements) {
		if (el.dotDotDotToken) continue;
		const key = el.propertyName
			? propName(el.propertyName as ts.PropertyName)
			: (el.name as ts.Identifier).text;
		let text: string | undefined;
		let bindable = false;
		const init = el.initializer;
		if (init) {
			if (ts.isCallExpression(init) && init.expression.getText(sf) === "$bindable") {
				bindable = true;
				text = init.arguments[0]?.getText(sf);
			} else text = init.getText(sf);
		}
		defaults.set(key, { text, bindable });
	}
	return defaults;
}

/** Find `let {...}: T = $props()` in the svelte2tsx output. */
function findPropsDecl(sf: ts.SourceFile) {
	let found: ts.VariableDeclaration | undefined;
	const visit = (n: ts.Node) => {
		if (found) return;
		if (
			ts.isVariableDeclaration(n) &&
			n.initializer &&
			ts.isCallExpression(n.initializer) &&
			n.initializer.expression.getText(sf) === "$props"
		)
			found = n;
		else ts.forEachChild(n, visit);
	};
	visit(sf);
	return found;
}

/** Members of the `Props` interface/type alias, or of an inline type literal. */
function resolvePropsType(sf: ts.SourceFile, type: ts.TypeNode | undefined) {
	let members: readonly ts.TypeElement[] = [];
	let ext: string | undefined;
	if (!type) return { members, ext };
	if (ts.isTypeLiteralNode(type)) return { members: type.members, ext };
	if (ts.isTypeReferenceNode(type)) {
		const name = type.typeName.getText(sf);
		const decl = sf.statements.find(
			(s): s is ts.InterfaceDeclaration | ts.TypeAliasDeclaration =>
				(ts.isInterfaceDeclaration(s) || ts.isTypeAliasDeclaration(s)) && s.name.text === name
		);
		// Props may be declared inside `$$render()` (instance script): search the whole file.
		const inner = decl ?? findDeclDeep(sf, name);
		if (inner && ts.isInterfaceDeclaration(inner)) {
			members = inner.members;
			ext = inner.heritageClauses?.flatMap((h) => h.types.map((t) => t.getText(sf))).join(", ");
		} else if (inner && ts.isTypeAliasDeclaration(inner)) {
			const t = inner.type;
			if (ts.isTypeLiteralNode(t)) members = t.members;
			else if (ts.isIntersectionTypeNode(t)) {
				const own: ts.TypeElement[] = [];
				const rest: string[] = [];
				for (const part of t.types) {
					if (ts.isTypeLiteralNode(part)) own.push(...part.members);
					else rest.push(part.getText(sf));
				}
				members = own;
				ext = rest.join(" & ") || undefined;
			} else ext = t.getText(sf);
		}
	}
	return { members, ext };
}

function findDeclDeep(sf: ts.SourceFile, name: string) {
	let hit: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined;
	const visit = (n: ts.Node) => {
		if (hit) return;
		if ((ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) && n.name.text === name)
			hit = n;
		else ts.forEachChild(n, visit);
	};
	visit(sf);
	return hit;
}

/** Prose of a `/** ... *\/` block before its first `@tag`, flattened to one paragraph. */
function docProse(block: string): string | undefined {
	const lines = block
		.replace(/^\/\*\*|\*\/$/g, "")
		.split("\n")
		.map((l) => l.replace(/^\s*\*?\s?/, "").trimEnd());
	const tag = lines.findIndex((l) => /^@\w+/.test(l.trim()));
	const prose = (tag < 0 ? lines : lines.slice(0, tag)).join("\n").split(/\n\s*\n/)[0];
	return prose.replace(/\n/g, " ").trim() || undefined;
}

/**
 * Component-level description: a top-level `/** ... *\/` block of a `<script>` that is detached from
 * the declaration below it (blank line between) or that opens the script right before an import.
 * JSDoc on a declaration (`/** doc *\/ interface Props`, a member of `Props`, a `let` destructure)
 * describes that declaration, never the component. Blocks with no prose (`@deprecated ...`) are skipped.
 */
export function componentDoc(src: string): string | undefined {
	for (const script of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
		const body = script[1];
		const sf = ts.createSourceFile("c.ts", body, ts.ScriptTarget.ESNext, true);
		const stops = [...sf.statements.map((s) => s.getFullStart()), sf.endOfFileToken.getFullStart()];
		for (const [i, full] of stops.entries()) {
			const next = sf.statements[i];
			for (const c of ts.getLeadingCommentRanges(body, full) ?? []) {
				const text = body.slice(c.pos, c.end);
				if (!text.startsWith("/**")) continue;
				const gap = body.slice(c.end, next ? next.getStart(sf) : body.length);
				const attached =
					next !== undefined && !/\n[ \t]*\n/.test(gap) && !ts.isImportDeclaration(next);
				if (attached) continue;
				const prose = docProse(text);
				if (prose) return prose;
			}
		}
	}
	return undefined;
}

function extractComponent(name: string, file: string, entry: string): ManifestComponent {
	const abs = join(LIB, file);
	const src = readFileSync(abs, "utf8");
	const out: ManifestComponent = {
		name,
		import: entry,
		source: file,
		props: [],
		snippets: [],
		classes: extractClasses(componentCss(src, dirname(abs))),
	};

	const generics = src.match(/<script[^>]*\bgenerics="([^"]+)"/)?.[1];
	if (generics) out.generics = generics;

	let code: string;
	try {
		code = svelte2tsx(src, { filename: abs, isTsFile: true, mode: "ts", version: "5.57.0" }).code;
	} catch (e) {
		throw new Error(`svelte2tsx failed for ${file}: ${(e as Error).message}`);
	}
	const sf = ts.createSourceFile(
		`${abs}.tsx`,
		code,
		ts.ScriptTarget.ESNext,
		true,
		ts.ScriptKind.TSX
	);
	const decl = findPropsDecl(sf);
	if (!decl) return out;

	const defaults = readDefaults(decl, sf);
	const { members, ext } = resolvePropsType(sf, decl.type);
	if (ext) out.extends = ext;

	for (const m of members) {
		if (!ts.isPropertySignature(m) || !m.name) continue;
		const type = m.type?.getText(sf).replace(/\s+/g, " ") ?? "unknown";
		const d = defaults.get(propName(m.name));
		const prop: ManifestProp = {
			name: propName(m.name),
			type,
			optional: !!m.questionToken,
		};
		if (d?.text !== undefined && d.text !== "undefined") prop.default = d.text;
		if (d?.bindable) prop.bindable = true;
		const doc = jsDoc(m);
		if (doc) prop.description = doc;
		(/^\(?\s*Snippet\b/.test(type) ? out.snippets : out.props).push(prop);
	}

	const description = componentDoc(src);
	if (description) out.description = description;
	return out;
}

/** CSS text of a component: its `<style>` blocks plus every local `.css` it imports. */
function componentCss(src: string, dir: string): string {
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

// ── main ──────────────────────────────────────────────────────────────────────

export function buildManifest(): Manifest {
	const found: Found[] = [];
	for (const [entry, file] of Object.entries(ENTRIES)) collectExports(file, entry, found);
	const seen = new Set<string>();
	const components: ManifestComponent[] = [];
	for (const f of found) {
		const key = `${f.entry}:${f.name}`;
		if (seen.has(key)) continue;
		seen.add(key);
		components.push(extractComponent(f.name, f.file, f.entry));
	}
	components.sort((a, b) => a.name.localeCompare(b.name));
	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
	return { name: pkg.name, version: pkg.version, components };
}

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

// ── guides ────────────────────────────────────────────────────────────────────

export interface ManifestGuide {
	/** Path under docs, e.g. `inputs/button`. */
	slug: string;
	title: string;
	group: string;
	description: string;
	markdown: string;
}

const DOCS_DIR = resolve(ROOT, "../../site/src/content/docs");

function mdxFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? mdxFiles(join(dir, e.name))
			: e.name.endsWith(".mdx")
				? [join(dir, e.name)]
				: []
	);
}

function buildGuides(): ManifestGuide[] {
	if (!existsSync(DOCS_DIR)) return [];
	return mdxFiles(DOCS_DIR)
		.map((file) => {
			const raw = readFileSync(file, "utf8");
			const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
			const field = (k: string) =>
				fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].replace(/^["']|["']$/g, "") ?? "";
			return {
				slug: relative(DOCS_DIR, file).replace(/\.mdx$/, ""),
				title: field("title"),
				group: field("group"),
				description: field("description"),
				markdown: mdxToMarkdown(fm ? raw.slice(fm[0].length) : raw),
			};
		})
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── agent skill reference ─────────────────────────────────────────────────────

const SKILL_API = resolve(ROOT, "../../.agents/skills/codeatlas-ui/API.md");

const cell = (v: string) => v.replace(/\|/g, "\\|");

/** Markdown reference of every component's props, snippets and classes. Deterministic. */
export function skillMarkdown(m: Manifest): string {
	const out = [
		"<!-- generated by packages/ui/scripts/build-manifest.ts (bun run --cwd packages/ui manifest -- --skill). Do not edit. -->",
		"# Component API reference",
		"",
		"Generated from the source types: every prop, default and public `ca-*` class. Hand-written usage examples are in [COMPONENTS.md](./COMPONENTS.md).",
		"Import from the path in each heading. Charts, DataTable, CodeSnippet and the `forms` fields are subpath imports.",
		"",
	];
	for (const c of m.components) {
		out.push(
			`## ${c.name}`,
			"",
			`\`import { ${c.name} } from "${c.import}"\`${c.generics ? ` (generic: \`${c.generics}\`)` : ""}`,
			""
		);
		if (c.description) out.push(c.description, "");
		if (c.props.length) {
			out.push("| Prop | Type | Default | Notes |", "|---|---|---|---|");
			for (const p of c.props)
				out.push(
					`| \`${p.name}${p.optional ? "?" : ""}\` | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ""} | ${[p.bindable ? "`bind:`" : "", p.description ? cell(p.description) : ""].filter(Boolean).join(" ")} |`
				);
			out.push("");
		}
		if (c.snippets.length)
			out.push(
				`Snippets: ${c.snippets.map((x) => `\`${x.name}\`${x.type.includes("<") ? ` (\`${cell(x.type)}\`)` : ""}`).join(", ")}`,
				""
			);
		if (c.extends) out.push(`Also accepts: \`${cell(c.extends)}\``, "");
		if (c.classes.length) out.push(`Classes: ${c.classes.map((x) => `\`${x}\``).join(" ")}`, "");
	}
	return `${out
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trimEnd()}\n`;
}

if (import.meta.main) {
	const manifest = buildManifest();
	const tokens = buildTokens();
	const guides = buildGuides();
	if (process.argv.includes("--check")) {
		const bare = manifest.components.filter((c) => !c.props.length && !c.snippets.length);
		console.log(
			`${manifest.components.length} components (${bare.length} without own props), ${tokens.length} tokens, ${guides.length} guides`
		);
	} else {
		const dist = join(ROOT, "dist");
		mkdirSync(dist, { recursive: true });
		const write = (name: string, data: unknown) =>
			writeFileSync(join(dist, name), `${JSON.stringify(data, null, "\t")}\n`);
		write("components.json", manifest);
		write("tokens.json", { name: manifest.name, version: manifest.version, tokens });
		// Docs live in the monorepo's site/; a build from a published tarball keeps the shipped file.
		if (guides.length)
			write("guides.json", { name: manifest.name, version: manifest.version, guides });
		if (process.argv.includes("--skill")) writeFileSync(SKILL_API, skillMarkdown(manifest));
		console.log(
			`manifest: ${manifest.components.length} components, ${tokens.length} tokens, ${guides.length} guides`
		);
	}
}
