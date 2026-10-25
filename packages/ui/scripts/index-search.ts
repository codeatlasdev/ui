/**
 * Search and facet filtering over the gallery index. Pure and dependency-free: the gallery page (instant client-side
 * filtering) and the MCP tools (`search_ui`, `list_facets`, `get_related`) run this one module over the entries of
 * `api/v1/index.json`, so a filter means the same thing for a person and for an agent.
 *
 * Only published facets exist on an entry (see `publishedFacets`); a facet that is absent is never filterable.
 */
import type { IndexEntry } from "./index-build.ts";

/** Filter facets, as they are named in the URL (`?kind=section&style=brutalism`) and in `search_ui`. */
export const FILTER_FACETS = [
	"kind",
	"subtype",
	"style",
	"motion",
	"interaction",
	"layout",
	"colorMode",
	"density",
	"tech",
	"cost",
	"component",
] as const;
export type FilterFacet = (typeof FILTER_FACETS)[number];

/** Chosen values per facet. Several values of one facet are alternatives (OR); different facets all apply (AND). */
export type Filters = Partial<Record<FilterFacet, string[]>>;

/** The values an entry holds for a facet; `undefined` when the facet is not published for it. */
export function facetValues(e: IndexEntry, facet: FilterFacet): string[] | undefined {
	switch (facet) {
		case "kind":
			return [e.kind as string];
		case "subtype":
			return [`${e.kind}/${e.subtype}`];
		case "style":
			return e.style;
		case "motion":
			return e.motion && [e.motion];
		case "interaction":
			return e.interaction;
		case "layout":
			return e.layout && [e.layout];
		case "colorMode":
			return e.colorMode && [e.colorMode];
		case "density":
			return e.density && [e.density];
		case "tech":
			return e.tech;
		case "cost":
			return [e.cost as string];
		case "component":
			return e.components;
	}
}

/** Case-insensitive match that forgives `-`, `_` and spaces ("app list" finds AppList). */
const squash = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

/** Everything a word can match, in one squashed string per entry (build it once per entry, not per keystroke). */
export function haystack(e: IndexEntry): string {
	return squash(
		[
			e.id,
			e.title,
			e.summary,
			e.use,
			...e.tags,
			...(e.components ?? []),
			...(e.aliases ?? []),
		].join(" ")
	);
}

function matchesFilters(e: IndexEntry, filters: Filters, skip?: FilterFacet): boolean {
	for (const facet of FILTER_FACETS) {
		const wanted = filters[facet];
		if (facet === skip || !wanted?.length) continue;
		const has = facetValues(e, facet);
		if (!has || !wanted.some((w) => has.includes(w))) return false;
	}
	return true;
}

export interface SearchOptions {
	query?: string;
	filters?: Filters;
	/** Prebuilt `haystack` per id, so typing does not rebuild every string. */
	haystacks?: ReadonlyMap<string, string>;
}

/**
 * Entries that match every query word and every chosen facet, best match first. A word in the title or an alias
 * outranks one only in the summary; with no query the catalog order is kept (the ids are append-only).
 */
export function searchIndex(
	entries: readonly IndexEntry[],
	{ query = "", filters = {}, haystacks }: SearchOptions = {}
): IndexEntry[] {
	const words = query.split(/\s+/).map(squash).filter(Boolean);
	const scored: { e: IndexEntry; score: number }[] = [];
	for (const e of entries) {
		if (!matchesFilters(e, filters)) continue;
		let score = 0;
		if (words.length) {
			const hay = haystacks?.get(e.id) ?? haystack(e);
			if (!words.every((w) => hay.includes(w))) continue;
			const title = squash(e.title);
			const aliases = (e.aliases ?? []).map(squash);
			for (const w of words) {
				if (title.includes(w)) score += 4;
				if (aliases.some((a) => a.includes(w))) score += 3;
				if ((e.components ?? []).some((c) => squash(c).includes(w))) score += 2;
			}
		}
		scored.push({ e, score });
	}
	if (words.length) scored.sort((a, b) => b.score - a.score);
	return scored.map((s) => s.e);
}

/**
 * Chip counts: for each facet, how many entries would match if that value were also chosen, with the other facets'
 * choices applied (a facet's own choices are skipped so its siblings stay selectable). A value with count 0 is a
 * disabled chip.
 */
export function chipCounts(
	entries: readonly IndexEntry[],
	{ query = "", filters = {}, haystacks }: SearchOptions = {}
): Record<FilterFacet, Record<string, number>> {
	const words = query.split(/\s+/).map(squash).filter(Boolean);
	const out = {} as Record<FilterFacet, Record<string, number>>;
	for (const facet of FILTER_FACETS) out[facet] = {};
	for (const e of entries) {
		if (words.length) {
			const hay = haystacks?.get(e.id) ?? haystack(e);
			if (!words.every((w) => hay.includes(w))) continue;
		}
		for (const facet of FILTER_FACETS) {
			if (!matchesFilters(e, filters, facet)) continue;
			for (const v of facetValues(e, facet) ?? []) out[facet][v] = (out[facet][v] ?? 0) + 1;
		}
	}
	return out;
}

/** `?kind=a,b&style=x` to `Filters` (unknown facets and empty values are dropped). */
export function parseFilters(params: URLSearchParams): Filters {
	const out: Filters = {};
	for (const facet of FILTER_FACETS) {
		const raw = params.get(facet);
		const values = raw?.split(",").filter(Boolean);
		if (values?.length) out[facet] = values;
	}
	return out;
}

/** Writes the chosen facets into `params` (and removes the cleared ones), leaving every other parameter alone. */
export function writeFilters(params: URLSearchParams, filters: Filters): void {
	for (const facet of FILTER_FACETS) {
		const values = filters[facet];
		if (values?.length) params.set(facet, values.join(","));
		else params.delete(facet);
	}
}

/**
 * Entries related to `id`: first the ids the sidecar names, then the ones that share its subtype and the most styles
 * and components. Never includes `id` itself.
 */
export function relatedEntries(
	entries: readonly IndexEntry[],
	id: string,
	limit = 8
): IndexEntry[] {
	const self = entries.find((e) => e.id === id);
	if (!self) return [];
	const named = new Map((self.related ?? []).map((r, i) => [r, i]));
	const share = (a: readonly string[] = [], b: readonly string[] = []) =>
		a.filter((x) => b.includes(x)).length;
	return entries
		.filter((e) => e.id !== id)
		.map((e) => ({
			e,
			score: named.has(e.id)
				? 1000 - (named.get(e.id) as number)
				: (e.kind === self.kind && e.subtype === self.subtype ? 10 : 0) +
					share(e.style, self.style) * 2 +
					share(e.components, self.components),
		}))
		.filter((r) => r.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((r) => r.e);
}
