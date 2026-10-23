// Assembles the site's llms-full.txt: every doc page with its complete demo sources, then the consumer guide.
import { CONSUMER_GUIDE } from "./ai-entry.ts";
import { mdxToMarkdown } from "./mdx-to-markdown.ts";

export interface LlmsFullDoc {
	group: string;
	title: string;
	/** Path relative to `site`. */
	url: string;
	description: string;
	/** Raw MDX body. */
	body: string;
	/** Raw demo sources by import name (`BasicSrc`), see `demoSources`. */
	sources?: Record<string, string>;
}

export function buildLlmsFull(opts: { site: string; docs: LlmsFullDoc[] }): string {
	const parts = [
		"# CodeAtlas UI: full documentation",
		"",
		`> Open-source Svelte 5 component library (\`@codeatlasdev/ui\`). Index: ${opts.site}/llms.txt`,
		"",
	];
	for (const d of opts.docs) {
		parts.push(
			"---",
			"",
			`# ${d.title}`,
			"",
			`Group: ${d.group}. URL: ${opts.site}${d.url}`,
			"",
			d.description,
			"",
			mdxToMarkdown(d.body, d.sources),
			""
		);
	}
	parts.push("---", "", CONSUMER_GUIDE.trim(), "");
	return parts.join("\n");
}
