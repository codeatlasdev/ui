/**
 * The gallery index files, built from the demo records:
 *   api/v1/index.json         every entry with its facets, plus per-facet counts (the file a search UI loads once)
 *   gallery/<id>.md           one markdown twin per id: facets, what it shows, spec, components, full source
 *
 * Pure: takes the demo records, returns `{ path: body }`. The caller decides where the files go.
 */
import { API_DIR, API_PATHS, apiUrl, SITE } from "../src/cli/agent-guide.ts";
import { type IndexFacets, PENDING_FACETS } from "./index-schema.ts";

/** The fields of a demo record the index reads (a subset of `ManifestDemo`). */
export interface IndexDemo {
	id: string;
	group: string;
	page: string;
	variant: string;
	title: string;
	summary: string;
	use: string;
	spec: string[];
	tags: string[];
	names?: string[];
	index: IndexFacets;
	components: string[];
	needs: string;
	demo: string;
	source: string;
}

export interface IndexEntry extends Partial<IndexFacets> {
	id: string;
	path: string;
	title: string;
	summary: string;
	use: string;
	tags: string[];
	names: string[];
}

/** Facets that are filter chips, and how to read their values off an entry. A pending facet is absent from the entry, so it has no counts. */
const COUNTED: Record<string, (e: IndexEntry) => string[] | undefined> = {
	kind: (e) => [e.kind as string],
	subtype: (e) => [`${e.kind}/${e.subtype}`],
	industry: (e) => e.industry,
	style: (e) => e.style,
	motion: (e) => e.motion && [e.motion],
	interaction: (e) => e.interaction,
	layout: (e) => e.layout && [e.layout],
	colorMode: (e) => e.colorMode && [e.colorMode],
	density: (e) => e.density && [e.density],
	tech: (e) => e.tech,
	cost: (e) => [e.cost as string],
	component: (e) => e.components,
};

/** The facets of a demo without the ones still pending review (see `PENDING_FACETS`). */
export function publishedFacets(index: IndexFacets): Partial<IndexFacets> {
	const out: Partial<IndexFacets> = { ...index };
	for (const f of PENDING_FACETS) delete out[f as keyof IndexFacets];
	return out;
}

export function indexEntries(demos: readonly IndexDemo[]): IndexEntry[] {
	return demos.map((d) => ({
		...publishedFacets(d.index),
		id: d.id,
		path: `${d.group}/${d.page}/${d.variant}`,
		title: d.title,
		summary: d.summary,
		use: d.use,
		tags: d.tags,
		names: d.names ?? [],
	}));
}

/** Count of entries per value of every filter facet; only values that occur are listed. */
export function facetCounts(
	entries: readonly IndexEntry[]
): Record<string, Record<string, number>> {
	const out: Record<string, Record<string, number>> = {};
	for (const [facet, read] of Object.entries(COUNTED)) {
		const counts: Record<string, number> = {};
		for (const e of entries) for (const v of read(e) ?? []) counts[v] = (counts[v] ?? 0) + 1;
		if (Object.keys(counts).length === 0) continue;
		out[facet] = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
	}
	return out;
}

/** Markdown twin of one entry: what a person or an agent reads without loading the page. */
export function entryMarkdown(d: IndexDemo): string {
	const f = d.index;
	const shown = (facet: string) => !(PENDING_FACETS as readonly string[]).includes(facet);
	const list = (v: string[]) => (v.length ? v.join(", ") : "none");
	return `${[
		`<!-- @codeatlasdev/ui demo #${d.id} · MIT License (c) CodeAtlas · ${SITE}/gallery/${d.id}/ -->`,
		`# #${d.id} ${d.title}`,
		"",
		d.summary,
		"",
		`When to use: ${d.use}`,
		"",
		"## Facets",
		"",
		`- Kind: ${f.kind} / ${f.subtype}`,
		...(shown("industry") ? [`- Industry: ${list(f.industry)}`] : []),
		...(shown("style") ? [`- Style: ${list(f.style)}`] : []),
		...(shown("motion") ? [`- Motion: ${f.motion}`] : []),
		...(shown("interaction") ? [`- Interaction: ${list(f.interaction)}`] : []),
		...(shown("layout") ? [`- Layout: ${f.layout}`] : []),
		...(shown("colorMode") ? [`- Color mode: ${f.colorMode}`] : []),
		...(shown("density") ? [`- Density: ${f.density}`] : []),
		`- Tech: ${list(f.tech)} (cost: ${f.cost})`,
		`- Reduced motion: ${f.a11y.reducedMotion ? "handled" : "not handled"}; keyboard: ${f.a11y.keyboard ? "operable" : "not interactive"}`,
		`- Components: ${list(d.components)}`,
		...(shown("aliases") && f.aliases.length
			? [`- Also searched as: ${f.aliases.join(", ")}`]
			: []),
		"",
		"## Spec",
		"",
		...d.spec.map((s) => `- ${s}`),
		"",
		`Needs: ${d.needs}`,
		`Live demo: ${d.demo}`,
		`Reference: ${apiUrl(API_PATHS.demoSource(d.id))}`,
		"",
		"## Source",
		"",
		"```svelte",
		d.source.trimEnd(),
		"```",
	].join("\n")}\n`;
}

/** Header and facet counts indented for reading, one entry per line so the file stays small and diffs per demo. */
function indexJson(entries: readonly IndexEntry[], version: string): string {
	const head = JSON.stringify(
		{
			version,
			count: entries.length,
			urls: {
				page: `${SITE}/gallery/{id}/`,
				markdown: `${SITE}/gallery/{id}.md`,
				reference: apiUrl(API_PATHS.demoSource("{id}")),
			},
			facets: facetCounts(entries),
		},
		null,
		"\t"
	);
	return `${head.slice(0, -2)},\n\t"entries": [\n${entries.map((e) => `\t\t${JSON.stringify(e)}`).join(",\n")}\n\t]\n}\n`;
}

/** `{ "api/v1/index.json": …, "gallery/<id>.md": … }` for every demo. */
export function buildIndexFiles(
	demos: readonly IndexDemo[],
	version: string
): Record<string, string> {
	const entries = indexEntries(demos);
	const files: Record<string, string> = {
		[`${API_DIR}/${API_PATHS.index}`]: indexJson(entries, version),
	};
	for (const d of demos) files[`gallery/${d.id}.md`] = entryMarkdown(d);
	return files;
}
