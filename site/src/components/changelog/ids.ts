// Deterministic element ids for the scenes. An id only has to be unique within one page, and the same scene is drawn
// twice on a page (an index card and the post) or many times on the index. A counter per page, not `Math.random()`:
// the same source renders to the same bytes, so the built HTML and its social card stay stable between builds.
const perPage = new Map<string, number>();

/** `prefix-<n>`, n counting up per page path (`Astro.url.pathname`). */
export function nextId(page: string, prefix: string): string {
	const n = (perPage.get(`${page}|${prefix}`) ?? 0) + 1;
	perPage.set(`${page}|${prefix}`, n);
	return `${prefix}-${n}`;
}
