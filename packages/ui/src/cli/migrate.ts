import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import MagicString from "magic-string";
import { parse } from "svelte/compiler";
// `typescript` is an optional peer: only its types are imported here and the runtime module is
// loaded by `migrate()` (from the project first), so loading this file never needs it.
import type * as TS from "typescript";
import { unifiedDiff } from "./diff.ts";
import { loadMigrations, type MigrationFile, migrationsBetween } from "./migrations.ts";
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

/**
 * Before 1.0 a `NavModule` was `{ path, sections }`; it is `{ basePath, items }`. Only an object with an
 * `icon` and a `sections` array is a module (a route table with a `path` is not), and only its own keys are
 * renamed: the `NavItem`s inside keep `path`.
 */
const navModuleKeys: Rule["apply"] = (sf, s) => {
	const visit = (n: TS.Node) => {
		if (ts.isObjectLiteralExpression(n)) {
			const named = (name: string) =>
				n.properties.find(
					(p): p is TS.PropertyAssignment =>
						ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name
				);
			const sections = named("sections");
			if (sections && named("icon") && ts.isArrayLiteralExpression(sections.initializer)) {
				const path = named("path");
				if (path) s.overwrite(path.name.getStart(sf), path.name.getEnd(), "basePath");
				s.overwrite(sections.name.getStart(sf), sections.name.getEnd(), "items");
			}
		}
		ts.forEachChild(n, visit);
	};
	visit(sf);
};

/**
 * Rules in the order they shipped. Add one per breaking rename; never edit a released rule.
 * `migrations/<major>.json` names a rule by `id` (`codemodId`); a test fails when it names one that is missing.
 */
export const RULES: Rule[] = [
	{
		id: "brand-preset-to-preset-definition",
		description: "`BrandPreset` was renamed to `PresetDefinition` ({ id, color, label? }).",
		apply: renameImport("BrandPreset", "PresetDefinition"),
	},
	{
		id: "nav-module-path-sections",
		description: "`NavModule` `path`/`sections` became `basePath`/`items`.",
		apply: navModuleKeys,
	},
];

/** `class="selectable"`, `class="a selectable b"` and `class:selectable` in markup, `.selectable` in a style block. */
function renameSelectable(path: string, src: string): string {
	if (!/\.(svelte|astro|mdx|css)$/.test(path) || !/\bselectable\b/.test(src)) return src;
	const out = new MagicString(src);
	for (const m of src.matchAll(/\bclass(=|:)(?:"([^"]*)"|'([^']*)'|selectable\b)/g)) {
		if (m[1] === ":") {
			out.overwrite(m.index, m.index + "class:selectable".length, "class:ca-selectable");
			continue;
		}
		const value = m[2] ?? m[3];
		if (value === undefined || !/(^|\s)selectable(\s|$)/.test(value)) continue;
		const at = m.index + m[0].indexOf(value);
		out.overwrite(
			at,
			at + value.length,
			value.replace(/(^|\s)selectable(?=\s|$)/g, "$1ca-selectable")
		);
	}
	for (const m of src.matchAll(/(^|[\s,>}])\.selectable(?![\w-])/gm))
		out.overwrite(m.index + m[1].length, m.index + m[0].length, ".ca-selectable");
	return out.toString();
}

/** Ids `migrations/*.json` may name. `layout-primitives` is the markup rewrite below (not a script `Rule`). */
export const CODEMOD_IDS: readonly string[] = [
	...RULES.map((r) => r.id),
	"layout-primitives",
	"selectable-to-ca-selectable",
	"setlocale-to-i18nprovider",
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
/** `GlassCard`/`GlassSurface` defaulted to `thickness="regular"`; `Card`/`Surface` default to elevation 1, so it is always written. */
const DEFAULT_ELEVATION = ELEVATION.regular;
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

/** Why an element (or one of its props) was left as it was, and what to do by hand. */
interface Left {
	reason: string;
	recipe: string;
}

/** Rewritten attribute text; `left` is set when a prop could not be mapped and was kept verbatim. */
type Rewritten = { attrs: string[]; left?: Left };

/** Layout props keep a step meaning for `gap`: an untouched numeric one would silently become 4x. */
const GAP_RECIPE = 'use a step string: px / 4, e.g. gap={16} is gap="4"';

/** Reason a `gap` attribute has no step, for the report. */
function gapLeft(a: Attr): Left {
	const t = staticText(a);
	const n = staticNumber(a);
	const off = n !== undefined || t !== undefined;
	return {
		reason: off ? `gap ${n ?? JSON.stringify(t)} is off the spacing scale` : "dynamic gap",
		recipe: GAP_RECIPE,
	};
}

/**
 * Rewrites the props Row, Stack and Grid share (gap, align, justify) and passes the rest through.
 * `extra` handles a component-specific prop: return a string to replace it, undefined to pass it
 * through, a `Left` to keep it verbatim. A prop that cannot be mapped is kept as it was and reported,
 * but the others (notably `gap`, whose meaning changed from px to a step) are still converted.
 */
function layoutProps(
	attrs: Attr[],
	src: string,
	extra: (a: Attr) => string | Left | undefined = () => undefined
): Rewritten | Left {
	const out: string[] = [];
	let left: Left | undefined;
	const keep = (a: Attr, why: Left) => {
		left ??= why;
		out.push(src.slice(a.start, a.end));
	};
	for (const a of attrs) {
		if (a.type !== "Attribute")
			return { reason: "spread or directive props", recipe: "map the props by hand" };
		const text = src.slice(a.start, a.end);
		if (a.name === "gap") {
			const step = gapStep(a);
			if (step) out.push(`gap="${step}"`);
			else keep(a, gapLeft(a));
		} else if (a.name === "align") {
			const v = staticText(a);
			if (v !== undefined && v in ALIGN_MAP) out.push(`align="${ALIGN_MAP[v]}"`);
			else
				keep(a, {
					reason: "dynamic or unknown align",
					recipe: "use start | center | end | stretch | baseline",
				});
		} else if (a.name === "justify") {
			const v = staticText(a);
			if (v !== undefined && v in JUSTIFY_MAP) out.push(`justify="${JUSTIFY_MAP[v]}"`);
			else
				keep(a, {
					reason: "dynamic or unknown justify",
					recipe: "use start | center | end | between | around | evenly",
				});
		} else {
			const mapped = extra(a);
			if (typeof mapped === "object") keep(a, mapped);
			else out.push(mapped ?? text);
		}
	}
	return left ? { attrs: out, left } : { attrs: out };
}

type Rewrite = (attrs: Attr[], src: string) => Rewritten | Left;

/** Left element: the deprecated component keeps working, so the whole tag stays for a human. */
const left = (reason: string, recipe: string): Left => ({ reason, recipe });
const SPREAD = left("spread or directive props", "map the props by hand");
const THICKNESS = left("dynamic thickness", "pick elevation 1-5 (thin 2, regular 3, thick 4)");

/** Props are rewritten to the text of the new attributes; a `Left` leaves the element alone. */
const COMPONENT_REWRITES: Record<string, { to: string; rewrite: Rewrite }> = {
	GlassCard: {
		to: "Card",
		rewrite(attrs, src) {
			let elevation = DEFAULT_ELEVATION;
			const out: string[] = [];
			let tone = false;
			let dynamicTone: string | undefined;
			let glow = false;
			const rest: string[] = [];
			for (const a of attrs) {
				if (a.type !== "Attribute") return SPREAD;
				const text = src.slice(a.start, a.end);
				if (a.name === "thickness") {
					const t = staticText(a);
					if (t === undefined || !(t in ELEVATION)) return THICKNESS;
					elevation = ELEVATION[t];
				} else if (a.name === "tinted") {
					const b = staticBool(a);
					if (b !== undefined) tone = b;
					else {
						const e = exprText(a, src);
						if (!e) return left("dynamic tinted", 'use tone="brand" | "neutral"');
						dynamicTone = `tone={${e} ? "brand" : "neutral"}`;
					}
				} else if (a.name === "glowing") {
					const b = staticBool(a);
					if (b === undefined) return left("dynamic glowing", "use the glow prop");
					glow = b;
				} else if (a.name === "padding") {
					const step = paddingStep(a);
					if (!step)
						return left("padding is dynamic or off the spacing scale", "use p with a step");
					rest.push(`p="${step}"`);
				} else rest.push(text);
			}
			out.push('material="glass"');
			if (dynamicTone) out.push(dynamicTone);
			out.push(`elevation={${elevation}}`);
			if (tone) out.push('tone="brand"');
			if (glow) out.push("glow");
			return { attrs: [...out, ...rest] };
		},
	},
	GlassSurface: {
		to: "Surface",
		rewrite(attrs, src) {
			let elevation = DEFAULT_ELEVATION;
			let liquid = true;
			let tone = false;
			let glow = false;
			const rest: string[] = [];
			for (const a of attrs) {
				if (a.type !== "Attribute") return SPREAD;
				const text = src.slice(a.start, a.end);
				if (a.name === "thickness") {
					const t = staticText(a);
					if (t === undefined || !(t in ELEVATION)) return THICKNESS;
					elevation = ELEVATION[t];
				} else if (a.name === "refraction") {
					const b = staticBool(a);
					if (b === undefined) return left("dynamic refraction", 'use material="liquid" | "glass"');
					liquid = b;
				} else if (a.name === "tinted") {
					const b = staticBool(a);
					if (b === undefined) return left("dynamic tinted", 'use tone="brand" | "neutral"');
					tone = b;
				} else if (a.name === "glowing") {
					const b = staticBool(a);
					if (b === undefined) return left("dynamic glowing", "use the glow prop");
					glow = b;
				} else rest.push(text);
			}
			const out = [`material="${liquid ? "liquid" : "glass"}"`];
			out.push(`elevation={${elevation}}`);
			if (tone) out.push('tone="brand"');
			if (glow) out.push("glow");
			return { attrs: [...out, ...rest] };
		},
	},
	Row: {
		to: "Flex",
		// `Row` still maps px gaps itself, so an element with a prop left over stays a `Row` as a whole.
		rewrite(attrs, src) {
			const r = layoutProps(attrs, src);
			return "left" in r && r.left ? r.left : r;
		},
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
				if (a.name === "rowGap" || a.name === "colGap")
					return left(`${a.name} was removed`, "write row-gap / column-gap in a class");
				if (a.name !== "cols") return undefined;
				const n = staticNumber(a);
				if (n !== undefined && n >= 1 && n <= 12) return `columns={${n}}`;
				return staticText(a) !== undefined
					? left("cols is a template string", "write grid-template-columns in a class")
					: left("dynamic cols", "use columns={1-12}, or grid-template-columns in a class");
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

/** A usage the codemod left as it was (or partly), for the end-of-run report. */
interface Skipped extends Left {
	file: string;
	line: number;
	component: string;
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
 * Elements (or props) that could not be mapped are pushed to `skipped`.
 */
function migrateComponents(path: string, src: string, skipped: Skipped[]): string {
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
			const result = rule.rewrite(node.attributes, src);
			const why = "reason" in result ? result : result.left;
			if (why)
				skipped.push({
					file: path,
					line: src.slice(0, node.start).split("\n").length,
					component: node.name,
					...why,
				});
			if ("reason" in result) {
				keep.add(node.name);
				continue;
			}
			const { attrs } = result;
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
	/** Return false (exit 1) when a usage was left for a human. */
	strict?: boolean;
	cwd?: string;
	log?: (line: string) => void;
	/** Major the project is on. With `to`, only the changes of the majors in (from, to] run and are reported. */
	from?: number;
	/** Major the project is moving to (default: the newest the registry knows). */
	to?: number;
	/** Print the run as one document instead of lines: `json` or `md`. */
	report?: "json" | "md";
	/** Registry to use (default: the shipped `migrations/`). */
	migrations?: MigrationFile[];
}

/** A known breaking change the codemod cannot rewrite, located in the project (or the whole-project note). */
export interface Leftover {
	id: string;
	file?: string;
	line?: number;
	/** `Component: reason (recipe)` for a usage a codemod left, else the replacement from the registry. */
	note: string;
	component?: string;
}

/** The registry entry a left component usage belongs to. */
const COMPONENT_MIGRATION: Record<string, string> = {
	Grid: "v3-grid-columns",
	Stack: "v3-gap-step-scale",
	Row: "v3-row-to-flex",
	GlassCard: "v3-glasscard-to-card",
	GlassSurface: "v3-glasssurface-to-surface",
};

const SCANNED = /\.(svelte|ts|js|mts|mjs|astro|css|mdx)$/;

/** File:line of every greppable old usage the registry names, for the entries a codemod cannot finish. */
function scanLeftovers(
	files: string[],
	files_: MigrationFile[],
	cwd: string,
	rewritten: Set<string>
): Leftover[] {
	const out: Leftover[] = [];
	for (const e of files_.flatMap((m) => m.entries)) {
		if (!e.detect || (e.codemod === "yes" && rewritten.has(e.codemodId ?? ""))) continue;
		const re = new RegExp(e.detect);
		for (const file of files.filter((f) => SCANNED.test(f))) {
			const lines = readFileSync(file, "utf8").split("\n");
			lines.forEach((text, i) => {
				if (re.test(text) && !/ca-ui-migrated\(/.test(text))
					out.push({ id: e.id, file: relative(cwd, file), line: i + 1, note: e.replacement });
			});
		}
	}
	return out;
}

/** The codemods of the majors in range; without a range, all of them (the historical behavior). */
function activeIds(range: MigrationFile[] | undefined): Set<string> {
	if (!range) return new Set(CODEMOD_IDS);
	return new Set(
		range.flatMap((m) => m.entries.flatMap((e) => (e.codemodId ? [e.codemodId] : [])))
	);
}

/**
 * Apply the codemods of the range to `files`. Returns true when the run finished (changes found are not
 * an error); false when `typescript` cannot be found, or with `strict` when something was left for a human.
 */
export function migrate(
	files: string[],
	{
		write = false,
		strict = false,
		cwd = process.cwd(),
		log = console.log,
		from,
		to,
		report,
		migrations,
	}: MigrateOptions = {}
): boolean {
	const loaded = loadTypescript(cwd);
	if (!loaded) {
		log(MISSING_TYPESCRIPT);
		return false;
	}
	ts = loaded;
	const registry = migrations ?? loadMigrations();
	const newest = Math.max(...registry.map((m) => m.major));
	const ranged = from !== undefined || to !== undefined;
	const range = ranged ? migrationsBetween(from ?? 0, to ?? newest, registry) : undefined;
	const active = activeIds(range);
	const scope = range ?? registry;
	let changed = 0;
	const skipped: Skipped[] = [];
	const touched: string[] = [];
	const applied = new Set<string>();
	for (const file of files) {
		const src = readFileSync(file, "utf8");
		let current = src;
		if (src.includes("@codeatlasdev/ui")) {
			try {
				if (active.has("layout-primitives")) current = migrateComponents(file, src, skipped);
			} catch (e) {
				log(`  skip    ${relative(cwd, file)}: ${(e as Error).message}`);
				continue;
			}
		}
		if (active.has("selectable-to-ca-selectable")) current = renameSelectable(file, current);
		const out = new MagicString(current);
		if (src.includes("@codeatlasdev/ui"))
			try {
				for (const sc of scripts(file, current)) {
					const sf = ts.createSourceFile(file, sc.text, ts.ScriptTarget.ESNext, true, sc.kind);
					// Rules edit a script-local MagicString; shift into file coordinates by editing via a slice view.
					const local = new MagicString(sc.text);
					for (const rule of RULES) if (active.has(rule.id)) rule.apply(sf, local);
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
		touched.push(relative(cwd, file));
		for (const id of CODEMOD_IDS) if (active.has(id)) applied.add(id);
		const rel = relative(cwd, file);
		if (write) {
			writeFileSync(file, next);
			if (!report) log(`  migrate ${rel}`);
		} else if (!report) log(`${unifiedDiff(rel, src, next)}\n`);
	}

	// What no codemod finishes: the old usages the registry can still locate, then the notes without a locator.
	const leftovers = scanLeftovers(files, scope, cwd, applied);
	const manual = scope
		.flatMap((m) => m.entries)
		.filter((e) => e.codemod !== "yes" && !leftovers.some((l) => l.id === e.id))
		.map((e) => ({ id: e.id, note: e.replacement }));
	// A usage the component rewrite left is also a registry detection when its line matches: keep the richer note once.
	const seen = new Set<string>();
	const unmapped: Leftover[] = [
		...skipped.map((u) => ({
			id: COMPONENT_MIGRATION[u.component] ?? "v3-gap-step-scale",
			file: relative(cwd, u.file),
			line: u.line,
			component: u.component,
			note: `${u.reason} (${u.recipe})`,
		})),
		...leftovers,
	].filter((l) => {
		const key = `${l.id} ${l.file}:${l.line}`;
		return seen.has(key) ? false : !!seen.add(key);
	});

	if (report === "json") {
		log(
			JSON.stringify(
				{
					from: from ?? null,
					to: to ?? newest,
					write,
					changed: touched,
					left: unmapped,
					review: manual,
				},
				null,
				"\t"
			)
		);
	} else if (report === "md") {
		log(reportMarkdown(from, to ?? newest, touched, unmapped, manual));
	} else {
		if (!changed)
			log(
				ranged
					? `Nothing to rewrite for ${rangeLabel(from, to ?? newest)}: checked ${[...active].join(", ") || "no codemods"}.`
					: `Nothing to rewrite: checked ${[...active].join(", ")}. Run with --from <major> --to <major> for the per-major report.`
			);
		else if (!write) log(`${changed} file(s) would change. Re-run with --write to apply.`);
		if (unmapped.length) {
			log(`\nleft ${unmapped.length} usage${unmapped.length === 1 ? "" : "s"}:`);
			for (const u of unmapped)
				log(
					u.component
						? `  ${u.file}:${u.line} ${u.component}: ${u.note} [${u.id}]`
						: `  ${u.file}:${u.line} ${u.id}: ${u.note}`
				);
		}
		if (ranged && manual.length) {
			log(`\nreview by hand (${manual.length}), no usage found to point at:`);
			for (const m of manual) log(`  ${m.id}: ${m.note}`);
		}
	}
	return !(strict && unmapped.length);
}

const rangeLabel = (from: number | undefined, to: number) =>
	from === undefined ? `majors up to ${to}` : `${from} -> ${to}`;

function reportMarkdown(
	from: number | undefined,
	to: number,
	touched: string[],
	left: Leftover[],
	review: { id: string; note: string }[]
): string {
	const out = [
		`# Migration report ${rangeLabel(from, to)}`,
		"",
		`## Rewritten (${touched.length})`,
		"",
	];
	out.push(...(touched.length ? touched.map((f) => `- ${f}`) : ["Nothing."]), "");
	out.push(`## Left for you (${left.length})`, "");
	out.push(
		...(left.length
			? left.map((u) =>
					u.component
						? `- \`${u.file}:${u.line}\` ${u.component}: ${u.note} [${u.id}]`
						: `- \`${u.file}:${u.line}\` ${u.id}: ${u.note}`
				)
			: ["Nothing."]),
		""
	);
	out.push(`## Review by hand (${review.length})`, "");
	out.push(...(review.length ? review.map((m) => `- ${m.id}: ${m.note}`) : ["Nothing."]));
	return out.join("\n");
}
