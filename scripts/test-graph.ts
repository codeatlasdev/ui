/**
 * Which component tests does a changed file reach? A static import graph of `packages/ui/src` (and
 * the test helpers), read from the sources: Vitest's own `--changed` cannot do this in browser mode
 * (the graph of the test files is not populated before they run, so it selects all of them: measured,
 * 198 of 198 files for a one-line edit to Avatar).
 *
 *   test file  -imports->  component / harness / helper  -imports->  ...  (relative imports, `@codeatlasdev/ui`)
 *
 * A package barrel (`src/lib/index.ts`, a folder `index.ts` that only re-exports) is flattened:
 * `import { Avatar } from "../../index"` is an edge to `components/Avatar/Avatar.svelte`, not to the
 * whole library, otherwise every test would depend on every component. Whatever the graph cannot
 * resolve (`import * as`, a namespace barrel import, a bare `export *`) keeps the barrel edge, so the
 * selection can only grow, never shrink.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { isTestFile, ROOT, select } from "./route-impact.ts";

const PKG = join(ROOT, "packages/ui");
const SRC = join(PKG, "src");
const LIB_INDEX = join(SRC, "lib/index.ts");
const EXT = ["", ".ts", ".js", ".svelte", ".svelte.ts", ".svelte.js", ".css", ".json"];

const walk = (dir: string, out: string[] = []): string[] => {
	if (!existsSync(dir)) return out;
	for (const name of readdirSync(dir)) {
		if (name === "node_modules" || name === "__screenshots__" || name === "__traces__") continue;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|js|svelte|css)$/.test(name)) out.push(full);
	}
	return out;
};

function resolveFile(from: string, spec: string): string | undefined {
	if (/^@codeatlasdev\/ui(\/|$)/.test(spec)) return LIB_INDEX;
	if (!spec.startsWith(".")) return undefined; // a package: not ours to track
	const base = resolve(dirname(from), spec);
	for (const candidate of [
		...EXT.map((e) => base + e),
		base.replace(/\.js$/, ".ts"),
		base.replace(/\.js$/, ".svelte.ts"),
		...EXT.map((e) => join(base, `index${e || ".ts"}`)),
	])
		if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
	return undefined;
}

interface Edge {
	spec: string;
	names: string[] | "all";
}

/** `import {A, B as C} from "x"` → names A, B; `import X from`, `import * as`, `export *` → "all". */
function edgesOf(src: string): Edge[] {
	const out: Edge[] = [];
	const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
	for (const m of stripped.matchAll(
		/(?:import|export)\s+(type\s+)?([^"'`;]*?)\s*from\s*["']([^"']+)["']/g
	)) {
		const clause = m[2].trim();
		const named = clause.match(/^\{([\s\S]*)\}$/);
		out.push({
			spec: m[3],
			names: named
				? named[1]
						.split(",")
						.map((p) =>
							p
								.trim()
								.replace(/^type\s+/, "")
								.split(/\s+as\s+/)[0]
								.trim()
						)
						.filter(Boolean)
				: "all",
		});
	}
	for (const m of stripped.matchAll(/(?:^|[^\w.])import\s*["']([^"']+)["']/g))
		out.push({ spec: m[1], names: "all" });
	for (const m of stripped.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g))
		out.push({ spec: m[1], names: "all" });
	for (const m of stripped.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g))
		out.push({ spec: m[1], names: "all" });
	return out;
}

export interface TestGraph {
	/** file -> files it depends on */
	deps: Map<string, Set<string>>;
	/** every `*.svelte.test.ts` / `*.vrt.test.ts` / `*.ssr.test.ts`, repo-relative */
	tests: { browser: string[]; vrt: string[]; ssr: string[] };
}

export function buildGraph(): TestGraph {
	const files = [...walk(SRC), ...walk(join(PKG, "tests"))];
	const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
	const edges = new Map(files.map((f) => [f, edgesOf(text.get(f) ?? "")]));

	// A barrel is a file made only of re-exports: name -> the file that defines it.
	const barrel = new Map<string, Map<string, string>>();
	const isBarrel = (f: string) => {
		if (!/(^|\/)index\.ts$/.test(f)) return false;
		const body = (text.get(f) ?? "")
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/\/\/.*$/gm, "")
			.replace(/(?:export)\s+(?:type\s+)?\{[^}]*\}\s+from\s*["'][^"']+["'];?/g, "")
			.replace(/export\s+\*\s+from\s*["'][^"']+["'];?/g, "")
			.trim();
		return body === "";
	};
	const members = (f: string): Map<string, string> => {
		const hit = barrel.get(f);
		if (hit) return hit;
		const map = new Map<string, string>();
		barrel.set(f, map);
		for (const m of (text.get(f) ?? "").matchAll(
			/export\s+(?:type\s+)?\{([^}]*)\}\s+from\s*["']([^"']+)["']/g
		)) {
			const target = resolveFile(f, m[2]);
			if (!target) continue;
			for (const part of m[1].split(",")) {
				const exported = part
					.trim()
					.replace(/^type\s+/, "")
					.split(/\s+as\s+/)
					.pop()
					?.trim();
				if (exported) map.set(exported, isBarrel(target) ? "" : target);
			}
		}
		return map;
	};

	const deps = new Map<string, Set<string>>();
	for (const f of files) {
		const set = new Set<string>();
		for (const e of edges.get(f) ?? []) {
			const target = resolveFile(f, e.spec);
			if (!target) continue;
			if (isBarrel(target) && e.names !== "all") {
				const m = members(target);
				for (const name of e.names) {
					const direct = m.get(name);
					// a name the barrel table lacks (or defined through another barrel): keep the barrel edge
					set.add(direct ? direct : target);
				}
			} else set.add(target);
		}
		deps.set(f, set);
	}

	const rel = (f: string) => relative(ROOT, f);
	const only = (re: RegExp) =>
		files
			.filter((f) => re.test(f) && f.startsWith(SRC))
			.map(rel)
			.sort();
	return {
		deps: new Map([...deps].map(([f, d]) => [rel(f), new Set([...d].map(rel))])),
		tests: {
			browser: only(/\.svelte\.test\.ts$/),
			vrt: only(/\.vrt\.test\.ts$/),
			ssr: only(/\.ssr\.test\.ts$/),
		},
	};
}

/**
 * The tests among `candidates` (repo-relative) whose transitive imports include a changed file, each
 * with the changed file that reached it. A reverse breadth-first search from the changed files, so an
 * import cycle cannot hide a dependent.
 */
export function affected(
	graph: TestGraph,
	candidates: string[],
	changed: string[]
): Map<string, string> {
	const dependents = new Map<string, string[]>();
	for (const [file, deps] of graph.deps)
		for (const d of deps) dependents.set(d, [...(dependents.get(d) ?? []), file]);

	// a screenshot belongs to the test file that took it: `<dir>/__screenshots__/<test file>/<name>.png`
	const start = changed.map((f) => [f.replace(/\/__screenshots__\/([^/]+)\/[^/]+$/, "/$1"), f]);
	const reached = new Map<string, string>(start.map(([file, origin]) => [file, origin]));
	const queue = start.map(([file]) => file);
	for (let file = queue.shift(); file !== undefined; file = queue.shift())
		for (const dependent of dependents.get(file) ?? [])
			if (!reached.has(dependent)) {
				reached.set(dependent, reached.get(file) ?? file);
				queue.push(dependent);
			}
	return new Map(candidates.filter((t) => reached.has(t)).map((t) => [t, reached.get(t) ?? t]));
}

/** A change here is rendered through by every component test: run them all, not the import-graph subset. */
const SHARED_COMPONENT = [
	/^packages\/ui\/src\/lib\/(styles|tokens|theme|stores|utils|actions|primitives|i18n|testing)\//,
	/^packages\/ui\/src\/lib\/(index|theme-script|types)\.ts$/,
	/^packages\/ui\/tests\/(setup\.[a-z]+|a11y|dom|viewports|settled|vrt|timing-reporter)\.ts$/,
	/^packages\/ui\/(vite\.config\.ts|package\.json)$/,
	/^bun\.lock$/,
];

export const isSharedComponent = (file: string) =>
	!isTestFile(file) && SHARED_COMPONENT.some((re) => re.test(file));

/**
 * The budget `issue-land.sh` runs the land gate under: a SHARED change (a shared component file, or one the
 * route map says reaches every page or does not know) runs every component test and every route and gets
 * `landShared`; any other change runs what it affects plus the canaries under `land`.
 */
export function landBudget(changed: string[]): "land" | "landShared" {
	return changed.some(isSharedComponent) || select(changed).all ? "landShared" : "land";
}
