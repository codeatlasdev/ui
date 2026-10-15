/**
 * Guards the docs site against drifting from the package. Everything is checked against the
 * generated manifest (the same data the MCP server and API.md serve), never against a copy:
 *
 *  - every `<Props for="…">` row names a prop (or snippet) the component really has, and a
 *    documented default equals the one in the source;
 *  - every `@codeatlasdev/ui*` import in a code fence resolves to a real export of that entry;
 *  - every capitalised component used in a `svelte` fence passes only props it declares;
 *  - every exported component appears in the docs (a short allowlist of internals is explicit).
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { buildManifest, type ManifestComponent } from "../scripts/build-manifest.ts";

const DOCS = join(import.meta.dir, "../../../site/src/content/docs");
const manifest = buildManifest();
const components = new Map(manifest.components.map((c) => [c.name, c]));

const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
	});
const pages = walk(DOCS).map((file) => ({
	file,
	rel: relative(DOCS, file),
	src: readFileSync(file, "utf8"),
}));

// ── <Props> blocks ───────────────────────────────────────────────────────────

interface PropsBlock {
	page: string;
	title: string;
	/** Components the table describes: `for="A, B"`, else the component named by the title, else the page. */
	targets: string[];
	rows: { name: string; default?: string }[];
}

/** Native attributes a component forwards through `...rest`, which the manifest lists only as `extends`. */
const INHERITED: Record<string, string[]> = { Image: ["srcset", "sizes"] };

/** Props the document element carries for free; documenting them on a component page is fine. */
const NATIVE = /^(aria-[a-z]+|data-[a-z-]+|id|class|style|role|tabindex|title|lang|dir|hidden)$/;

function propsBlocks(): PropsBlock[] {
	const out: PropsBlock[] = [];
	for (const p of pages) {
		for (const m of p.src.matchAll(/<Props\b([\s\S]*?)rows=\{\[([\s\S]*?)\]\}\s*\/>/g)) {
			const attrs = m[1];
			const title = attrs.match(/title="([^"]*)"/)?.[1] ?? "Props";
			const forAttr = attrs.match(/for="([^"]*)"/)?.[1];
			// A row may name several props at once ("p, px, py", "leading / trailing"): one entry per prop.
			const rows = [...m[2].matchAll(/\{\s*name:\s*"((?:[^"\\]|\\.)*)"([^}]*)\}/g)].flatMap((r) => {
				const dflt = r[2].match(/default:\s*"((?:[^"\\]|\\.)*)"/)?.[1]?.replace(/\\"/g, '"');
				const names = r[1].split(/\s*[,/]\s*/).filter(Boolean);
				return names.map((name) => ({ name, default: names.length === 1 ? dflt : undefined }));
			});
			const pageName = p.rel
				.replace(/^.*\//, "")
				.replace(/\.mdx$/, "")
				.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
			const titled = title
				.replace(/\s+props$/i, "")
				.replace(/\(.*$/, "")
				.trim();
			const targets = forAttr
				? forAttr.split(",").map((s) => s.trim())
				: components.has(titled)
					? [titled]
					: [pageName];
			out.push({ page: p.rel, title, targets, rows });
		}
	}
	return out;
}

const blocks = propsBlocks();

/** Props a component owns plus the ones its `extends` clause adds from a known type (`Pick<LayoutProps, …>`, another component). */
function owned(c: ManifestComponent, seen = new Set<string>()): Map<string, { default?: string }> {
	const out = new Map<string, { default?: string }>(
		[...c.props, ...c.snippets].map((prop) => [prop.name, prop])
	);
	for (const n of INHERITED[c.name] ?? []) out.set(n, {});
	if (seen.has(c.name)) return out;
	seen.add(c.name);
	for (const m of c.extends?.matchAll(/Pick<LayoutProps,\s*([^>]+)>/g) ?? [])
		for (const n of m[1].matchAll(/'(\w+)'/g)) out.set(n[1], {});
	for (const m of c.extends?.matchAll(/ComponentProps<typeof (\w+)>/g) ?? []) {
		const base = components.get(m[1]);
		if (base) for (const [k, v] of owned(base, seen)) out.set(k, v);
	}
	return out;
}

describe("docs <Props> tables", () => {
	it("finds the tables (the parser is not silently empty)", () => {
		expect(blocks.length).toBeGreaterThan(40);
	});

	it("has rows that are valid JavaScript (an unescaped quote breaks the MDX build)", () => {
		const bad: string[] = [];
		for (const p of pages)
			for (const m of p.src.matchAll(/<Props\b[\s\S]*?rows=\{(\[[\s\S]*?\])\}\s*\/>/g)) {
				// The rows are plain object literals, so evaluating them is the strictest parse there is.
				try {
					new Function(`return ${m[1]};`)();
				} catch (e) {
					bad.push(`${p.rel}: ${(e as Error).message}`);
				}
			}
		expect(bad).toEqual([]);
	});

	it('targets only exported components (use for="A, B" or for="none" when the title does not name one)', () => {
		const bad: string[] = [];
		for (const b of blocks)
			for (const t of b.targets)
				if (t !== "none" && !components.has(t)) bad.push(`${b.page} [${b.title}]: ${t}`);
		expect(bad).toEqual([]);
	});

	it("documents only props the component has", () => {
		const bad: string[] = [];
		for (const b of blocks) {
			const targets = b.targets.filter((t) => t !== "none");
			if (!targets.length) continue;
			const comps = targets
				.map((t) => components.get(t))
				.filter((c): c is ManifestComponent => !!c);
			for (const row of b.rows) {
				// "PhoneField.value" names the component it belongs to.
				const [only, prop] = row.name.includes(".") ? row.name.split(".") : [undefined, row.name];
				if (NATIVE.test(prop)) continue;
				const scope = only ? comps.filter((c) => c.name === only) : comps;
				if (!scope.some((c) => owned(c).has(prop)))
					bad.push(`${b.page} [${b.title}] ${targets.join("/")}: ${row.name}`);
			}
		}
		expect(bad).toEqual([]);
	});

	it("documents the default the source declares", () => {
		const norm = (s: string) => s.replace(/\s+/g, "").replace(/"/g, "'");
		const bad: string[] = [];
		for (const b of blocks) {
			const targets = b.targets.filter((t) => t !== "none");
			if (targets.length !== 1) continue;
			const c = components.get(targets[0]);
			if (!c) continue;
			for (const row of b.rows) {
				const prop = owned(c).get(row.name);
				if (!prop || row.default === undefined || prop.default === undefined) continue;
				// Identifiers and function expressions (`DEFAULT_ZONES`, `(_item, i) => i`) cannot be compared as text.
				if (
					!/^(['"`].*['"`]|-?[\d.]+|true|false|null|undefined|\[.*\]|\{.*\})$/s.test(prop.default)
				)
					continue;
				if (norm(row.default) !== norm(prop.default))
					bad.push(`${b.page} ${c.name}.${row.name}: docs ${row.default}, source ${prop.default}`);
			}
		}
		expect(bad).toEqual([]);
	});
});

// ── code fences ──────────────────────────────────────────────────────────────

interface Fence {
	page: string;
	lang: string;
	code: string;
}

function fences(): Fence[] {
	const out: Fence[] = [];
	for (const p of pages)
		for (const m of p.src.matchAll(/^[ \t]*```(\w+)[^\n]*\n([\s\S]*?)^[ \t]*```/gm))
			out.push({ page: p.rel, lang: m[1], code: m[2] });
	return out;
}

const allFences = fences();

const LIB = join(import.meta.dir, "../src/lib");
const ENTRY_FILES: Record<string, string> = {
	"@codeatlasdev/ui": join(LIB, "index.ts"),
	"@codeatlasdev/ui/charts": join(LIB, "charts/index.ts"),
	"@codeatlasdev/ui/table": join(LIB, "components/DataTable/index.ts"),
	"@codeatlasdev/ui/code": join(LIB, "components/CodeSnippet/index.ts"),
	"@codeatlasdev/ui/forms": join(LIB, "forms/index.ts"),
};

/** Names each entry point really exports (components and every other runtime/type export). */
function exportsByEntry(): Map<string, Set<string>> {
	const by = new Map<string, Set<string>>();
	const add = (entry: string, name: string) => {
		if (!by.has(entry)) by.set(entry, new Set());
		by.get(entry)?.add(name);
	};
	for (const c of manifest.components) add(c.import, c.name);
	for (const e of manifest.exports) add(e.import, e.name);
	// Names an entry re-exports from a dependency (`CalendarDate`): the manifest only follows own declarations.
	for (const [entry, file] of Object.entries(ENTRY_FILES)) {
		const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.ESNext, true);
		for (const st of sf.statements)
			if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause))
				for (const el of st.exportClause.elements) add(entry, el.name.text);
	}
	return by;
}
const exportsOf = exportsByEntry();

/** Entries whose exports are not in the manifest (assets, subpath files, bin). */
const NON_API_ENTRY = /\/(styles|presets|testing|i18n|primitives)(\/|$)|\.css$|\.json$/;

describe("docs code samples", () => {
	it("finds the fences (the parser is not silently empty)", () => {
		expect(allFences.length).toBeGreaterThan(100);
	});

	it("imports only names that the entry point exports", () => {
		const bad: string[] = [];
		for (const f of allFences) {
			if (!["svelte", "ts", "js", "astro", "tsx", "mdx"].includes(f.lang)) continue;
			for (const m of f.code.matchAll(
				/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["'](@codeatlasdev\/ui[^"']*)["']/g
			)) {
				m[1] = m[1].replace(/\/\/[^\n]*/g, "");
				const entry = m[2];
				if (NON_API_ENTRY.test(entry)) continue;
				const known = exportsOf.get(entry);
				if (!known) {
					bad.push(`${f.page}: unknown entry ${entry}`);
					continue;
				}
				for (const raw of m[1].split(",")) {
					const name = raw
						.trim()
						.replace(/^type\s+/, "")
						.split(/\s+as\s+/)[0]
						.trim();
					if (name && !known.has(name)) bad.push(`${f.page}: ${name} is not exported by ${entry}`);
				}
			}
		}
		expect(bad).toEqual([]);
	});

	it("passes only declared props to components in svelte samples", () => {
		const bad: string[] = [];
		for (const f of allFences) {
			if (f.lang !== "svelte") continue;
			// Attribute names of each `<Component …>` opening tag, brace-aware so `{…}` values with `>` do not end it.
			for (const tag of f.code.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
				const c = components.get(tag[1]);
				if (!c) continue;
				const attrs = readAttributes(f.code, (tag.index ?? 0) + tag[0].length);
				const known = owned(c);
				for (const a of attrs) {
					if (
						NATIVE.test(a) ||
						(/^(on[a-z]+|bind:.+|use:.+|class:.+|style:.+|transition:.+)$/.test(a) && c.extends)
					)
						continue;
					const base = a.replace(/^bind:/, "");
					if (!known.has(base) && !known.has(a)) bad.push(`${f.page}: <${c.name} ${a}>`);
				}
			}
		}
		expect(bad).toEqual([]);
	});
});

/** Attribute names of the tag whose name just ended at `from`. Skips string and `{…}` values. */
function readAttributes(src: string, from: number): string[] {
	const names: string[] = [];
	let i = from;
	while (i < src.length) {
		const ch = src[i];
		if (ch === ">" || (ch === "/" && src[i + 1] === ">")) break;
		if (/\s/.test(ch)) {
			i++;
			continue;
		}
		if (ch === "{") {
			// `{...rest}` / `{shorthand}`: shorthand names a prop, spread does not.
			const end = matching(src, i);
			const inner = src.slice(i + 1, end).trim();
			if (/^[A-Za-z_$][\w$]*$/.test(inner)) names.push(inner);
			i = end + 1;
			continue;
		}
		const m = src.slice(i).match(/^[A-Za-z_:@][\w:.\-@]*/);
		if (!m) {
			i++;
			continue;
		}
		names.push(m[0]);
		i += m[0].length;
		if (src[i] === "=") {
			i++;
			if (src[i] === '"' || src[i] === "'") i = src.indexOf(src[i], i + 1) + 1;
			else if (src[i] === "{") i = matching(src, i) + 1;
		}
	}
	return names;
}

/** Index of the `}` that closes the `{` at `open`, skipping strings and template literals. */
function matching(src: string, open: number): number {
	let depth = 0;
	for (let i = open; i < src.length; i++) {
		const ch = src[i];
		if (ch === '"' || ch === "'" || ch === "`") {
			for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === "\\") i++;
		} else if (ch === "{") depth++;
		else if (ch === "}" && --depth === 0) return i;
	}
	return src.length;
}

// ── coverage ─────────────────────────────────────────────────────────────────

/** Exported components with no page of their own and no mention worth making (internals of a documented parent). */
const UNDOCUMENTED_OK = new Set<string>([]);

describe("docs coverage", () => {
	it("mentions every exported component", () => {
		const all = pages.map((p) => p.src).join("\n");
		const missing = manifest.components
			.map((c) => c.name)
			.filter((n) => !UNDOCUMENTED_OK.has(n) && !new RegExp(`\\b${n}\\b`).test(all));
		expect(missing).toEqual([]);
	});

	it("has no stale allowlist entries", () => {
		const names = new Set(manifest.components.map((c) => c.name));
		expect([...UNDOCUMENTED_OK].filter((n) => !names.has(n))).toEqual([]);
	});
});

// ── internal links ───────────────────────────────────────────────────────────

/** GitHub-style slug used by Astro for heading ids. */
const slug = (h: string) =>
	h
		.toLowerCase()
		.replace(/`/g, "")
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.trim()
		.replace(/\s+/g, "-");

describe("docs links", () => {
	const slugs = new Set(
		pages.map((p) =>
			`/docs/${p.rel.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "")}/`.replace("//", "/")
		)
	);
	slugs.add("/docs/");
	const anchors = new Map(
		pages.map((p) => {
			const path = `/docs/${p.rel.replace(/\.mdx$/, "")}/`
				.replace(/\/index\/$/, "/")
				.replace("//", "/");
			const body = p.src.replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, "");
			const heads = [...body.matchAll(/^#{2,4}\s+(.+)$/gm)].map((m) => slug(m[1]));
			// <Demo title="…"> renders an <h2 id="slug">.
			for (const d of body.matchAll(/<(?:Demo|Props)\b[^>]*?title="([^"]+)"/g))
				heads.push(slug(d[1]));
			return [path, new Set(heads)];
		})
	);

	it("resolves every /docs/ link and #anchor in the prose", () => {
		const bad: string[] = [];
		for (const p of pages) {
			const here = `/docs/${p.rel.replace(/\.mdx$/, "")}/`
				.replace(/\/index\/$/, "/")
				.replace("//", "/");
			const prose = p.src.replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, "");
			for (const m of prose.matchAll(/\]\((\/docs\/[^)\s]*|#[^)\s]+)\)/g)) {
				const [path, hash] = m[1].startsWith("#") ? [here, m[1].slice(1)] : m[1].split("#");
				if (!anchors.has(path)) bad.push(`${p.rel}: ${m[1]} (no such page)`);
				else if (hash && !anchors.get(path)?.has(hash))
					bad.push(`${p.rel}: ${m[1]} (no such heading)`);
			}
		}
		expect(bad).toEqual([]);
	});
});
