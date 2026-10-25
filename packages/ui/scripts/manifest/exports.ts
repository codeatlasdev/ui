/** Non-component exports of every entry point: functions, stores, constants, classes and types, with signature and summary. */
import { join, relative } from "node:path";
import ts from "typescript";
import { docProse, oneLine, propName } from "./ast.ts";
import type { ManifestComponent } from "./components.ts";
import { API_ENTRIES, LIB } from "./paths.ts";

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
	/** Fields of an exported interface (or object type alias): name, type, optionality, JSDoc. */
	members?: ManifestExportMember[];
	/** Source file relative to `src/lib`. */
	source: string;
}

export interface ManifestExportMember {
	name: string;
	type: string;
	optional: boolean;
	description?: string;
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

/** Fields of an interface or object type alias, with the JSDoc of each. Methods and index signatures are kept as written. */
function exportMembers(
	decl: ts.Declaration,
	sf: ts.SourceFile
): ManifestExportMember[] | undefined {
	let elements: readonly ts.TypeElement[] | undefined;
	if (ts.isInterfaceDeclaration(decl)) elements = decl.members;
	else if (ts.isTypeAliasDeclaration(decl) && ts.isTypeLiteralNode(decl.type))
		elements = decl.type.members;
	if (!elements?.length) return undefined;
	const out: ManifestExportMember[] = [];
	for (const m of elements) {
		if (!ts.isPropertySignature(m) && !ts.isMethodSignature(m)) continue;
		const doc = ts.getJSDocCommentsAndTags(m).find(ts.isJSDoc);
		const description = doc
			? docProse(
					doc
						.getText(sf)
						.replace(/^\/\*\*|\*\/$/g, "")
						.replace(/^\s*\* ?/gm, "")
				)
			: undefined;
		const type = ts.isPropertySignature(m)
			? oneLine(m.type?.getText(sf) ?? "unknown")
			: `(${m.parameters.map((p) => p.getText(sf)).join(", ")}) => ${oneLine(m.type?.getText(sf) ?? "void")}`;
		out.push({
			name: propName(m.name),
			type,
			optional: !!m.questionToken,
			...(description ? { description } : {}),
		});
	}
	return out.length ? out : undefined;
}

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
			const members = exportMembers(decl, declFile);
			out.push({
				name: exported.name,
				import: entry,
				kind,
				signature,
				...(description ? { description } : {}),
				...(members ? { members } : {}),
				source: relative(LIB, declFile.fileName),
			});
		}
	}
	return out.sort((a, b) => a.import.localeCompare(b.import) || a.name.localeCompare(b.name));
}
