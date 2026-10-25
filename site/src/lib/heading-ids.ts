/**
 * Heading ids of one docs page. Three things emit headings: the markdown body (`## Foo`, slugged by
 * Astro, and the table of contents links to those), `<Demo title>` and `<Props title>`. Each slugged on
 * its own, so two headings called "Props" or "Autoplay" shared an id and the in-page link and the
 * table of contents hit the first of them (#548).
 *
 * The docs route calls `startPage` with the body's own slugs before `<Content />` renders; the
 * components then take their id from `headingId`, which never returns one already taken on that page.
 * Body ids are never rewritten (the TOC points at them). A `<Demo>` keeps the plain catalog slug (it
 * is published as `…/#slug` in `catalog.json`), so a body heading that clashes with a demo title has
 * its component twin numbered, never the other way round: the demo slugs are claimed up front.
 */
export const slugOf = (title: string): string =>
	title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/** `title="…"` literals of the `<Demo>` elements of an MDX body. */
export const demoTitles = (body: string): string[] =>
	[...body.matchAll(/<Demo\s[^>]*?\btitle="([^"]+)"/g)].map((m) => m[1]);

interface Page {
	taken: Set<string>;
	/** Demo slugs not rendered yet: reserved for their `<Demo>`. */
	reserved: Set<string>;
}
const pages = new Map<string, Page>();

/**
 * @param bodyIds ids Astro gave the markdown headings
 * @param body raw MDX source, to reserve the demo slugs
 */
export function startPage(path: string, bodyIds: string[], body: string): void {
	pages.set(path, { taken: new Set(bodyIds), reserved: new Set(demoTitles(body).map(slugOf)) });
}

const unique = (page: Page, base: string, own: boolean): string => {
	const free = (id: string) => !page.taken.has(id) && (own || !page.reserved.has(id));
	let id = base;
	for (let n = 1; !free(id); n++) id = `${base}-${n}`;
	page.taken.add(id);
	return id;
};

/**
 * Id for the heading a component renders on `path`. `demo` is true for `<Demo>`: it may take its
 * own reserved slug (the first time) and, like any heading, takes the next free number otherwise.
 */
export function headingId(path: string, title: string, demo = false): string {
	const base = slugOf(title);
	const page = pages.get(path);
	if (!page) return base;
	if (demo && page.reserved.has(base) && !page.taken.has(base)) {
		page.taken.add(base);
		return base;
	}
	return unique(page, base, false);
}
