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
		// The example is the route file: the first svelte fence. A recipe may lead with a `ts` fence
		// (its `src/lib/messages.ts`), which is not the screen.
		const fence =
			body.match(/```svelte[^\n]*\n([\s\S]*?)\n```/) ?? body.match(/```[a-z]*\n([\s\S]*?)\n```/);
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
	const html = i.href ?? ((slug: string) => `${SITE}/docs/${slug}/`);
	// Every page is listed by its agent-readable file; the HTML form follows in the description.
	const href = (slug: string) => `${SITE}${llmsPagePath(slug)}`;
	const bySlug = new Map(i.docs.map((d) => [d.slug, d]));
	const withHtml = (slug: string, description?: string) =>
		[description, `HTML: ${html(slug)}`].filter(Boolean).join(" ");
	const page = (slug: string, fallback: string) => ({
		title: bySlug.get(slug)?.title ?? fallback,
		href: href(slug),
		description: withHtml(slug, bySlug.get(slug)?.description),
	});
	const deprecated = (d: DocLink) => /^deprecated\b/i.test(d.description);
	const entry = new Set<string>(Object.values(ENTRY_PAGES));

	// A .txt has no anchors, so each recipe is its own file; the whole page stays one link away.
	const sections = [
		{
			heading: "Start here: build a screen",
			links: [
				// Single-screen apps have no shell to supply <main>: Standalone page leads the list.
				...[...i.recipes]
					.sort((a, b) => +(b.id === "standalone-page") - +(a.id === "standalone-page"))
					.map((r) => ({
						title: r.title,
						href: `${SITE}${llmsRecipePath(r.id)}`,
						description:
							r.id === "standalone-page"
								? "one screen with no shell (single dashboard, board or map): owns its <main>; start here for single-screen apps"
								: "complete copy-pasteable page",
					})),
				{
					title: "All recipes",
					href: `${SITE}${llmsPagePath(ENTRY_PAGES.recipes)}`,
					description: "every recipe on one page, with the rules that apply to all",
				},
			],
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
			heading: "Concepts",
			links: [
				{
					title: "Viewport-complete UX",
					href: `${SITE}${llmsPagePath("concepts/viewport")}`,
					description:
						"the first screen, viewport units, safe areas, the keyboard, reflow and the cue that there is more below; every claim carries a strength label, scope and sources, or ask the MCP server (`list_concepts`, `get_concept`)",
				},
			],
		},
		{
			heading: "Design atlas",
			links: [
				{
					title: "Design atlas",
					href: `${SITE}/llms/atlas.txt`,
					description:
						"269 terms for aesthetics, layouts, interaction patterns and design-system languages, by category; one file per term at /llms/atlas/<slug>.txt, or ask the MCP server (`search_terms`, `get_term`). The 1 to 5 scores are heuristic and an audience is a hypothesis",
				},
				{
					title: "How we use evidence",
					href: `${SITE}${llmsPagePath("concepts/evidence")}`,
					description:
						"the five strength labels and the rules every concept and atlas entry follows: read it before you quote a claim about users",
				},
			],
		},
		{
			heading: "Design styles",
			links: [
				{
					title: "Design styles",
					href: `${SITE}/llms/styles.txt`,
					description:
						'six design-style recipes (Swiss, Editorial, Brutalism, Sketchbook, Glassmorphism, Terminal): traits, do and don\'t, accessibility pitfalls with their sources, the `designStyle("<id>")` recipe and a prompt; one file per style at /llms/styles/<id>.txt, or ask the MCP server (`get_style`). A recipe is a proposal, not a measurement, and no claim says a style performs better',
				},
			],
		},
		{
			heading: "Machine-readable endpoints",
			links: [
				{
					title: "llms-full.txt",
					href: `${SITE}/llms-full.txt`,
					description:
						"the core pages in full and a summary (props tables) of every other page, in one file small enough to paste whole",
				},
				{
					title: "Page with demo sources",
					href: `${SITE}${llmsPagePath("layout/form-page")}`,
					description: `one docs page with the complete source of its demos: ${SITE}/llms/<group>/<slug>.txt, the slug is the docs URL path (an index page has none: ${SITE}/llms/charts.txt)`,
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
				.map((d) => ({
					title: d.title,
					href: href(d.slug),
					description: withHtml(d.slug, d.description),
				})),
		})),
		{
			heading: "Deprecated (do not use in new code)",
			links: i.docs
				.filter((d) => deprecated(d))
				.map((d) => ({
					title: d.title,
					href: href(d.slug),
					description: withHtml(d.slug, d.description),
				})),
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
			"Fetch the `.txt` links (`/llms/<group>/<slug>.txt`, index pages `/llms/<slug>.txt`, one recipe `/llms/recipes/<id>.txt`): they are plain markdown with the full demo sources and no anchors; the HTML pages (`/docs/...`) are for people and the only place the live demos run.",
			'How to use this file: find the screen you are building under "Start here", copy that recipe whole, change only data, copy and theme. Before writing any CSS, wrapper or workaround, read "Choosing a component" and "Common workarounds". Never guess a prop: ask the ca-ui-mcp server (`get_component`, `get_recipe`) or read the installed package\'s `dist/components.json` (`.components[]`, one entry per component; other exports under `.exports[]`); the installed version outranks every page here.',
		],
		sections,
	});
}

/**
 * Path of the complete, single-page file of a docs page: `layout/form-page` -> `/llms/layout/form-page.txt`.
 * An index page's slug has no `/index` (`charts`, `map`), so it is `/llms/charts.txt`.
 */
export const llmsPagePath = (slug: string) => `/llms/${slug}.txt`;

/** Path of the file of one recipe section: `list-page` -> `/llms/recipes/list-page.txt`. */
export const llmsRecipePath = (id: string) => `/llms/recipes/${id}.txt`;

/** One recipe as a standalone markdown file (a `.txt` has no anchors, so the section gets its own). */
export function buildLlmsRecipe(i: { site: string; recipe: Recipe }): string {
	return [
		`# ${i.recipe.title}`,
		"",
		`Recipe of ${i.site}${llmsPagePath(ENTRY_PAGES.recipes)}. Index: ${i.site}/llms.txt`,
		"",
		i.recipe.markdown,
		"",
	].join("\n");
}

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
- [Recipes](${SITE}${llmsPagePath(ENTRY_PAGES.recipes)}): complete pages to copy (one file per recipe: ${SITE}/llms/recipes/<id>.txt)
- [Choosing a component](${SITE}${llmsPagePath(ENTRY_PAGES.choosing)}): X vs Y decision tables
- [Common workarounds](${SITE}${llmsPagePath(ENTRY_PAGES.workarounds)}): what you are about to write, and what to use instead
- [llms-full.txt](${SITE}/llms-full.txt): the core docs in full and a summary of every other page, in one file
- [Contributor guide](AGENTS.md): working on this repository (not for apps that consume the package)
- [Source](packages/ui/src/lib/index.ts): public exports
`;
}
