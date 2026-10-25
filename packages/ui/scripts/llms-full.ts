// Assembles the site's llms-full.txt, the file an agent pastes whole into its context. Its shape does not depend
// on how many pages exist: the core path is in full, every other page is a heading, its props tables and a link
// to its own complete file (/llms/<slug>.txt, with the prose and the demo sources). tests/llms-budget.test.ts
// asserts that shape and a size cap.
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
 * The pages an agent reads before it writes a screen, in full: the introduction, setup, the recipes, the decision
 * tables, the workarounds, theming, mobile, i18n, the agent guide and the layout primitives. The long single-task
 * guides (SEO, PWA, performance, accessibility, migrating from React) and every component page are summaries.
 */
export const CORE_PAGES: readonly string[] = [
	"index",
	ENTRY_PAGES.install,
	ENTRY_PAGES.recipes,
	ENTRY_PAGES.choosing,
	ENTRY_PAGES.workarounds,
	"getting-started/theming",
	"getting-started/mobile",
	"getting-started/i18n",
	ENTRY_PAGES.aiAgents,
	ENTRY_PAGES.reporting,
	"layout/layout-primitives",
];

/**
 * The props tables of a page as compact markdown: `| Prop | Type | Default |`, no description column. The
 * names, types and defaults are what an agent needs to write the call; the descriptions are in the page's file.
 */
export function propsSummary(markdown: string): string {
	return markdown
		.split(/\n(?=### )/)
		.filter((block) => /^### [^\n]*\n\n\| Prop \|/.test(block))
		.map((block) =>
			// The heading and the table only: prose and examples after the table are in the page's file.
			block
				.split("\n")
				.filter((line, i) => i < 2 || line.startsWith("|"))
				.map((line) => {
					if (!line.startsWith("|")) return line;
					// Cells are split on `|` that is not escaped as `\|` (a union type in a cell).
					const cells = line.split(/(?<!\\)\|/);
					return `|${cells[1]}|${cells[2]}|${cells[3]}|`;
				})
				.join("\n")
		)
		.join("\n\n");
}

/**
 * What a concept page contributes to llms-full.txt: its definition (the text before the first `## `) and the
 * sections an agent acts on, in page order: the contract and the paste-in prompt. The evidence, anti-patterns,
 * checklist, demos, limits and references stay in the page's own file (linked from the section), so a concept
 * costs about 3 KB and the file stays under its cap as concepts are added.
 */
export const CONCEPT_DIGEST_SECTIONS: readonly string[] = ["The contract", "Prompt for your AI"];

/** The digest of a concept page's markdown: the lead and the `CONCEPT_DIGEST_SECTIONS`. */
export function conceptDigest(markdown: string): string {
	const [lead, ...sections] = markdown.split(/\n(?=## )/);
	const keep = sections.filter((s) =>
		CONCEPT_DIGEST_SECTIONS.includes(s.match(/^## (.+)$/m)?.[1]?.trim() ?? "")
	);
	return [lead, ...keep].join("\n\n").trim();
}

export function buildLlmsFull(opts: { site: string; docs: LlmsFullDoc[] }): string {
	const parts = [
		"# CodeAtlas UI: full documentation",
		"",
		`> Open-source Svelte 5 component library (\`@codeatlasdev/ui\`). Index: ${opts.site}/llms.txt`,
		"",
	];
	for (const d of opts.docs) {
		const markdown = mdxToMarkdown(d.body);
		const props =
			CORE_PAGES.includes(d.slug) || d.group === "Concepts" ? "" : propsSummary(markdown);
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
			CORE_PAGES.includes(d.slug)
				? markdown
				: d.group === "Concepts"
					? conceptDigest(markdown)
					: props,
			""
		);
	}
	parts.push("---", "", CONSUMER_GUIDE.trim(), "");
	return parts.join("\n");
}
