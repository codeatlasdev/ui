import type { DocsSearchEntry } from "@codeatlasdev/ui";

/** Props every site header shares, whatever the page: one brand label, one search index. */
export const siteHeader = {
	brandLabel: "CodeAtlas UI home",
	searchIndex: (): Promise<DocsSearchEntry[]> => fetch("/search-index.json").then((r) => r.json()),
};
