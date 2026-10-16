import type { DocsNavGroup, DocsSection } from "@codeatlasdev/ui";

/** Sidebar groups, in display order. A doc's frontmatter `group` must be one of these. */
export const GROUPS = [
	"Getting started",
	"Foundation",
	"Surfaces",
	"Inputs",
	"Display",
	"Feedback",
	"Navigation",
	"Layout",
	"Charts",
	"Docs kit",
] as const;
export type Group = (typeof GROUPS)[number];

export const SECTIONS: DocsSection[] = [
	{ id: "docs", label: "Docs", href: "/docs/" },
	{ id: "gallery", label: "Gallery", href: "/gallery/" },
	{ id: "templates", label: "Templates", href: "/templates/" },
	{ id: "theme", label: "Theme editor", href: "/theme/" },
	{ id: "changelog", label: "Changelog", href: "/changelog/" },
];

export interface DocMeta {
	slug: string;
	title: string;
	description: string;
	group: Group;
	order?: number;
}

export const docHref = (slug: string) => (slug === "index" ? "/docs/" : `/docs/${slug}/`);

/** Sidebar tree and flat reading order, derived from the collection (no hand-kept list to drift). */
export function buildNav(docs: DocMeta[]): { groups: DocsNavGroup[]; flat: DocMeta[] } {
	const byGroup = GROUPS.map((label) => ({
		label,
		docs: docs
			.filter((d) => d.group === label)
			.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.title.localeCompare(b.title)),
	}));
	return {
		groups: byGroup.map((g) => ({
			label: g.label,
			items: g.docs.map((d) => ({ href: docHref(d.slug), title: d.title })),
		})),
		flat: byGroup.flatMap((g) => g.docs),
	};
}
