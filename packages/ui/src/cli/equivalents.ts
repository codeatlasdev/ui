/**
 * React UI to @codeatlasdev/ui equivalence table (#383): one row per shadcn/ui component, with the
 * Radix, Base UI and MUI names that mean the same thing. The data lives in `equivalents/react-ui.json`;
 * it feeds the migration guide, the MCP `get_equivalent` tool and the import codemod.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface Equivalent {
	/** shadcn/ui component name, as on ui.shadcn.com/docs/components. */
	shadcn: string;
	/** Radix primitive or Base UI package that ships the same behavior, when there is one. */
	radix?: string;
	baseUi?: string;
	/** MUI component name. */
	mui?: string;
	/** Exports of this package that replace it (the nearest building blocks when `gap` is set). */
	to: string[];
	/** Source prop (`variant=outline`, `onCheckedChange`) to target prop (`variant=outlined`, `onchange`). */
	props?: Record<string, string>;
	notes?: string;
	/** Issue tracking a component this package lacks: `to` is then only the nearest building block. */
	gap?: number;
	/** What to do until the gap closes; required with `gap`. */
	workaround?: string;
}

/** `equivalents/` sits at the package root in the repo and next to `dist/` in the tarball. */
function equivalentsFile(): string {
	const here = dirname(fileURLToPath(import.meta.url));
	for (const rel of ["../../equivalents", "../equivalents", "../../../equivalents"]) {
		const file = join(here, rel, "react-ui.json");
		if (existsSync(file)) return file;
	}
	throw new Error("equivalents/react-ui.json not found");
}

export function loadEquivalents(file = equivalentsFile()): Equivalent[] {
	const data: unknown = JSON.parse(readFileSync(file, "utf8"));
	if (!data || typeof data !== "object" || !("rows" in data) || !Array.isArray(data.rows))
		throw new Error(`${file}: expected { "rows": [...] }`);
	// The rows are checked against the manifest by tests/react-equivalents.test.ts.
	const rows: Equivalent[] = data.rows;
	return rows;
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Match by shadcn name, Radix/Base UI package (or its last segment) or MUI name; case and separators ignored. */
export function findEquivalent<T extends Equivalent>(rows: T[], name: string): T | undefined {
	const want = key(name);
	const last = (pkg?: string) => (pkg ? key(pkg.split("/").pop() ?? "") : "");
	return rows.find(
		(r) =>
			key(r.shadcn) === want ||
			(r.radix && (key(r.radix) === want || last(r.radix) === want.replace(/^reactradixui/, ""))) ||
			(r.baseUi && (key(r.baseUi) === want || last(r.baseUi) === want)) ||
			(r.mui && key(r.mui) === want)
	);
}

const cell = (v: string) => v.replace(/\|/g, "\\|");

/** Markdown table of the whole map, embedded verbatim in the migration guide. Deterministic. */
export function equivalentsMarkdown(rows: Equivalent[]): string {
	const code = (xs: string[]) => xs.map((x) => `\`${x}\``).join(", ");
	const out = [
		"| shadcn/ui | Radix, Base UI | MUI | CodeAtlas UI | Notes |",
		"|---|---|---|---|---|",
	];
	for (const r of rows) {
		const prim = [r.radix, r.baseUi].filter(Boolean) as string[];
		const target = r.gap ? `none (gap #${r.gap}): ${r.workaround}` : code(r.to);
		out.push(
			`| ${cell(r.shadcn)} | ${prim.length ? code(prim) : ""} | ${r.mui ? `\`${r.mui}\`` : ""} | ${cell(target)} | ${cell(r.notes ?? "")} |`
		);
	}
	return `${out.join("\n")}\n`;
}
