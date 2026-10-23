// The one canonical AI entry point (#384): builds the `llms.txt` of the docs site and the stub that
// sits at the repo root, plus the recipe list the MCP `get_recipe` tool serves. Pure functions: the
// site endpoint, the manifest build and the tests all feed them data, so the three can never drift.
import { llmsTxt } from "../src/lib/seo/llms.ts";
import { mdxToMarkdown } from "./mdx-to-markdown.ts";

export {
	CONSUMER_GUIDE,
	ENTRY_PAGES,
	GUIDE_END,
	GUIDE_START,
	SITE,
} from "../src/cli/agent-guide.ts";

import { ENTRY_PAGES, SITE } from "../src/cli/agent-guide.ts";

export interface DocLink {
	slug: string;
	title: string;
	description: string;
	group: string;
}

export interface Recipe {
	/** Anchor on the recipes page: `app-shell`. */
	id: string;
	title: string;
	/** Complete example (first fenced block of the section), `undefined` for a section without one. */
	example?: string;
	/** Markdown of the whole section, heading excluded. */
	markdown: string;
}

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

/**
 * Splits the markdown of the recipes page into one recipe per `## ` section that carries a fenced example.
 * The intro and the closing "does not fit" section have no example and are not recipes.
 */
export function parseRecipes(markdown: string): Recipe[] {
	const out: Recipe[] = [];
	let inFence = false;
	let cur: { title: string; lines: string[] } | undefined;
	const flush = () => {
		if (!cur) return;
		const body = cur.lines.join("\n").trim();
		const fence = body.match(/```[a-z]*\n([\s\S]*?)\n```/);
		if (fence)
			out.push({ id: slugify(cur.title), title: cur.title, example: fence[1], markdown: body });
		cur = undefined;
	};
	for (const line of markdown.split("\n")) {
		if (/^\s*```/.test(line)) inFence = !inFence;
		const h = !inFence && line.match(/^## (.+)$/);
		if (h) {
			flush();
			cur = { title: h[1].trim(), lines: [] };
		} else cur?.lines.push(line);
	}
	flush();
	return out;
}

/** Docs `group` order used for the page index at the bottom of llms.txt; deprecated pages go last. */
export function buildLlmsIndex(i: {
	docs: DocLink[];
	recipes: Recipe[];
	groups: readonly string[];
	/** `/docs/<slug>/` for a doc slug. */
	href?: (slug: string) => string;
	version?: string;
	counts?: { demos: number };
}): string {
	const href = i.href ?? ((slug: string) => `${SITE}/docs/${slug}/`);
	const bySlug = new Map(i.docs.map((d) => [d.slug, d]));
	const page = (slug: string, fallback: string) => ({
		title: bySlug.get(slug)?.title ?? fallback,
		href: href(slug),
		description: bySlug.get(slug)?.description,
	});
	const deprecated = (d: DocLink) => /^deprecated\b/i.test(d.description);
	const entry = new Set<string>(Object.values(ENTRY_PAGES));

	const recipesHref = href(ENTRY_PAGES.recipes);
	const sections = [
		{
			heading: "Start here: build a screen",
			links: i.recipes.map((r) => ({
				title: r.title,
				href: `${recipesHref}#${r.id}`,
				description: "complete copy-pasteable page",
			})),
		},
		{
			heading: "Before you write a workaround",
			links: [
				{ ...page(ENTRY_PAGES.choosing, "Choosing a component") },
				{ ...page(ENTRY_PAGES.workarounds, "Common workarounds") },
				{ ...page(ENTRY_PAGES.reporting, "Reporting problems") },
			],
		},
		{
			heading: "Setup",
			links: [page(ENTRY_PAGES.install, "Installation"), page(ENTRY_PAGES.aiAgents, "AI agents")],
		},
		{
			heading: "Machine-readable endpoints",
			links: [
				{
					title: "llms-full.txt",
					href: `${SITE}/llms-full.txt`,
					description:
						"every docs page as markdown in one file (no demo sources: it is meant to be pasted whole)",
				},
				{
					title: "Page with demo sources",
					href: `${SITE}${llmsPagePath("layout/form-page")}`,
					description: `one docs page with the complete source of its demos: ${SITE}/llms/<group>/<slug>.txt, the slug is the docs URL path`,
				},
				{
					title: "Demo catalog",
					href: `${SITE}/api/v1/catalog.json`,
					description: "every numbered demo (#NNN): id, page, components, summary",
				},
				{
					title: "Demo source",
					href: `${SITE}/api/v1/en/e/001.txt`,
					description: "one demo as text: swap 001 for any id from the catalog",
				},
				{
					title: "Demo index (TSV)",
					href: `${SITE}/api/v1/en/catalog.tsv`,
					description: "id, group, page, title, tags, summary: grep it",
				},
				{
					title: "Agent prompt",
					href: `${SITE}/prompt.txt`,
					description: "the paste-in prompt: MCP server, skill, init, demos",
				},
			],
		},
		...i.groups.map((heading) => ({
			heading: `Docs: ${heading}`,
			links: i.docs
				.filter((d) => d.group === heading && !entry.has(d.slug) && !deprecated(d))
				.map((d) => ({ title: d.title, href: href(d.slug), description: d.description })),
		})),
		{
			heading: "Deprecated (do not use in new code)",
			links: i.docs
				.filter((d) => deprecated(d))
				.map((d) => ({ title: d.title, href: href(d.slug), description: d.description })),
		},
		{
			heading: "Optional",
			links: [
				{
					title: "Source",
					href: "https://github.com/codeatlasdev/ui",
					description: "repository, issues and changelog",
				},
				{
					title: "npm",
					href: "https://www.npmjs.com/package/@codeatlasdev/ui",
					description: "published package",
				},
			],
		},
	];
	const counts = i.counts ? ` ${i.counts.demos} numbered demos.` : "";
	return llmsTxt({
		title: "CodeAtlas UI",
		summary:
			`Svelte 5 component library (\`@codeatlasdev/ui\`${i.version ? ` ${i.version}` : ""}): page templates, app shell, data tables, charts, forms and overlays, with a theme engine and native-feeling mobile behavior.${counts} Install with \`bun add @codeatlasdev/ui\`.`
				.replace(/\s+/g, " ")
				.trim(),
		intro: [
			'How to use this file: find the screen you are building under "Start here", copy that recipe whole, change only data, copy and theme. Before writing any CSS, wrapper or workaround, read "Choosing a component" and "Common workarounds". Never guess a prop: ask the ca-ui-mcp server (`get_component`, `get_recipe`) or read the installed package\'s `dist/components.json`; the installed version outranks every page here.',
		],
		sections,
	});
}

/** Path of the complete, single-page file of a docs page: `layout/form-page` -> `/llms/layout/form-page.txt`. */
export const llmsPagePath = (slug: string) => `/llms/${slug}.txt`;

/** One docs page as markdown with the complete source of every demo: small enough to fetch alone. */
export function buildLlmsPage(i: {
	site: string;
	doc: { title: string; group: string; url: string; description: string; body: string };
	/** Demo sources by import name, see `demoSources`. */
	sources: Record<string, string>;
}): string {
	return [
		`# ${i.doc.title}`,
		"",
		`Group: ${i.doc.group}. URL: ${i.site}${i.doc.url}`,
		`Index: ${i.site}/llms.txt`,
		"",
		i.doc.description,
		"",
		mdxToMarkdown(i.doc.body, i.sources),
		"",
	].join("\n");
}

/** The stub that lives at the repo root: same entry, no copy of the index to rot. */
export function buildRepoLlms(): string {
	return `# @codeatlasdev/ui

> Svelte 5 component library. Documentation for AI agents has one canonical entry point: ${SITE}/llms.txt

${SITE}/llms.txt lists a recipe for every screen type (app shell, list, form, settings, auth, landing, dashboard, theming), the decision tables, the common workarounds and the machine-readable endpoints. This file is generated from the same source and only points there.

- [llms.txt](${SITE}/llms.txt): the canonical entry
- [Recipes](${SITE}/docs/${ENTRY_PAGES.recipes}/): complete pages to copy
- [Choosing a component](${SITE}/docs/${ENTRY_PAGES.choosing}/): X vs Y decision tables
- [Common workarounds](${SITE}/docs/${ENTRY_PAGES.workarounds}/): what you are about to write, and what to use instead
- [llms-full.txt](${SITE}/llms-full.txt): all docs in one file
- [Contributor guide](AGENTS.md): working on this repository (not for apps that consume the package)
- [Source](packages/ui/src/lib/index.ts): public exports
`;
}
