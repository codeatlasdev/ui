/** A top-level docs section shown in the header (e.g. Guide, API, Compat). */
export interface DocsSection {
	id: string;
	label: string;
	/** Landing page of the section. */
	href: string;
}

/** A page link in the sidebar. */
export interface DocsNavItem {
	href: string;
	title: string;
	/** HTTP method (GET, POST...) rendered as a MethodBadge. */
	badge?: string;
}

/** A labelled group of page links in the sidebar. */
export interface DocsNavGroup {
	label?: string;
	items: DocsNavItem[];
}

/** A heading in the "On this page" index. */
export interface DocsHeading {
	id: string;
	text: string;
	depth: 2 | 3;
}

/** One entry of the search index consumed by DocsSearch. */
export interface DocsSearchEntry {
	href: string;
	title: string;
	/** Section label shown as context for page hits. */
	section: string;
	description: string;
	headings: { text: string; id: string }[];
	/** Plain body text, searched but never rendered. */
	text: string;
}
