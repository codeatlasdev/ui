/** Components: every `export { default as X } from "*.svelte"` of every entry, with props, snippets, defaults and docs. */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { docProse, jsDoc, oneLine, propName } from "./ast.ts";
import type { ManifestExport } from "./exports.ts";
import { extractExports } from "./exports.ts";
import { API_ENTRIES, LIB, ROOT } from "./paths.ts";
import {
	componentCss,
	extractComponentTokens,
	extractStyling,
	globalTokens,
	type ManifestStyling,
} from "./styling.ts";

// CJS require keeps svelte2tsx out of Vite's transform pipeline (its sourceMappingURL points at a file it does not ship).
const { svelte2tsx }: typeof import("svelte2tsx") = createRequire(import.meta.url)("svelte2tsx");

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
	/** Replacement text of a component-level `@deprecated` ("Use `<Flex>`: ..."). Absent on current components. */
	deprecated?: string;
	/** Own props. Inherited attributes (e.g. `HTMLAttributes`) are listed in `extends`. */
	props: ManifestProp[];
	/** Props typed as `Snippet`/`Snippet<[...]>`: the holes a caller fills. */
	snippets: ManifestProp[];
	/** Text of the interface `extends` clause: native attributes that also pass through. */
	extends?: string;
	/** Stable `ca-*` class names defined in the component `<style>` (the stable subset of `styling.parts`). */
	classes: string[];
	/** Everything an app may target to restyle this component, each part flagged stable or internal (#381). */
	styling: ManifestStyling;
	/** Component tokens: `--ca-<stem>-*` custom properties the `<style>` reads with a fallback (`var(--ca-btn-gap, …)`). Set them on `:root`, a wrapper or `ThemeOptions.components`. */
	tokens: string[];
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

/** Members of a component's props, and the native attribute type they extend. */
interface PropsMembers {
	members: readonly ts.TypeElement[];
	ext: string | undefined;
}

/** Members of `LayoutProps` (components/Layout/layout.ts), the source of every layout primitive's token props. */
let layoutMembers: Map<string, ts.TypeElement> | undefined;
function layoutPropMembers(): Map<string, ts.TypeElement> {
	if (layoutMembers) return layoutMembers;
	const file = join(LIB, "components/Layout/layout.ts");
	const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true);
	layoutMembers = new Map();
	for (const st of sf.statements)
		if (ts.isInterfaceDeclaration(st) && st.name.text === "LayoutProps")
			for (const m of st.members)
				if (ts.isPropertySignature(m) && m.name) layoutMembers.set(propName(m.name), m);
	return layoutMembers;
}

/**
 * `Pick<LayoutProps, 'gap' | 'p'>` (what Flex, Stack, Grid, Box, Container, Section and Surface take): the
 * picked members of `LayoutProps`, so the manifest lists the token props instead of an opaque `extends`.
 * Anything else is `undefined`. Member nodes belong to layout.ts, hence they carry their own source file.
 */
function layoutPick(
	type: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments
): ts.TypeElement[] | undefined {
	const name = ts.isTypeReferenceNode(type) ? type.typeName : type.expression;
	if (name.getText() !== "Pick") return undefined;
	const [target, keys] = type.typeArguments ?? [];
	if (!target || !keys || target.getText() !== "LayoutProps") return undefined;
	const names = (ts.isUnionTypeNode(keys) ? keys.types : [keys]).map((k) =>
		ts.isLiteralTypeNode(k) && ts.isStringLiteral(k.literal) ? k.literal.text : undefined
	);
	if (names.some((n) => n === undefined)) return undefined;
	const all = layoutPropMembers();
	return names.flatMap((n) => all.get(n as string) ?? []);
}

/**
 * `PolymorphicAttributes<T, Own>` (Flex, Stack, Grid, Box): `Own` holds the token props, the rest is the tag's
 * own attributes. Returns the members of a `Pick<LayoutProps, ...>` `Own`, or `undefined` for any other shape.
 */
function polymorphicOwn(type: ts.TypeNode): ts.TypeElement[] | undefined {
	if (!ts.isTypeReferenceNode(type) || type.typeName.getText() !== "PolymorphicAttributes")
		return undefined;
	const own = type.typeArguments?.[1];
	return own && ts.isTypeReferenceNode(own) ? layoutPick(own) : undefined;
}

/** Members of the `Props` interface/type alias, or of an inline type literal. */
function resolvePropsType(sf: ts.SourceFile, type: ts.TypeNode | undefined): PropsMembers {
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
			// A base interface declared in the same file (`interface Own`) is part of the component's
			// own contract: inline its members. Anything else (`Omit<HTMLAttributes>`) is `extends`.
			const inherited: ts.TypeElement[] = [];
			const external: string[] = [];
			for (const h of inner.heritageClauses ?? [])
				for (const t of h.types) {
					const base = ts.isIdentifier(t.expression)
						? findDeclDeep(sf, t.expression.text)
						: undefined;
					const picked = layoutPick(t);
					if (picked) inherited.push(...picked);
					else if (base && ts.isInterfaceDeclaration(base) && !t.typeArguments)
						inherited.push(...base.members);
					else external.push(t.getText(sf));
				}
			members = [...inherited, ...inner.members];
			ext = external.join(", ") || undefined;
		} else if (inner && ts.isTypeAliasDeclaration(inner)) {
			const t = inner.type;
			if (ts.isTypeLiteralNode(t)) members = t.members;
			else if (ts.isUnionTypeNode(t)) return resolveUnion(sf, t);
			else if (ts.isIntersectionTypeNode(t)) {
				const own: ts.TypeElement[] = [];
				const rest: string[] = [];
				for (const part of t.types) {
					const polymorphic = polymorphicOwn(part);
					if (ts.isTypeLiteralNode(part)) own.push(...part.members);
					else if (polymorphic) {
						own.push(...polymorphic);
						rest.push("PolymorphicAttributes<T>");
					} else if (ts.isTypeReferenceNode(part) && isLocalInterface(sf, part)) {
						own.push(...resolvePropsType(sf, part).members);
					} else rest.push(part.getText(sf));
				}
				members = own;
				ext = rest.join(" & ") || undefined;
			} else ext = t.getText(sf);
		}
	}
	return { members, ext };
}

/**
 * `type Props = A | B` (a component whose element changes with a prop, e.g. Button on `href`):
 * the documented props are those declared by the FIRST branch (the default rendering, with its
 * JSDoc), made optional when a later branch leaves them out or optional, and the attribute sets of
 * every branch are reported as `extends` so a reader sees all the native attributes that pass through.
 */
function resolveUnion(sf: ts.SourceFile, union: ts.UnionTypeNode): PropsMembers {
	const branches = union.types.map((t) => resolvePropsType(sf, t));
	const named = (m: ts.TypeElement) =>
		ts.isPropertySignature(m) && m.name ? propName(m.name) : "";
	// One entry per prop: the first declaration wins (the shared base, with its docs); a later
	// branch only narrows it (`href?: undefined`, `type?: 'button' | ...`).
	const byName = new Map<string, ts.TypeElement>();
	for (const b of branches)
		for (const m of b.members) if (named(m) && !byName.has(named(m))) byName.set(named(m), m);
	const ext = [...new Set(branches.map((b) => b.ext).filter(Boolean))].join(" | ");
	return { members: [...byName.values()], ext: ext || undefined };
}

/** A reference to an interface declared in the same component script (its members are the component's own props). */
function isLocalInterface(sf: ts.SourceFile, ref: ts.TypeReferenceNode) {
	if (ref.typeArguments) return false;
	const d = findDeclDeep(sf, ref.typeName.getText(sf));
	return !!d && ts.isInterfaceDeclaration(d);
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

/** `'a' | 'b' | 2 | number`: a union whose members are all literals or the `string`/`number` keywords. */
function literalUnionText(type: ts.TypeNode, sf: ts.SourceFile): string | undefined {
	if (!ts.isUnionTypeNode(type)) return undefined;
	const ok = type.types.every(
		(t) =>
			(ts.isLiteralTypeNode(t) && t.literal.kind !== ts.SyntaxKind.NullKeyword) ||
			t.kind === ts.SyntaxKind.StringKeyword ||
			t.kind === ts.SyntaxKind.NumberKeyword
	);
	return ok ? oneLine(type.getText(sf)) : undefined;
}

/** Declaration of `name` (an alias) in `sf` or, when it is imported from a relative module, in that file. */
function findAliasType(
	sf: ts.SourceFile,
	dir: string,
	name: string,
	depth = 0
): { type: ts.TypeNode; sf: ts.SourceFile } | undefined {
	const local = findDeclDeep(sf, name);
	if (local && ts.isTypeAliasDeclaration(local)) return { type: local.type, sf };
	if (depth > 2) return undefined;
	for (const st of sf.statements) {
		if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
		const spec = st.moduleSpecifier.text;
		if (!spec.startsWith(".")) continue;
		const named = st.importClause?.namedBindings;
		if (!named || !ts.isNamedImports(named)) continue;
		const el = named.elements.find((e) => e.name.text === name);
		if (!el) continue;
		const base = resolve(dir, spec.replace(/\.js$/, ""));
		const file = [`${base}.ts`, join(base, "index.ts")].find((f) => existsSync(f));
		if (!file) return undefined;
		const other = ts.createSourceFile(
			file,
			readFileSync(file, "utf8"),
			ts.ScriptTarget.ESNext,
			true
		);
		return findAliasType(other, dirname(file), (el.propertyName ?? el.name).text, depth + 1);
	}
	return undefined;
}

/**
 * A prop typed with a bare alias (`shape?: Shape`) hides its values from the reader. When the alias
 * is a union of literals, show the union. Objects, arrays, generics and external types stay as written.
 */
function expandLiteralAlias(sf: ts.SourceFile, dir: string, type: string): string {
	if (!/^[A-Z]\w*$/.test(type)) return type;
	const hit = findAliasType(sf, dir, type);
	return (hit && literalUnionText(hit.type, hit.sf)) ?? type;
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

/**
 * Text after `@deprecated` in a top-level `/** ... *\/` block of a `<script>` (the replacement to use), or
 * undefined. A `@deprecated` on a prop or declaration inside the component does not deprecate the component.
 */
export function componentDeprecated(src: string): string | undefined {
	for (const script of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
		const body = script[1];
		const sf = ts.createSourceFile("c.ts", body, ts.ScriptTarget.ESNext, true);
		const first = sf.statements[0];
		const ranges = ts.getLeadingCommentRanges(body, first ? first.getFullStart() : 0) ?? [];
		for (const c of ranges) {
			const text = body.slice(c.pos, c.end);
			if (!text.startsWith("/**")) continue;
			const lines = text
				.replace(/^\/\*\*|\*\/$/g, "")
				.split("\n")
				.map((l) => l.replace(/^\s*\*?\s?/, "").trimEnd());
			const at = lines.findIndex((l) => /^@deprecated\b/.test(l.trim()));
			if (at < 0) continue;
			const rest = lines.slice(at);
			const end = rest.findIndex((l, i) => i > 0 && (/^@\w+/.test(l.trim()) || l.trim() === ""));
			return rest
				.slice(0, end < 0 ? undefined : end)
				.join(" ")
				.replace(/^@deprecated\s*/, "")
				.replace(/\s+/g, " ")
				.trim();
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
		classes: [],
		styling: { parts: [], variables: [], data: [] },
		tokens: [],
	};
	const css = componentCss(src, dirname(abs));
	out.styling = extractStyling(css, src, globalTokens());
	out.classes = out.styling.parts.filter((p) => p.stable).map((p) => p.name);
	out.tokens = extractComponentTokens(css, out.classes);

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
		const written = m.type?.getText(m.getSourceFile()).replace(/\s+/g, " ") ?? "unknown";
		const type = expandLiteralAlias(sf, dirname(abs), written);
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
	const deprecated = componentDeprecated(src);
	if (deprecated) out.deprecated = deprecated;
	return out;
}

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
