import { readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import MagicString from "magic-string";
import { parse } from "svelte/compiler";
import ts from "typescript";
import { unifiedDiff } from "./diff.ts";

/**
 * A rule receives the TypeScript source of one script (offset-free) and records edits
 * in `s`, which is positioned relative to that script's text.
 */
interface Rule {
	id: string;
	description: string;
	apply(sf: ts.SourceFile, s: MagicString): void;
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
		const visit = (n: ts.Node) => {
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
function isMemberName(n: ts.Identifier): boolean {
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

interface Script {
	/** Offset of the script text inside the file. */
	start: number;
	text: string;
	kind: ts.ScriptKind;
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

/** Apply every rule to `files`. Returns true when the run finished (changes found are not an error). */
export function migrate(
	files: string[],
	{ write = false, cwd = process.cwd(), log = console.log }: MigrateOptions = {}
): boolean {
	let changed = 0;
	for (const file of files) {
		const src = readFileSync(file, "utf8");
		if (!src.includes("@codeatlasdev/ui")) continue;
		const out = new MagicString(src);
		try {
			for (const sc of scripts(file, src)) {
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
		if (!out.hasChanged()) continue;
		changed++;
		const rel = relative(cwd, file);
		if (write) {
			writeFileSync(file, out.toString());
			log(`  migrate ${rel}`);
		} else log(`${unifiedDiff(rel, src, out.toString())}\n`);
	}
	if (!changed) log("Nothing to migrate.");
	else if (!write) log(`${changed} file(s) would change. Re-run with --write to apply.`);
	return true;
}
