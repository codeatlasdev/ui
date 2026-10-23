// Assembles the site's llms-full.txt: every doc page, then the consumer guide. The complete demo sources
// are left out on purpose (an agent pastes this file whole into its context, see tests/llms-budget.test.ts):
// each page points at its own /llms/<slug>.txt, which has them.
import { CONSUMER_GUIDE, ENTRY_PAGES, llmsPagePath } from "./ai-entry.ts";
import { mdxToMarkdown } from "./mdx-to-markdown.ts";

export interface LlmsFullDoc {
	group: string;
	title: string;
	/** Path relative to `site`. */
	url: string;
	description: string;
	/** Raw MDX body. */
	body: string;
	/** Docs slug (`layout/form-page`): names the page's own file. */
	slug: string;
}

/**
 * Pages whose body is not repeated here: `llms.txt` links their sections first, and /llms/<slug>.txt serves them whole.
 * Besides the recipes, these are the long task-specific guides (migrating from React, PWA, SEO): an agent opens one
 * only while doing that task, so pasting it into every context would spend the budget (tests/llms-budget.test.ts).
 */
const POINTER_ONLY = new Set<string>([
	ENTRY_PAGES.recipes,
	"getting-started/migrate-react",
	"getting-started/pwa",
	"getting-started/seo",
]);

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
			`Complete page with demo sources: ${opts.site}${llmsPagePath(d.slug)}`,
			"",
			d.description,
			"",
			POINTER_ONLY.has(d.slug)
				? d.slug === ENTRY_PAGES.recipes
					? `The ${d.title.toLowerCase()} are not repeated in this file: they are the first thing in ${opts.site}/llms.txt and each one is complete in the file above.`
					: `This guide is not repeated in this file (it is long and only needed for that one task): read it in the file above.`
				: mdxToMarkdown(d.body),
			""
		);
	}
	parts.push("---", "", CONSUMER_GUIDE.trim(), "");
	return parts.join("\n");
}
