/**
 * Builds the machine-readable API bundle consumed by the MCP server and the agent skill:
 *   dist/components.json  every exported component (props, snippets, public `ca-*` classes) and every
 *                         other runtime/type export of every entry point (`exports`: signature + summary)
 *   dist/tokens.json      every `--ca-*` custom property (tokens.css + built-in presets + brand)
 *   dist/guides.json      the docs site pages as markdown (offline `get_guide`)
 *   --skill               also rewrites .agents/skills/codeatlas-ui/API.md (components, then non-component exports)
 *
 *   bun scripts/build-manifest.ts [--check]
 *
 * How: every public entry (`.`, `./charts`, `./table`, `./code`, `./forms`) is
 * parsed with the TypeScript compiler API to find `export { default as X } from
 * "*.svelte"`. Each component goes through svelte2tsx (valid TS for `lang="ts"`,
 * `generics`, runes), then the AST of that output gives the `$props()` type
 * (own members only; inherited HTML attributes are reported as `extends`), the
 * destructuring defaults, JSDoc and which props are `$bindable`. Everything else an entry
 * exports (stores, functions, types, Vite/Astro/Kit helpers) is resolved with a TypeScript
 * `Program` over the entry files and reported with its signature and JSDoc summary.
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

/** Entries whose non-component exports are documented: specifier → source file (mirrors package.json#exports). */
const API_ENTRIES: Record<string, string> = {
	...ENTRIES,
	[`${PKG}/kit`]: "kit/index.ts",
	[`${PKG}/vite`]: "vite-plugin.ts",
	[`${PKG}/astro`]: "astro.ts",
	[`${PKG}/actions`]: "actions/index.ts",
	[`${PKG}/seo`]: "seo/index.ts",
	[`${PKG}/tokens`]: "tokens/index.ts",
	[`${PKG}/utils/palette-generator`]: "utils/palette-generator.ts",
};

export type ExportKind = "function" | "store" | "const" | "class" | "type";

export interface ManifestExport {
	name: string;
	/** Import specifier, e.g. `@codeatlasdev/ui/kit`. */
	import: string;
	kind: ExportKind;
	/** One-line declaration: `function f(a: A): R`, `interface X { ... }`, `type T = ...`, `const x: T`. */
	signature: string;
	/** First paragraph of the JSDoc of the declaration (or of the comment right above it). */
	description?: string;
	/** Source file relative to `src/lib`. */
	source: string;
}

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
	/** Every other export of every entry point: functions, stores, constants, classes, types. */
	exports: ManifestExport[];
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

// ── non-component exports ─────────────────────────────────────────────────────

/** Prose before the first `@tag` of the JSDoc attached to a declaration (a variable's doc sits on its statement). */
function exportDoc(decl: ts.Declaration, sf: ts.SourceFile): string | undefined {
	let node: ts.Node = decl;
	if (ts.isBindingElement(node)) {
		while (!ts.isVariableDeclaration(node)) node = node.parent;
	}
	if (ts.isVariableDeclaration(node)) node = node.parent.parent;
	const own = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc);
	if (own)
		return docProse(
			own
				.getText(sf)
				.replace(/^\/\*\*|\*\/$/g, "")
				.replace(/^\s*\* ?/gm, "")
		);
	return undefined;
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

const TYPE_FLAGS =
	ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

/** `name?: Type` for one parameter: no default value; an unannotated parameter shows its inferred type. */
function paramSignature(
	p: ts.ParameterDeclaration,
	sf: ts.SourceFile,
	checker: ts.TypeChecker
): string {
	const type = p.type
		? oneLine(p.type.getText(sf))
		: oneLine(checker.typeToString(checker.getTypeAtLocation(p), p, TYPE_FLAGS));
	const name = ts.isIdentifier(p.name) ? p.name.text : "options";
	const dots = p.dotDotDotToken ? "..." : "";
	return `${dots}${name}${p.questionToken || p.initializer ? "?" : ""}: ${type}`;
}

/** Declaration as one line without bodies, initializers, default values or comments. */
function exportSignature(
	name: string,
	decl: ts.Declaration,
	sf: ts.SourceFile,
	checker: ts.TypeChecker
): { kind: ExportKind; signature: string } {
	if (ts.isFunctionDeclaration(decl)) {
		const tp = decl.typeParameters
			? `<${decl.typeParameters.map((t) => t.getText(sf)).join(", ")}>`
			: "";
		const sig = checker.getSignatureFromDeclaration(decl);
		if (!decl.type && !sig) throw new Error(`cannot resolve the signature of ${name}`);
		const ret = decl.type
			? oneLine(decl.type.getText(sf))
			: checker.typeToString(
					checker.getReturnTypeOfSignature(sig as ts.Signature),
					decl,
					TYPE_FLAGS
				);
		const params = decl.parameters.map((p) => paramSignature(p, sf, checker)).join(", ");
		return { kind: "function", signature: `function ${name}${tp}(${params}): ${oneLine(ret)}` };
	}
	if (ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl)) {
		const text = decl
			.getText(sf)
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/\s\/\/.*$/gm, "")
			.replace(/^export\s+/, "");
		return { kind: "type", signature: oneLine(text) };
	}
	if (ts.isClassDeclaration(decl)) return { kind: "class", signature: `class ${name}` };
	if (ts.isVariableDeclaration(decl) || ts.isBindingElement(decl)) {
		const type = checker.getTypeAtLocation(decl);
		const init = ts.isVariableDeclaration(decl) ? decl.initializer : undefined;
		// `.svelte.ts` rune singletons (`const x = createXStore()`) expose getters + methods: report them as stores.
		const store = /^create\w*Store\(/.test(init?.getText(sf) ?? "");
		return {
			kind: store ? "store" : "const",
			signature: `const ${name}: ${constType(type, decl, checker)}`,
		};
	}
	return { kind: "const", signature: name };
}

/** Getter without a setter, or a member declared `readonly` (an `as const` literal's properties are). */
function isReadonlyMember(d: ts.Declaration): boolean {
	if (ts.isGetAccessor(d)) {
		const siblings = ts.isObjectLiteralExpression(d.parent)
			? d.parent.properties
			: d.parent.members;
		return !siblings.some((m) => ts.isSetAccessor(m) && m.name.getText() === d.name.getText());
	}
	return (ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Readonly) !== 0;
}

/** Longest one-line type shown as is; object types beyond it list one `name: type` member per line. */
const MAX_TYPE = 100;

/** A type as text: one line when short, otherwise an object type split one member per line. */
function constType(type: ts.Type, at: ts.Node, checker: ts.TypeChecker): string {
	const full = oneLine(checker.typeToString(type, at, TYPE_FLAGS));
	if (full.length <= MAX_TYPE) return full;
	const props = type.getProperties();
	if (!props.length || !(type.flags & ts.TypeFlags.Object) || type.getCallSignatures().length)
		return full;
	const members = props.map((p) => {
		const t = checker.getTypeOfSymbolAtLocation(p, at);
		const text = oneLine(checker.typeToString(t, at, TYPE_FLAGS));
		const readonly = !!p.declarations?.length && p.declarations.every(isReadonlyMember);
		return `  ${readonly ? "readonly " : ""}${p.name}: ${text.length > MAX_TYPE ? `${text.slice(0, MAX_TYPE - 1)}…` : text};`;
	});
	return `{\n${members.join("\n")}\n}`;
}

/** Every export of every entry that is not a component and is declared in this package. */
export function extractExports(components: ManifestComponent[]): ManifestExport[] {
	const files = Object.values(API_ENTRIES).map((f) => join(LIB, f));
	const program = ts.createProgram(files, {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		allowImportingTsExtensions: true,
		skipLibCheck: true,
		noEmit: true,
		types: [],
	});
	const checker = program.getTypeChecker();
	const component = new Set(components.map((c) => `${c.import}:${c.name}`));
	const out: ManifestExport[] = [];
	for (const [entry, file] of Object.entries(API_ENTRIES)) {
		const sf = program.getSourceFile(join(LIB, file));
		const mod = sf && checker.getSymbolAtLocation(sf);
		if (!mod) throw new Error(`cannot resolve entry ${file}`);
		for (const exported of checker.getExportsOfModule(mod)) {
			if (component.has(`${entry}:${exported.name}`)) continue;
			const target =
				exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
			const decl = target.declarations?.[0];
			const declFile = decl?.getSourceFile();
			// Foreign (`@internationalized/date`, `clsx`, svelte) symbols are not this package's API.
			if (
				!decl ||
				!declFile ||
				declFile.fileName.includes("node_modules") ||
				declFile.fileName.endsWith(".svelte")
			)
				continue;
			const { kind, signature } = exportSignature(exported.name, decl, declFile, checker);
			const description = exportDoc(decl, declFile);
			out.push({
				name: exported.name,
				import: entry,
				kind,
				signature,
				...(description ? { description } : {}),
				source: relative(LIB, declFile.fileName),
			});
		}
	}
	return out.sort((a, b) => a.import.localeCompare(b.import) || a.name.localeCompare(b.name));
}

// ── main ──────────────────────────────────────────────────────────────────────

export function buildManifest(): Manifest {
	const found: Found[] = [];
	for (const [entry, file] of Object.entries(API_ENTRIES)) collectExports(file, entry, found);
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
	return { name: pkg.name, version: pkg.version, components, exports: extractExports(components) };
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

export function buildGuides(): ManifestGuide[] {
	if (!existsSync(DOCS_DIR)) return [];
	return mdxFiles(DOCS_DIR)
		.map((file) => {
			const raw = readFileSync(file, "utf8");
			const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
			const field = (k: string) =>
				fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].replace(/^["']|["']$/g, "") ?? "";
			return {
				slug: relative(DOCS_DIR, file)
					.replaceAll("\\", "/")
					.replace(/\.mdx$/, ""),
				title: field("title"),
				group: field("group"),
				description: field("description"),
				markdown: mdxToMarkdown(fm ? raw.slice(fm[0].length) : raw),
			};
		})
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── demos (ca-prompt catalog) ─────────────────────────────────────────────────

export interface ManifestDemo {
	id: string;
	group: string;
	page: string;
	variant: string;
	slug: string;
	title: string;
	description: string;
	summary: string;
	use: string;
	spec: string[];
	tags: string[];
	shape: "square" | "wide" | "tall";
	components: string[];
	imports: { from: string; names: string[] }[];
	interactive: boolean;
	/** Live demo URL on the docs site. */
	demo: string;
	source: string;
	needs: string;
}

const DEMOS_DIR = resolve(ROOT, "../../site/src/demos");
const SITE = "https://ui.codeatlas.com.br";
const API = `${SITE}/api/v1`;
/** Shared building blocks under site/src/demos that are not demos themselves. */
export const HELPERS = ["foundation/colors/Swatches", "foundation/typography/TypeRows"];
const PEERS: Record<string, string> = {
	[`${PKG}/charts`]: "echarts",
	[`${PKG}/table`]: "@tanstack/svelte-table",
	[`${PKG}/code`]: "shiki",
};

/** `<Demo title description><X client:…>` per demo path, read from every MDX page. */
function demoUsages() {
	const out = new Map<string, { title: string; description: string; interactive: boolean }>();
	if (!existsSync(DOCS_DIR)) return out;
	for (const file of mdxFiles(DOCS_DIR)) {
		const raw = readFileSync(file, "utf8");
		for (const [, name, path] of raw.matchAll(
			/^import (\w+) from "~\/demos\/([^"?]+)\.svelte";$/gm
		)) {
			const tag = raw.match(new RegExp(`<Demo ([^>]*)>\\s*<${name}\\b([^>]*)>`));
			if (!tag) continue;
			const attr = (k: string) => tag[1].match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
			out.set(path, {
				title: attr("title"),
				description: attr("description"),
				interactive: tag[2].includes("client:"),
			});
		}
	}
	return out;
}

type DemoMeta = Partial<Pick<ManifestDemo, "summary" | "use" | "spec" | "tags" | "shape">>;

/** Problems that make the registry invalid: unregistered demos, missing files, duplicate ids/paths. */
export function checkCatalog(catalog: readonly { id: string; path: string }[]): string[] {
	const errors: string[] = [];
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory()
				? walk(join(dir, e.name))
				: e.name.endsWith(".svelte")
					? [relative(DEMOS_DIR, join(dir, e.name)).replaceAll("\\", "/").slice(0, -7)]
					: []
		);
	const paths = new Set(catalog.map((d) => d.path));
	for (const p of walk(DEMOS_DIR))
		if (!HELPERS.includes(p) && !paths.has(p)) errors.push(`demo without id: ${p}`);
	const ids = new Set<string>();
	for (const d of catalog) {
		if (ids.has(d.id)) errors.push(`duplicate id: ${d.id}`);
		ids.add(d.id);
		if (!existsSync(join(DEMOS_DIR, `${d.path}.svelte`)))
			errors.push(`#${d.id} missing file: ${d.path}`);
	}
	if (paths.size !== catalog.length) errors.push("duplicate path in catalog");
	return errors;
}

export function buildDemos(
	manifest: Manifest,
	catalog: readonly { id: string; path: string }[]
): { demos: ManifestDemo[]; files: Record<string, string> } {
	const known = new Set(manifest.components.map((c) => c.name));
	const usages = demoUsages();
	const demos = catalog.map(({ id, path }): ManifestDemo => {
		const [group, page, variant] = path.split("/");
		const file = join(DEMOS_DIR, `${path}.svelte`);
		const source = readFileSync(file, "utf8");
		const metaFile = file.replace(/\.svelte$/, ".meta.json");
		const meta: DemoMeta = existsSync(metaFile) ? JSON.parse(readFileSync(metaFile, "utf8")) : {};
		const imports = [
			...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](@codeatlasdev\/ui[^"']*)["']/g),
		].map(([, names, from]) => ({
			from,
			names: names
				.split(",")
				.map(
					(n) =>
						n
							.trim()
							.replace(/^type\s+/, "")
							.split(/\s+as\s+/)[0]
				)
				.filter(Boolean),
		}));
		const components = [...new Set(imports.flatMap((i) => i.names).filter((n) => known.has(n)))];
		const use = usages.get(path);
		const title = use?.title || variant;
		const description = use?.description ?? "";
		// Same transform as site/src/components/docs/Demo.astro (heading id).
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		const peers = [...new Set(imports.map((i) => PEERS[i.from]).filter(Boolean))];
		return {
			id,
			group,
			page,
			variant,
			slug,
			title,
			description,
			summary: meta.summary || description || title,
			use: meta.use ?? "",
			spec: meta.spec ?? [],
			tags: meta.tags ?? [
				...new Set([
					...title.toLowerCase().split(/\W+/).filter(Boolean),
					...components.map((c) => c.toLowerCase()),
				]),
			],
			shape: meta.shape ?? "wide",
			components,
			imports,
			interactive: use?.interactive ?? false,
			demo: `${SITE}/docs/${group}/${page}#${slug}`,
			source,
			needs: [`${PKG}@${manifest.version}`, ...peers].join(" + "),
		};
	});
	const groups = [...new Set(demos.map((d) => d.group))].map((slug) => {
		const g = demos.filter((d) => d.group === slug);
		return { slug, first: g[0].id, last: g[g.length - 1].id, count: g.length };
	});
	const files: Record<string, string> = {
		"catalog.json": `${JSON.stringify({ version: manifest.version, count: demos.length, groups, elements: demos.map(({ source: _, ...d }) => d) }, null, "\t")}\n`,
		"en/catalog.tsv": `${["id\tgroup\tpage\ttitle\ttags\tsummary", ...demos.map((d) => [d.id, d.group, d.page, d.title, d.tags.join(","), d.summary].map((v) => v.replace(/[\t\n]/g, " ")).join("\t"))].join("\n")}\n`,
	};
	for (const d of demos) {
		const header = [
			`<!-- ${PKG} demo #${d.id} · MIT License (c) CodeAtlas · ${d.demo} -->`,
			`Element: #${d.id} ${d.title} (${d.group}/${d.page})`,
			`What it shows: ${d.summary || d.title}`,
			...(d.use ? [`When to use: ${d.use}`] : []),
			...(d.spec.length ? ["Spec:", ...d.spec.map((s) => `- ${s}`)] : []),
			`Tags: ${d.tags.join(", ")}`,
			`Needs: ${d.needs}`,
			`Components: ${d.components.join(", ") || "none"}`,
			`Live demo: ${d.demo}`,
		];
		files[`en/e/${d.id}.txt`] = `${header.join("\n")}\n\n${d.source}`;
		files[`en/p/${d.id}.txt`] = `${[
			`Use ${PKG} demo #${d.id} "${d.title}" (${d.group}/${d.page}).`,
			`What it shows: ${d.summary || d.title}.${d.use ? ` When to use: ${d.use}.` : ""}`,
			...(d.spec.length ? ["Spec:", ...d.spec.map((s) => `- ${s}`)] : []),
			"Check first: Svelte 5 + @codeatlasdev/ui installed? theme in src/lib/theme.ts? Kit 2 or 3?",
			`Apply: import only from "${PKG}[/charts|/table|/code|/forms]"; keep component names, props and`,
			"  variants of the reference as they are; no layout CSS, --ca-* tokens only (SKILL.md rules);",
			"  replace sample data/copy with the project's; keep the first comment line.",
			`Report: #${d.id} ${d.title} → file, what changed, ${d.demo}; what you could not check (light/dark, 375px, keyboard, reduced motion).`,
			`Reference: ${API}/en/e/${d.id}.txt   Components API: ca-ui-mcp get_component(${d.components[0] ?? "…"})`,
		].join("\n")}\n`;
	}
	return { demos, files };
}

export function demosMarkdown(demos: ManifestDemo[]): string {
	return `${[
		"<!-- generated by packages/ui/scripts/build-manifest.ts (bun run --cwd packages/ui manifest -- --skill). Do not edit. -->",
		"# Demo catalog",
		"",
		`Every demo has a stable number. Fetch one with \`get_demo\` (MCP) or ${API}/en/e/NNN.txt.`,
		"",
		"| id | title | group/page | components |",
		"|---|---|---|---|",
		...demos.map(
			(d) => `| ${d.id} | ${cell(d.title)} | ${d.group}/${d.page} | ${d.components.join(", ")} |`
		),
	].join("\n")}\n`;
}

// ── agent skill reference ─────────────────────────────────────────────────────

const SKILL_API = resolve(ROOT, "../../.agents/skills/codeatlas-ui/API.md");
const SKILL_DEMOS = resolve(ROOT, "../../.agents/skills/codeatlas-ui/DEMOS.md");

const cell = (v: string) => v.replace(/\|/g, "\\|");

/** Markdown reference of every component's props, snippets and classes, then every other export's signature. Deterministic. */
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
	out.push(
		"# Non-component exports",
		"",
		"Functions, stores, constants and types every entry point exports besides components. Import from the path in each heading; types use `import type`."
	);
	for (const entry of [...new Set(m.exports.map((e) => e.import))]) {
		const here = m.exports.filter((x) => x.import === entry);
		out.push("", `## ${entry}`, "");
		for (const e of here.filter((x) => x.kind !== "type")) {
			out.push(`### ${e.name}`, "", `\`import { ${e.name} } from "${entry}"\``, "");
			if (e.description) out.push(e.description, "");
			out.push("```ts", e.signature, "```", "");
		}
		const types = here.filter((x) => x.kind === "type");
		if (types.length) {
			out.push("Types:", "", "| Type | Declaration | Notes |", "|---|---|---|");
			for (const t of types)
				out.push(
					`| \`${t.name}\` | \`${cell(t.signature)}\` | ${t.description ? cell(t.description) : ""} |`
				);
			out.push("");
		}
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
	// Dynamic import: site/ exists only in the monorepo; a build from a published tarball keeps the shipped files.
	const catalog = existsSync(DEMOS_DIR)
		? (await import("../../../site/src/demos/catalog.ts")).CATALOG
		: [];
	// Every run (build included) refuses an invalid registry: a demo without an id must never ship.
	const errors = catalog.length ? checkCatalog(catalog) : [];
	if (errors.length) {
		console.error(`demo catalog (site/src/demos/catalog.ts):\n  ${errors.join("\n  ")}`);
		process.exit(1);
	}
	if (process.argv.includes("--check")) {
		const bare = manifest.components.filter((c) => !c.props.length && !c.snippets.length);
		console.log(
			`${manifest.components.length} components (${bare.length} without own props), ${tokens.length} tokens, ${guides.length} guides, ${catalog.length} demos`
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
		const { demos, files } = catalog.length
			? buildDemos(manifest, catalog)
			: { demos: [], files: {} };
		if (demos.length) {
			write("demos.json", demos);
			for (const base of [join(dist, "api/v1"), resolve(ROOT, "../../site/public/api/v1")])
				for (const [name, body] of Object.entries(files)) {
					mkdirSync(dirname(join(base, name)), { recursive: true });
					writeFileSync(join(base, name), body);
				}
		}
		if (process.argv.includes("--skill")) {
			writeFileSync(SKILL_API, skillMarkdown(manifest));
			if (demos.length) writeFileSync(SKILL_DEMOS, demosMarkdown(demos));
		}
		console.log(
			`manifest: ${manifest.components.length} components, ${tokens.length} tokens, ${guides.length} guides, ${demos.length} demos`
		);
	}
}
