/** TypeScript AST and JSDoc helpers shared by the component and export extractors. */
import ts from "typescript";

/** Last JSDoc comment attached to a node, flattened to one line. */
export function jsDoc(node: ts.Node): string | undefined {
	const comment = ts.getJSDocCommentsAndTags(node).find(ts.isJSDoc)?.comment;
	const text = typeof comment === "string" ? comment : comment?.map((c) => c.text).join("");
	return text?.replace(/\s*\n\s*/g, " ").trim() || undefined;
}

export const propName = (n: ts.PropertyName): string =>
	ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : n.getText();

/** Prose of a `/** ... *\/` block before its first `@tag`, flattened to one paragraph. */
export function docProse(block: string): string | undefined {
	const lines = block
		.replace(/^\/\*\*|\*\/$/g, "")
		.split("\n")
		.map((l) => l.replace(/^\s*\*?\s?/, "").trimEnd());
	const tag = lines.findIndex((l) => /^@\w+/.test(l.trim()));
	const prose = (tag < 0 ? lines : lines.slice(0, tag)).join("\n").split(/\n\s*\n/)[0];
	return prose.replace(/\n/g, " ").trim() || undefined;
}

export const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
