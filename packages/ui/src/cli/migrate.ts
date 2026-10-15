import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import MagicString from "magic-string";
import { parse } from "svelte/compiler";
// `typescript` is an optional peer: only its types are imported here and the runtime module is
// loaded by `migrate()` (from the project first), so loading this file never needs it.
import type * as TS from "typescript";
import { unifiedDiff } from "./diff.ts";
import { loadTypescript, MISSING_TYPESCRIPT, type TypeScript } from "./typescript.ts";

let ts: TypeScript;

/**
 * A rule receives the TypeScript source of one script (offset-free) and records edits
 * in `s`, which is positioned relative to that script's text.
 */
interface Rule {
	id: string;
	description: string;
	apply(sf: TS.SourceFile, s: MagicString): void;
}

const PACKAGE = /^@codeatlasdev\/ui(\/.*)?$/;

/** Rename a named import from this package (and every reference to it in the file). */
function renameImport(from: string, to: string): Rule["apply"] {
	return (sf, s) => {
		// Local names bound to the old export; `import { X as Y }` keeps Y, only the source name changes.
		const locals: string[] = [];
		for (const st of sf.statements) {
			if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
			if (!PACKAGE.test(st.moduleSpecifier.text)) continue;
			const named = st.importClause?.namedBindings;
			if (!named || !ts.isNamedImports(named)) continue;
			for (const el of named.elements) {
				if ((el.propertyName ?? el.name).text !== from) continue;
				if (el.propertyName) {
					// `{ From as Local }`: only the exported name changes.
					s.overwrite(el.propertyName.getStart(sf), el.propertyName.getEnd(), to);
				} else {
					s.overwrite(el.name.getStart(sf), el.name.getEnd(), to);
					locals.push(from);
				}
			}
		}
		if (!locals.length) return;
		const visit = (n: TS.Node) => {
			// Skip the import specifiers themselves (already rewritten) and property/member names.
			if (ts.isImportDeclaration(n)) return;
			if (ts.isIdentifier(n) && n.text === from && !isMemberName(n))
				s.overwrite(n.getStart(sf), n.getEnd(), to);
			ts.forEachChild(n, visit);
		};
		visit(sf);
	};
}

/** `obj.Name`, `{ Name: 1 }` and `interface { Name: T }` are not references to the imported binding. */
function isMemberName(n: TS.Identifier): boolean {
	const p = n.parent;
	return (
		(ts.isPropertyAccessExpression(p) && p.name === n) ||
		(ts.isPropertyAssignment(p) && p.name === n) ||
		(ts.isPropertySignature(p) && p.name === n) ||
		(ts.isQualifiedName(p) && p.right === n)
	);
}

/** Rules in the order they shipped. Add one per breaking rename; never edit a released rule. */
export const RULES: Rule[] = [
	{
		id: "brand-preset-to-preset-definition",
		description: "`BrandPreset` was renamed to `PresetDefinition` ({ id, color, label? }).",
		apply: renameImport("BrandPreset", "PresetDefinition"),
	},
];

// ─── Component rewrites (markup + imports) ─────────────────────────────────────
// GlassCard → Card, GlassSurface → Surface, Row → Flex. Static props are mapped; an element with
// a dynamic or spread prop that has no static mapping is left as it was (and its import kept), so
// the deprecated component keeps working until a human rewrites it.

const ELEVATION: Record<string, number> = {
	"ultra-thin": 1,
	thin: 2,
	regular: 3,
	thick: 4,
	chrome: 5,
};
const SPACE_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10, 11, 12, 16, 20, 24];
const ALIGN_MAP: Record<string, string> = {
	"flex-start": "start",
	"flex-end": "end",
	start: "start",
	end: "end",
	center: "center",
	stretch: "stretch",
	baseline: "baseline",
};
const JUSTIFY_MAP: Record<string, string> = {
	"flex-start": "start",
	"flex-end": "end",
	start: "start",
	end: "end",
	center: "center",
	"space-between": "between",
	"space-around": "around",
	"space-evenly": "evenly",
};

interface AttrNode {
	type: string;
	start: number;
	end: number;
	data?: string;
	expression?: { type: string; value?: unknown };
}

interface Attr {
	start: number;
	end: number;
	name?: string;
	type: string;
	value?: true | AttrNode[] | AttrNode;
}

/** Static string value of an attribute (`a="x"` or `a={"x"}`), or undefined when dynamic. */
function staticText(a: Attr): string | undefined {
	const v = a.value;
	if (!v || v === true) return undefined;
	const nodes = Array.isArray(v) ? v : [v];
	if (nodes.length !== 1) return undefined;
	const n = nodes[0];
	if (n.type === "Text") return n.data;
	if (
		n.type === "ExpressionTag" &&
		n.expression?.type === "Literal" &&
		typeof n.expression.value === "string"
	)
		return n.expression.value;
	return undefined;
}

/** Static boolean of `a`, `a={true}`, `a={false}`; undefined when dynamic. */
function staticBool(a: Attr): boolean | undefined {
	const v = a.value;
	if (v === true || v === undefined) return true;
	const nodes = Array.isArray(v) ? v : [v];
	const n = nodes[0];
	if (
		nodes.length === 1 &&
		n.type === "ExpressionTag" &&
		n.expression?.type === "Literal" &&
		typeof n.expression.value === "boolean"
	)
		return n.expression.value;
	return undefined;
}

/** Static number of `a={8}`; undefined otherwise. */
function staticNumber(a: Attr): number | undefined {
	const v = a.value;
	if (!v || v === true) return undefined;
	const n = (Array.isArray(v) ? v : [v])[0];
	if (
		n?.type === "ExpressionTag" &&
		n.expression?.type === "Literal" &&
		typeof n.expression.value === "number"
	)
		return n.expression.value;
	return undefined;
}

/** Source of `a={expr}`'s expression, or undefined for any other value form. */
function exprText(a: Attr, src: string): string | undefined {
	const v = a.value;
	if (!v || v === true || Array.isArray(v)) return undefined;
	if (v.type !== "ExpressionTag") return undefined;
	return src.slice(v.start + 1, v.end - 1).trim();
}

/** `padding="24px"` / `padding={24}` as a spacing step ("6"), when it sits on the scale. */
function paddingStep(a: Attr): string | undefined {
	const n = staticNumber(a);
	const t = staticText(a);
	const px = n ?? (t && /^\d+(\.\d+)?px$/.test(t) ? Number.parseFloat(t) : undefined);
	return px !== undefined && SPACE_STEPS.includes(px / 4) ? String(px / 4) : undefined;
}

/** `gap={8}` / `gap="2"` as the step string ("2"); undefined when off the scale or dynamic. */
function gapStep(a: Attr): string | undefined {
	const n = staticNumber(a);
	const t = staticText(a);
	const step = n !== undefined ? n / 4 : t !== undefined ? Number(t) : Number.NaN;
	return SPACE_STEPS.includes(step) ? String(step) : undefined;
}

/**
 * Rewrites the props Row, Stack and Grid share (gap, align, justify) and passes the rest through.
 * `extra` handles a component-specific prop; return undefined to pass it through, null to give up.
 */
function layoutProps(
	attrs: Attr[],
	src: string,
	extra: (a: Attr) => string | null | undefined = () => undefined
): string[] | null {
	const out: string[] = [];
	for (const a of attrs) {
		if (a.type !== "Attribute") return null;
		const text = src.slice(a.start, a.end);
		if (a.name === "gap") {
			const step = gapStep(a);
			if (!step) return null;
			out.push(`gap="${step}"`);
		} else if (a.name === "align") {
			const v = staticText(a);
			if (v === undefined || !(v in ALIGN_MAP)) return null;
			out.push(`align="${ALIGN_MAP[v]}"`);
		} else if (a.name === "justify") {
			const v = staticText(a);
			if (v === undefined || !(v in JUSTIFY_MAP)) return null;
			out.push(`justify="${JUSTIFY_MAP[v]}"`);
		} else {
			const mapped = extra(a);
			if (mapped === null) return null;
			out.push(mapped ?? text);
		}
	}
	return out;
}

type Rewrite = (attrs: Attr[], src: string) => string[] | null;

/** Props are rewritten to the text of the new attributes; `null` leaves the element alone. */
const COMPONENT_REWRITES: Record<string, { to: string; rewrite: Rewrite }> = {
	GlassCard: {
		to: "Card",
		rewrite(attrs, src) {
			let elevation: number | undefined;
			const out: string[] = [];
			let tone = false;
			let dynamicTone: string | undefined;
			let glow = false;
			const rest: string[] = [];
			for (const a of attrs) {
				if (a.type !== "Attribute") return null;
				const text = src.slice(a.start, a.end);
				if (a.name === "thickness") {
					const t = staticText(a);
					if (t === undefined || !(t in ELEVATION)) return null;
					elevation = ELEVATION[t];
				} else if (a.name === "tinted") {
					const b = staticBool(a);
					if (b !== undefined) tone = b;
					else {
						const e = exprText(a, src);
						if (!e) return null;
						dynamicTone = `tone={${e} ? "brand" : "neutral"}`;
					}
				} else if (a.name === "glowing") {
					const b = staticBool(a);
					if (b === undefined) return null;
					glow = b;
				} else if (a.name === "padding") {
					const step = paddingStep(a);
					if (!step) return null;
					rest.push(`p="${step}"`);
				} else rest.push(text);
			}
			out.push('material="glass"');
			if (dynamicTone) out.push(dynamicTone);
			if (elevation !== undefined && elevation !== 3) out.push(`elevation={${elevation}}`);
			if (tone) out.push('tone="brand"');
			if (glow) out.push("glow");
			return [...out, ...rest];
		},
	},
	GlassSurface: {
		to: "Surface",
		rewrite(attrs, src) {
			let elevation: number | undefined;
			let liquid = true;
			let tone = false;
			let glow = false;
			const rest: string[] = [];
			for (const a of attrs) {
				if (a.type !== "Attribute") return null;
				const text = src.slice(a.start, a.end);
				if (a.name === "thickness") {
					const t = staticText(a);
					if (t === undefined || !(t in ELEVATION)) return null;
					elevation = ELEVATION[t];
				} else if (a.name === "refraction") {
					const b = staticBool(a);
					if (b === undefined) return null;
					liquid = b;
				} else if (a.name === "tinted") {
					const b = staticBool(a);
					if (b === undefined) return null;
					tone = b;
				} else if (a.name === "glowing") {
					const b = staticBool(a);
					if (b === undefined) return null;
					glow = b;
				} else rest.push(text);
			}
			const out = [`material="${liquid ? "liquid" : "glass"}"`];
			if (elevation !== undefined && elevation !== 3) out.push(`elevation={${elevation}}`);
			if (tone) out.push('tone="brand"');
			if (glow) out.push("glow");
			return [...out, ...rest];
		},
	},
	Row: {
		to: "Flex",
		rewrite: (attrs, src) => layoutProps(attrs, src),
	},
	Stack: {
		to: "Stack",
		rewrite: (attrs, src) => layoutProps(attrs, src),
	},
	Grid: {
		to: "Grid",
		// `cols={3}` is `columns={3}`; a template string ("2fr 1fr") needs a class, so it stays for a human.
		rewrite: (attrs, src) =>
			layoutProps(attrs, src, (a) => {
				if (a.name === "rowGap" || a.name === "colGap") return null;
				if (a.name !== "cols") return undefined;
				const n = staticNumber(a);
				return n !== undefined && n >= 1 && n <= 12 ? `columns={${n}}` : null;
			}),
	},
};

interface ComponentNode {
	type: string;
	name: string;
	start: number;
	end: number;
	attributes: Attr[];
	fragment: { nodes: ComponentNode[] };
	[key: string]: unknown;
}

/** Every Component node of a template, depth first (children of any block or element). */
function components(node: unknown, out: ComponentNode[] = []): ComponentNode[] {
	if (!node || typeof node !== "object") return out;
	if (Array.isArray(node)) {
		for (const n of node) components(n, out);
		return out;
	}
	const n = node as ComponentNode;
	if (n.type === "Component") out.push(n);
	for (const key of Object.keys(n)) {
		if (key === "parent" || key === "expression" || key === "attributes") continue;
		const v = n[key];
		if (v && typeof v === "object") components(v, out);
	}
	return out;
}

/** Local name → { imported, specifier } for `import { X as Y } from "@codeatlasdev/ui"` of a rewritable component. */
function importedComponents(script: TS.SourceFile): Map<string, string> {
	const map = new Map<string, string>();
	for (const st of script.statements) {
		if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
		if (!PACKAGE.test(st.moduleSpecifier.text)) continue;
		const named = st.importClause?.namedBindings;
		if (!named || !ts.isNamedImports(named)) continue;
		for (const el of named.elements) {
			const imported = (el.propertyName ?? el.name).text;
			if (imported in COMPONENT_REWRITES) map.set(el.name.text, imported);
		}
	}
	return map;
}

/**
 * Rewrite imports in one script. `keep` lists local names still used by an element that could not
 * be rewritten: their import stays. Returns the new local name for each renamed binding.
 */
function rewriteComponentImports(
	sf: TS.SourceFile,
	s: MagicString,
	keep: Set<string>,
	rewritten: Set<string>,
	markup: boolean
): void {
	for (const st of sf.statements) {
		if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
		if (!PACKAGE.test(st.moduleSpecifier.text)) continue;
		const named = st.importClause?.namedBindings;
		if (!named || !ts.isNamedImports(named)) continue;
		const present = new Set(named.elements.map((e) => (e.propertyName ?? e.name).text));
		for (const el of named.elements) {
			const imported = (el.propertyName ?? el.name).text;
			const target = COMPONENT_REWRITES[imported]?.to;
			if (!target || target === imported) continue;
			if (keep.has(el.name.text)) {
				// Some usages stay on the deprecated component: import the replacement next to it.
				if (rewritten.has(el.name.text) && !el.propertyName && !present.has(target))
					s.appendLeft(el.getStart(sf), `${target}, `);
				continue;
			}
			if (el.propertyName) {
				s.overwrite(el.propertyName.getStart(sf), el.propertyName.getEnd(), target);
			} else if (present.has(target) && markup) {
				// `Card` is imported already: drop the deprecated binding and its comma.
				const idx = named.elements.indexOf(el);
				const from = idx > 0 ? named.elements[idx - 1].getEnd() : el.getStart(sf);
				const to = idx > 0 ? el.getEnd() : (named.elements[idx + 1]?.getStart(sf) ?? el.getEnd());
				s.remove(from, to);
			} else s.overwrite(el.name.getStart(sf), el.name.getEnd(), target);
		}
	}
}

/** Rename plain references (not markup) in script code to the new binding. */
function renameScriptReferences(
	sf: TS.SourceFile,
	s: MagicString,
	renames: Map<string, string>,
	keep: Set<string>
): void {
	const visit = (n: TS.Node) => {
		if (ts.isImportDeclaration(n)) return;
		if (ts.isIdentifier(n) && renames.has(n.text) && !keep.has(n.text) && !isMemberName(n))
			s.overwrite(n.getStart(sf), n.getEnd(), renames.get(n.text) as string);
		ts.forEachChild(n, visit);
	};
	visit(sf);
}

/**
 * Component migrations for one file. Svelte files rewrite markup and the `<script>` imports;
 * ts/js files rewrite imports and references. Returns the new source, or the input when unchanged.
 */
function migrateComponents(path: string, src: string): string {
	const out = new MagicString(src);
	if (path.endsWith(".svelte")) {
		const ast = parse(src, { modern: true });
		const scripts = [ast.instance, ast.module].filter(Boolean) as { start: number; end: number }[];
		const bindings = new Map<string, string>();
		const sfs: { sf: TS.SourceFile; start: number; text: string }[] = [];
		for (const sc of scripts) {
			const tag = src.slice(sc.start, sc.end);
			const open = tag.indexOf(">") + 1;
			const text = tag.slice(open, tag.lastIndexOf("</script>"));
			const sf = ts.createSourceFile(path, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
			for (const [local, imported] of importedComponents(sf)) bindings.set(local, imported);
			sfs.push({ sf, start: sc.start + open, text });
		}
		if (!bindings.size) return src;
		const keep = new Set<string>();
		const rewritten = new Set<string>();
		for (const node of components(ast.fragment)) {
			const imported = bindings.get(node.name);
			if (!imported) continue;
			const rule = COMPONENT_REWRITES[imported];
			const attrs = rule.rewrite(node.attributes, src);
			if (!attrs) {
				keep.add(node.name);
				continue;
			}
			const rename = node.name === imported ? rule.to : node.name;
			rewritten.add(node.name);
			// Opening tag: `<Name attr attr>` or `<Name attr />`; the attributes are replaced wholesale.
			const first = node.attributes[0]?.start ?? node.start + 1 + node.name.length;
			const last = node.attributes.length ? node.attributes[node.attributes.length - 1].end : first;
			const tagEnd = src.indexOf(">", last);
			const selfClosing = src[tagEnd - 1] === "/";
			const openEnd = selfClosing ? src.lastIndexOf("/", tagEnd) : tagEnd;
			out.overwrite(
				node.start,
				openEnd,
				`<${rename}${attrs.length ? ` ${attrs.join(" ")}` : ""}${selfClosing ? " " : ""}`
			);
			if (!selfClosing) {
				const closeTag = `</${node.name}>`;
				const closeStart = src.lastIndexOf(closeTag, node.end);
				if (closeStart > node.start)
					out.overwrite(closeStart, closeStart + closeTag.length, `</${rename}>`);
			}
		}
		const renames = new Map<string, string>();
		for (const [local, imported] of bindings)
			if (local === imported) renames.set(local, COMPONENT_REWRITES[imported].to);
		for (const { sf, start, text } of sfs) {
			const local = new MagicString(text);
			rewriteComponentImports(sf, local, keep, rewritten, true);
			renameScriptReferences(sf, local, renames, keep);
			if (local.hasChanged()) out.overwrite(start, start + text.length, local.toString());
		}
		return out.toString();
	}
	if (/\.(ts|js|mts|mjs)$/.test(path)) {
		const sf = ts.createSourceFile(
			path,
			src,
			ts.ScriptTarget.ESNext,
			true,
			path.endsWith("ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS
		);
		const bindings = importedComponents(sf);
		if (!bindings.size) return src;
		const renames = new Map<string, string>();
		for (const [local, imported] of bindings)
			if (local === imported) renames.set(local, COMPONENT_REWRITES[imported].to);
		rewriteComponentImports(sf, out, new Set(), new Set(), false);
		renameScriptReferences(sf, out, renames, new Set());
		return out.toString();
	}
	return src;
}

interface Script {
	/** Offset of the script text inside the file. */
	start: number;
	text: string;
	kind: TS.ScriptKind;
}

/** Script blocks of a file: whole file for ts/js, `<script>` bodies for .svelte (parsed by svelte/compiler). */
function scripts(path: string, src: string): Script[] {
	if (/\.(ts|js|mts|mjs)$/.test(path))
		return [
			{ start: 0, text: src, kind: path.endsWith("ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS },
		];
	if (path.endsWith(".svelte")) {
		const ast = parse(src, { modern: true });
		return [ast.instance, ast.module].flatMap((sc) => {
			if (!sc) return [];
			// `sc` spans the whole `<script ...>...</script>`; the body sits between its `>` and the closing tag.
			const tag = src.slice(sc.start, sc.end);
			const open = tag.indexOf(">") + 1;
			const close = tag.lastIndexOf("</script>");
			return [{ start: sc.start + open, text: tag.slice(open, close), kind: ts.ScriptKind.TS }];
		});
	}
	if (path.endsWith(".astro")) {
		const m = src.match(/^---\n([\s\S]*?)\n---/);
		return m ? [{ start: 4, text: m[1], kind: ts.ScriptKind.TS }] : [];
	}
	return [];
}

export interface MigrateOptions {
	write?: boolean;
	cwd?: string;
	log?: (line: string) => void;
}

/** Apply every rule to `files`. Returns true when the run finished (changes found are not an error); false when `typescript` cannot be found. */
export function migrate(
	files: string[],
	{ write = false, cwd = process.cwd(), log = console.log }: MigrateOptions = {}
): boolean {
	const loaded = loadTypescript(cwd);
	if (!loaded) {
		log(MISSING_TYPESCRIPT);
		return false;
	}
	ts = loaded;
	let changed = 0;
	for (const file of files) {
		const src = readFileSync(file, "utf8");
		if (!src.includes("@codeatlasdev/ui")) continue;
		let current = src;
		try {
			current = migrateComponents(file, src);
		} catch (e) {
			log(`  skip    ${relative(cwd, file)}: ${(e as Error).message}`);
			continue;
		}
		const out = new MagicString(current);
		try {
			for (const sc of scripts(file, current)) {
				const sf = ts.createSourceFile(file, sc.text, ts.ScriptTarget.ESNext, true, sc.kind);
				// Rules edit a script-local MagicString; shift into file coordinates by editing via a slice view.
				const local = new MagicString(sc.text);
				for (const rule of RULES) rule.apply(sf, local);
				if (local.hasChanged())
					out.overwrite(sc.start, sc.start + sc.text.length, local.toString());
			}
		} catch (e) {
			log(`  skip    ${relative(cwd, file)}: ${(e as Error).message}`);
			continue;
		}
		const next = out.toString();
		if (next === src) continue;
		changed++;
		const rel = relative(cwd, file);
		if (write) {
			writeFileSync(file, next);
			log(`  migrate ${rel}`);
		} else log(`${unifiedDiff(rel, src, next)}\n`);
	}
	if (!changed) log("Nothing to migrate.");
	else if (!write) log(`${changed} file(s) would change. Re-run with --write to apply.`);
	return true;
}
