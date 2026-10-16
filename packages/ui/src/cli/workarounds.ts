/**
 * `codeatlas-ui workarounds`: lists the `ca-ui-workaround(#n)` markers an agent left in the code and
 * whether the issue behind each one is closed (so the workaround can go). Read-only; offline-safe.
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

export interface WorkaroundsOptions {
	cwd?: string;
	fetch?: typeof fetch;
	log?: (line: string) => void;
}

const MARKER = /ca-ui-workaround\(#(\d+)\):[ \t]*(.*?)[ \t]*(?:-->)?[ \t]*$/;
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

function collect(path: string): string[] {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? collect(join(path, e.name))
				: SOURCE.test(e.name)
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

/** Always resolves to exit code 0: this is a report, not a gate. */
export async function runWorkarounds(
	targets: string[],
	opts: WorkaroundsOptions = {}
): Promise<number> {
	const { cwd = process.cwd(), fetch: f = fetch, log = console.log } = opts;
	const found: Found[] = targets
		.flatMap((t) => collect(resolve(cwd, t)))
		.flatMap((file) =>
			findMarkers(readFileSync(file, "utf8")).map((m) => ({ ...m, file: relative(cwd, file) }))
		);

	if (!found.length) {
		log("No ca-ui-workaround markers found.");
		return 0;
	}

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
	return 0;
}
