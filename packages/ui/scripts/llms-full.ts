// Assembles the site's llms-full.txt: every doc page, then the repo AGENTS.md (one fetch covers everything).
import { mdxToMarkdown } from "./mdx-to-markdown.ts";

export interface LlmsFullDoc {
	group: string;
	title: string;
	/** Path relative to `site`. */
	url: string;
	description: string;
	/** Raw MDX body. */
	body: string;
}

export function buildLlmsFull(opts: {
	site: string;
	docs: LlmsFullDoc[];
	/** Contents of the repo AGENTS.md, appended verbatim as the last section. */
	agentsMd: string;
}): string {
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
			mdxToMarkdown(d.body),
			""
		);
	}
	parts.push(
		"---",
		"",
		"Agent guide: AGENTS.md from https://github.com/codeatlasdev/ui/blob/main/AGENTS.md",
		"",
		opts.agentsMd.trim(),
		""
	);
	return parts.join("\n");
}
