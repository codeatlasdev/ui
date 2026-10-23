/**
 * `codeatlas-ui migrate-react` (#383): the mechanical part of moving a React app onto the library.
 *
 *  - `.tsx`/`.jsx`: read-only. Lists every shadcn, Radix, Base UI and MUI import with the component
 *    that replaces it (`equivalents/react-ui.json`), or the gap issue and workaround when none does.
 *  - `.svelte` already importing from `@codeatlasdev/ui`: renames React-isms the table knows
 *    (`className`, `onClick`, `htmlFor`, `<Button variant="outline">`) and reports, with file:line,
 *    the props it cannot rewrite safely (`onChange`, `onCheckedChange`, `asChild`, spreads).
 * Dry run unless `write`; running it twice changes nothing the second time.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import MagicString from "magic-string";
import { parse } from "svelte/compiler";
import type * as TS from "typescript";
import { unifiedDiff } from "./diff.ts";
import { type Equivalent, findEquivalent, loadEquivalents } from "./equivalents.ts";
import { loadTypescript, MISSING_TYPESCRIPT } from "./typescript.ts";

export interface ReactImport {
	line: number;
	/** Module specifier. */
	source: string;
	/** Imported binding (`Button`), or the package for a namespace/default import of a primitive. */
	imported: string;
	row?: Equivalent;
}

/** shadcn keeps components in `@/components/ui/<name>`; Radix and Base UI are npm packages; MUI is `@mui/material`. */
const SHADCN_PATH = /\/components\/ui\/([a-z0-9-]+)$/;
const MUI_PATH = /^@mui\/(?:material|lab)(?:\/([A-Za-z]+))?$/;
const PRIMITIVE = /^(?:@radix-ui\/react-[a-z-]+|@base-ui-components\/react(?:\/[a-z-]+)?)$/;

/** Rows for the bindings one import declaration brings in. */
function rowsFor(
	source: string,
	names: { imported: string }[],
	rows: Equivalent[]
): { imported: string; row?: Equivalent }[] {
	const shadcn = source.match(SHADCN_PATH)?.[1];
	if (shadcn) {
		// One row per file (`ui/dialog`), shown under the binding the app imports (`Dialog`, `DialogContent`).
		const row = findEquivalent(rows, shadcn);
		if (!row) return [];
		return names.length ? [{ imported: names[0].imported, row }] : [{ imported: shadcn, row }];
	}
	if (PRIMITIVE.test(source)) {
		const row = findEquivalent(rows, source);
		return row ? [{ imported: source, row }] : [];
	}
	const mui = source.match(MUI_PATH);
	if (mui) {
		// `@mui/material/Dialog` default import, or `{ Autocomplete, TextField }` from the barrel.
		const wanted = mui[1] ? [{ imported: mui[1] }] : names;
		return wanted.flatMap((n) => {
			const row = rows.find((r) => r.mui === n.imported);
			return row ? [{ imported: n.imported, row }] : [];
		});
	}
	return [];
}

/** Every import of a React UI library in `src`, with the row that replaces it. Parsed with TypeScript. */
export function scanReactImports(
	src: string,
	rows: Equivalent[],
	ts: typeof TS = loadTypescript(process.cwd()) as typeof TS
): ReactImport[] {
	const sf = ts.createSourceFile("f.tsx", src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
	const out: ReactImport[] = [];
	for (const st of sf.statements) {
		if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
		const source = st.moduleSpecifier.text;
		const named = st.importClause?.namedBindings;
		const names =
			named && ts.isNamedImports(named)
				? named.elements.map((e) => ({ imported: (e.propertyName ?? e.name).text }))
				: [];
		const line = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
		for (const hit of rowsFor(source, names, rows)) out.push({ line, source, ...hit });
	}
	return out;
}

/** Attribute renames that are right on every element of an already-ported file. */
const ATTRS: Record<string, string> = { className: "class", htmlFor: "for", onClick: "onclick" };
/** Props the table cannot rewrite without reading the handler: reported, never guessed. */
const MANUAL: Record<string, string> = {
	onChange: "bind:value, or oninput/onchange with the event the component passes",
	onCheckedChange: "bind:checked, or onchange",
	onValueChange: "bind:value, or onchange",
	onOpenChange: "bind:open, or onOpenChange",
	asChild: "href on the component, or a snippet; there is no render-as-child",
};

interface Attr {
	type: string;
	name?: string;
	start: number;
	end: number;
	value?: true | { type: string; data?: string; start: number; end: number }[];
}
interface Node {
	type: string;
	name?: string;
	start: number;
	attributes?: Attr[];
	[key: string]: unknown;
}

function elements(node: unknown, out: Node[] = []): Node[] {
	if (!node || typeof node !== "object") return out;
	if (Array.isArray(node)) {
		for (const n of node) elements(n, out);
		return out;
	}
	const n = node as Node;
	if (n.type === "Component" || n.type === "RegularElement") out.push(n);
	for (const key of Object.keys(n)) {
		if (key === "parent" || key === "expression" || key === "attributes") continue;
		const v = n[key];
		if (v && typeof v === "object") elements(v, out);
	}
	return out;
}

const line = (src: string, at: number) => src.slice(0, at).split("\n").length;

export interface MigrateReactOptions {
	write?: boolean;
	cwd?: string;
	log?: (line: string) => void;
	rows?: Equivalent[];
}

/** `true` when the run finished (leftovers are not an error); `false` when `typescript` is missing. */
export function migrateReact(
	files: string[],
	{ write = false, cwd = process.cwd(), log = console.log, rows }: MigrateReactOptions = {}
): boolean {
	const ts = loadTypescript(cwd);
	if (!ts) {
		log(MISSING_TYPESCRIPT);
		return false;
	}
	const table = rows ?? loadEquivalentsOnce();
	let changed = 0;
	const manual: string[] = [];
	for (const file of files) {
		const src = readFileSync(file, "utf8");
		const rel = relative(cwd, file);
		if (/\.(tsx|jsx)$/.test(file)) {
			for (const f of scanReactImports(src, table, ts)) {
				const to = f.row?.gap
					? `no component (gap #${f.row.gap}): ${f.row.workaround}`
					: f.row?.to.join(", ");
				log(`  ${rel}:${f.line} ${f.imported} -> ${to}`);
			}
			continue;
		}
		if (!file.endsWith(".svelte") || !src.includes("@codeatlasdev/ui")) continue;
		const next = rewriteSvelte(src, rel, manual);
		if (next === src) continue;
		changed++;
		if (write) {
			writeFileSync(file, next);
			log(`  migrate ${rel}`);
		} else log(`${unifiedDiff(rel, src, next)}\n`);
	}
	if (changed && !write) log(`${changed} file(s) would change. Re-run with --write to apply.`);
	if (manual.length) {
		log(`\nleft ${manual.length} prop${manual.length === 1 ? "" : "s"}:`);
		for (const m of manual) log(`  ${m}`);
	}
	return true;
}

/** Renames in the template of one `.svelte` file; pushes `file:line` notes for what it leaves. */
function rewriteSvelte(src: string, rel: string, manual: string[]): string {
	const ast = parse(src, { modern: true });
	// Names bound from the package, so `Other from "other-lib"` is left alone.
	const ours = new Set<string>();
	for (const sc of [ast.instance, ast.module]) {
		if (!sc) continue;
		const text = src.slice(sc.start, sc.end);
		for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@codeatlasdev\/ui[^"']*["']/g))
			for (const part of m[1].split(",")) {
				const name = part
					.trim()
					.split(/\s+as\s+/)
					.pop();
				if (name) ours.add(name);
			}
	}
	const out = new MagicString(src);
	for (const el of elements(ast.fragment)) {
		const isOurs = el.type === "Component" && el.name !== undefined && ours.has(el.name);
		// A plain element is in a file already ported to the library, so `className` is a leftover.
		if (el.type === "Component" && !isOurs) continue;
		for (const a of el.attributes ?? []) {
			if (a.type !== "Attribute" || !a.name) continue;
			const to = ATTRS[a.name];
			if (to) out.overwrite(a.start, a.start + a.name.length, to);
			else if (isOurs && a.name in MANUAL)
				manual.push(`${rel}:${line(src, a.start)} ${el.name} ${a.name}: ${MANUAL[a.name]}`);
			else if (isOurs && el.name === "Button" && a.name === "variant") rewriteVariant(src, a, out);
		}
		for (const a of el.attributes ?? [])
			if (isOurs && a.type === "SpreadAttribute")
				manual.push(`${rel}:${line(src, a.start)} ${el.name} spread props: map them by hand`);
	}
	return out.toString();
}

/** shadcn `variant` values on `Button`, from the table row (`variant=outline` -> `variant=outlined`). */
function rewriteVariant(src: string, a: Attr, out: MagicString) {
	const button = loadEquivalentsOnce().find((r) => r.shadcn === "Button");
	const map = Object.entries(button?.props ?? {})
		.filter(([from]) => from.startsWith("variant="))
		.map(([from, to]) => [from.slice(8), to.slice(8)] as const);
	const text = src.slice(a.start, a.end).match(/^variant="([^"]*)"$/)?.[1];
	const hit = map.find(([from]) => from === text);
	if (hit) out.overwrite(a.start, a.end, `variant="${hit[1]}"`);
}

let cached: Equivalent[] | undefined;
function loadEquivalentsOnce(): Equivalent[] {
	cached ??= loadEquivalents();
	return cached;
}
