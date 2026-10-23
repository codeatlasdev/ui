/**
 * `codeatlas-ui workarounds`: lists the `ca-ui-workaround(#n)` markers an agent left in the code and
 * whether the issue behind each one is closed (so the workaround can go), then the `.ca-*` selectors
 * in app CSS that target a part the library does not document as stable (`dist/parts.json`, #381).
 * Read-only; offline-safe. Exit code is 0 unless `--strict` finds such a selector.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface Marker {
	line: number;
	issue: number;
	reason: string;
}

export interface Found extends Marker {
	file: string;
}

type IssueState = "open" | "closed" | "unknown";

/** The slice of `dist/parts.json` the scan needs. */
export interface PartsData {
	components: { parts: { name: string; stable: boolean }[] }[];
}

export interface WorkaroundsOptions {
	cwd?: string;
	fetch?: typeof fetch;
	log?: (line: string) => void;
	/** Stable/internal parts of the installed library; without it the selector scan is skipped. */
	parts?: PartsData;
	/** Exit 1 when a selector targets a part that is not documented as stable. */
	strict?: boolean;
}

export interface Selector {
	line: number;
	name: string;
}

const MARKER = /ca-ui-workaround\(#(\d+)\):[ \t]*(.*?)[ \t]*(?:-->)?[ \t]*$/;
const MARKER_ANY = /ca-ui-workaround\(#\d+\)/;
const SOURCE = /\.(svelte|ts|js|astro|mdx|css)$/;
const API = "https://api.github.com/repos/codeatlasdev/ui/issues";

export function findMarkers(src: string): Marker[] {
	const out: Marker[] = [];
	src.split("\n").forEach((text, i) => {
		const m = text.match(MARKER);
		if (m) out.push({ line: i + 1, issue: Number(m[1]), reason: m[2] });
	});
	return out;
}

const STYLE_FILE = /\.(css|svelte|astro)$/;

/** `.ca-*` classes written in selectors: whole `.css` files, or the `<style>` blocks of a component. */
export function findSelectors(src: string, file: string): Selector[] {
	const blocks = file.endsWith(".css")
		? [{ start: 0, end: src.length }]
		: [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => {
				const start = (m.index ?? 0) + m[0].indexOf(">") + 1;
				return { start, end: start + m[1].length };
			});
	// Blank comments but keep their newlines, so an index into `bare` is an index into `src`.
	const bare = src.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
	const out: Selector[] = [];
	for (const { start, end } of blocks) {
		const css = bare.slice(start, end);
		for (const rule of css.matchAll(/([^{};]+)\{/g))
			for (const c of rule[1].matchAll(/\.(ca-[A-Za-z0-9_-]+)/g)) {
				const at = start + (rule.index ?? 0) + (c.index ?? 0);
				out.push({ line: bare.slice(0, at).split("\n").length, name: c[1] });
			}
	}
	return out;
}

function collect(path: string): string[] {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? collect(join(path, e.name))
				: SOURCE.test(e.name) || STYLE_FILE.test(e.name)
					? [join(path, e.name)]
					: []
	);
}

async function state(issue: number, f: typeof fetch): Promise<IssueState> {
	try {
		const res = await f(`${API}/${issue}`, { headers: { accept: "application/vnd.github+json" } });
		if (!res.ok) return "unknown";
		const data: unknown = await res.json();
		const s = data && typeof data === "object" && "state" in data ? data.state : undefined;
		return s === "closed" ? "closed" : s === "open" ? "open" : "unknown";
	} catch {
		return "unknown";
	}
}

/** Resolves to 0 (a report), or 1 when `strict` and a selector targets a part that is not stable. */
export async function runWorkarounds(
	targets: string[],
	opts: WorkaroundsOptions = {}
): Promise<number> {
	const { cwd = process.cwd(), fetch: f = fetch, log = console.log } = opts;
	const files = [...new Set(targets.flatMap((t) => collect(resolve(cwd, t))))];
	const found: Found[] = files.flatMap((file) =>
		findMarkers(readFileSync(file, "utf8")).map((m) => ({ ...m, file: relative(cwd, file) }))
	);

	if (!found.length) log("No ca-ui-workaround markers found.");
	else await reportMarkers(found, f, log);

	const offenders = opts.parts ? scanSelectors(files, opts.parts, cwd) : [];
	if (offenders.length) {
		log("");
		for (const o of offenders)
			log(`${o.file}:${o.line}  .${o.name}  not a stable part of @codeatlasdev/ui`);
		log(
			`${offenders.length} selector${offenders.length === 1 ? "" : "s"} target a part the library may rename in any release. Use a documented part, variable or data attribute (get_component / list_parts), or mark the line with ca-ui-workaround(#n) after opening the issue.`
		);
	}
	return opts.strict && offenders.length ? 1 : 0;
}

/** Selectors on `.ca-*` names the library does not document as stable, minus the ones a marker excuses. */
function scanSelectors(files: string[], data: PartsData, cwd: string) {
	const stable = new Set(
		data.components.flatMap((c) => c.parts.filter((p) => p.stable).map((p) => p.name))
	);
	const out: { file: string; line: number; name: string }[] = [];
	for (const file of files.filter((p) => STYLE_FILE.test(p))) {
		const src = readFileSync(file, "utf8");
		const lines = src.split("\n");
		for (const s of findSelectors(src, file)) {
			if (stable.has(s.name)) continue;
			const excused = [lines[s.line - 1], lines[s.line - 2]].some((l) => l && MARKER_ANY.test(l));
			if (!excused) out.push({ file: relative(cwd, file), ...s });
		}
	}
	return out;
}

async function reportMarkers(found: Found[], f: typeof fetch, log: (line: string) => void) {
	const ids = [...new Set(found.map((m) => m.issue))];
	const states = new Map(
		await Promise.all(ids.map(async (id) => [id, await state(id, f)] as const))
	);

	const rows = found.map((m) => [
		`${m.file}:${m.line}`,
		`#${m.issue}`,
		states.get(m.issue) ?? "unknown",
		m.reason,
	]);
	const w = [0, 1, 2].map((c) => Math.max(...rows.map((r) => r[c].length)));
	for (const r of rows)
		log(`${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2].padEnd(w[2])}  ${r[3]}`);

	const closed = found.filter((m) => states.get(m.issue) === "closed").length;
	const unknown = found.filter((m) => states.get(m.issue) === "unknown").length;
	log("");
	log(`${found.length} workaround${found.length === 1 ? "" : "s"}, ${closed} closed.`);
	if (closed)
		log(
			"A closed issue means the library fixed it: update @codeatlasdev/ui, then remove the workaround and its marker."
		);
	if (unknown)
		log(
			`${unknown} marker${unknown === 1 ? "" : "s"} with unknown state (offline, rate limited or not found).`
		);
}
